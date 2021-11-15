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

Bicep is a different way of deploying resources on Azure. It is hopefully less painful than ARM templates.

First I have to make fun of Azure for creating their own language instead of embedding it in existing languages like AWS did with the CDK. In the FAQ they have this gem explaining their reasoning:

    Why create a new language instead of using an existing one?

    [...] We decided our target audience would find it easier to learn Bicep rather than getting started with another language.

I don't think creating a new language is the way to not have to get started with a new language.

## The most basic BICEP

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
