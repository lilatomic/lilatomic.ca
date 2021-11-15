---
title: Having fun with Azure Bicep
description: Bicep is a different way of deploying resources on Azure. It is hopefully less painful than ARM templates.
date: 2021-11-14
tags:
  - trying
  - bicep
  - azure
layout: layouts/post.njk
buildscript: bicep.xonsh
---

# Having fun with Azure Bicep

Bicep is a different way of deploying resources on Azure. It is hopefully less painful than ARM templates. Following are my thoughts as I evaluate bicep as something we should incorporate in our stack. Hopefully they're useful for you if you're doing the same.

First I have to make fun of Azure for creating their own language instead of embedding it in existing languages like AWS did with the CDK. In the FAQ they have this gem explaining their reasoning:

    Why create a new language instead of using an existing one?

    [...] We decided our target audience would find it easier to learn Bicep rather than getting started with another language.

I don't think creating a new language is the way to not have to get started with a new language.

## Some basic BICEP

You can start by using bicep as less verbose ARM template right away. You can just put everything in bicep format, which requires a bit less ceremony than ARM templates.

```bicep
{% include_raw "bicep/00_bicep.bicep" %}
```

You can then render them to ARM templates with `az bicep build -f`

```json
{% include_raw "bicep/00_bicep.json" %}
```

Bicep also allows makes variables slightly less of a pain

```bicep
{% include_raw "bicep/01_bicep.bicep", 1, 3 %}
```

and then you can use them pretty easily with `${}` interpolation syntax

```bicep
{% include_raw "bicep/01_bicep.bicep", 18, 18 %}
```

which renders to this in ARM template so you don't have to write this:

```json
{% include_raw "bicep/01_bicep.json", 39, 39 %}
```

The variable system is pretty underwhelming, and closely matches the capabilities of ARM templates. For example, you can have Object types, but you can't type their fields. There are some more advanced functions, like `intersection` and `union`, but nothing approaching the capabilities of Dhall. Decorators allow for constraining the values of parameters, but they too aren't anything special. They're missing some fairly basic operations (like forcing alpha-numeric) and therefore can't describe most of the contstraints on Azure resources. This limitation is probably why there aren't decorators to enforce the constraints on azure resources. For example, you can't specify that a parameter must be a valid storageAccount access tier, perhaps by doing something like `@Microsoft.Storage/storageAccounts@2021-06-01.properties.accessTier`. The `@description` parameter is said to in some way be used in cases where bicep templates are made available in the portal. Parameter files are still JSON-only. There also isn't a command to scaffold to create a parameters file ready to be filled, which would be useful, since it knows which parameters need to be defined.

One neat feature is that you can involve a keyvault as a secret-store in the bicep template. It's limited to only assigning to a module parameter with a secure decorator. And you also can't push values to the keyvault. So again, it's basically like a slightly more convenient way of writing ARM templates.

## Control flow

Control flow is honestly pretty bad. It's one of the places where the veil between Bicep and ARM grows thin. You can conditionally deploy resources, but this is applied at the resource level. For an example of why this is bad: If you were in the tutorial and wanted to enable SQL auditing, you would need to create an "auditSettings" resource and a "storageAccounts" resource. If you wanted to conditionally enable this in production, you would need to add a condition for both of these. You would also need to add the condition to every parameter referencing the conditionally deployed resource. So instead of 1 condition, we have 4. And that's just in this example:

```bicep
{% include_raw "bicep/03_bicep.bicep", 47, 65 %}
```

Instead, we could have been able to define something like:

```bicep
{% include_raw "bicep/03_dream.bicep", 47, 67 %}
```

But we can't, because Bicep is not a language for deploying Azure resources, it's a language for creating ARM templates. It is simply not able to support constructs which are not representable to ARM templates. It is also not able to support partial application (binding some arguments), so that a Bicep file could generate a slightly simpler Bicep file.

A further limitation is that you cannot define a resource twice, even if the conditions are mutually exclusive. You also can't use the ternary to select between 2 separate definitions for the same resource. So if you wanted to change a storage account's sku, accessTier, name, and many other parameters, you have to apply the ternary to each of those.

You seem to be able to use the ternary to fudge something by reassigning to a variable, but it's messy. Also, you can't give the different versions of the resource the same name, because obviously that clashes.

```bicep
{% include_raw "bicep/03_hack.bicep", 25, 25 %}
```

The for-loops are functional. You get the item, the index, and also an opportunity to filter things with an `if` statement. The syntax is similar to Python for-comprehensions. There are some fancy features related to parallelism, like a batch size. You can also nest loops, which is not always guaranteed in these types of DSLs. For some situations, you only get the index and not the item, so it's more like a C-style loop. Not the end of the world, but still not ideal.

## Modules

Modules are just Azure Deployment resources expressed in Bicep. Because of this, they introduce a new object for whatever DAG-based workflow engine executes ARM templates. This means that if you had a single module with a quick item which was depended on by another quick item and a slow item, and you extracted the quick item and the slow item into a module, the other quick item will now have to wait for the module to finish, which means waiting for the long item.

Modules function basically exactly like the ARM Deployments they become. So modules don't export their contents. If you need to gain access to that information, you have to use outputs and fiddle with passing the correct information. You also can't just output the whole resource, so you'll either have to output all the parameters you need or reconstitute the resource with `existing`.

I see this as a missed opportunity. I think they could have provided much more helpful modules. I think that having each module correspond to an ARM Deployment was a bad choice that severely limits their options. For example, they can't output an entire resource from the module.
And although Bicep claims to be declarative, that isn't leveraged. Every resource declaration might as well be the correstponding az-cli command for all you can do with it. It's not possible to modify the resources defined in a module from outside it. For example, a module might have hard-coded a value on the assumption that no-one would need to change it. But now someone _does_ need to change it ("This data isn't speed-critical, can you put in at _cold_ tier?"). So you can't just modify that for this one case, and you have to crack open the original template and add _another_ paremeter that is used by only 1 group. Eventually your template starts to look like a helm chart, with more holes than not.
Even ignoring "advanced" use cases for modifying modules, adding role assignments to resources is a basic requirement and is a bit kludgy.

## Extensions : Roles, Policies, Locks, and Diagnostics

It honestly looks pretty alright attaching role assignments if you don't have to cross module boundaries. You can just reference the resource:

```bicep
{% include_raw "bicep/04_bicep.bicep", 18, 24 %}
```

If you do have to cross module boundaries, it gets kludgy.

I also haven't found a way to get a reference in a parent module of resources named in the child module. That is, if a module names a resource and passes that as an output, I can't use that to construct the `existing` reference. It complains that it needs something resolvable at the start of the deployment time...

## Scopes

There are many scopes which are not "the current resources group". Obviously, "another resource group". But also new resource groups are subscription-level objects, and there are Management Groups and Tenancies too.

In Bicep, you only specify the scope type that a file targets. The actual value must be passed in during its invocation. For example, to create a resource group and deploy a module to it, we can specify a file at the `'subscription'` target scope and then tell the module to deploy at the scope of the resource group we just created:

```bicep
{% include_raw "bicep/05_main.bicep" %}
```

You can also use functions to materialise the scopes you need. For example, you can get the tenant scope with the `tenant()` function, and a resource group with `resourceGroup('name-of-rg')`.

## Doing arbitrary things with deployment scripts

Deployment scripts are scripts run in docker containers as part of an ARM deployment. They use a managed identity (user assigned) to run. You can have them do basically whatever.

It's also fairly clean to do, you just have to create the MI and assign it permissions:

```bicep
{% include_raw "bicep/06_bicep.bicep", 1, 20 %}
```

and then running it is a bit of stuff but not too much:

```bicep
{% include_raw "bicep/06_bicep.bicep", 62, 90 %}
```

This feature isn't specific to Bicep. It is personally a bit exciting, since it might solve some headaches at work. Bicep has the added convenience of letting you load the contents of a script from a local file when preparing the template. This lets you actually test the script.

## Summary

In the end, this is just a less painful way to write ARM templates. Bicep isn't a replacement for ARM templates so much as it's a replacement for JSON. It's obviously less painful than JSON for ARM templates, and obviously we'll be using it instead of JSON.

I even think this might be better than az-cli commands, since it is about as verbose but comes with fun idempotency features. The problem becomes integrating it with other deployment tools, such as Ansible. The parameters file is pretty gross but does allow for specifying things as structured data, but so is templating a parent module with the parameters filled in. I'll probably look for a cooler solution, maybe an Ansible plugin.

But it's no CDK, and still has _all_ of the problems that ARM templates.
