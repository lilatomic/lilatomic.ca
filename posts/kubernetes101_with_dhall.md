---
title: Learning Kubernetes with dhall-kubernetes
description: Following along with Jeff Geerling's Kubernetes 101
date: 2020-12-28
tags:
  - kubernetes
  - infra
  - using
  - dhall
layout: layouts/post.njk
---
*[NPE]: Null Pointer Exception

# Learning Kubernetes with dhall-kubernetes

## Episode 1 : Introduction

## Episode 2 : Containers

## Episode 3 : Deploying Apps

### Deploying the hello-go app

The first thing we deploy in this episode is simply the hello-go app. This first one is basically straight out of the sample for dhall-kubernetes, so we're just going to breeze on through.

So let's get started! by importing the dhall-kubernetes package:

``` dhall
let k8s =
      https://raw.githubusercontent.com/dhall-lang/dhall-k8s/master/package.dhall sha256:ef3845f617b91eaea1b7abb5bd62aeebffd04bcc592d82b7bd6b39dda5e5d545
```

The hash will probably not match, since they will have made new commits. You can refreeze the import and then it'll match.

You can build things up in pieces. This can help the error messages be slightly more intelligible, since they'll be smaller. That's what I did:

``` dhall
{% include resources/kubernetes101_with_dhall/ep03/hello-go.dhall %}
```

Honestly that's pretty verbose and dubiously better than YAML. At least it'll complain _before_ you submit it to kubernetes or kick off your pipeline.
But Dhall has Functions! And if all you have are 30 different microservices written in Go, we can turn this into a function:

``` dhall
{% include resources/kubernetes101_with_dhall/ep03/hello-go-function.dhall %}
```

There we go, now we wouldn't have to involve any k8s templating/modification stuff to generate the same file but with different names

### Exposing the hello-go app

This one's pretty easy, too. We _do_ reuse the ObjectMeta field, maybe we should be passing _that_ around.

``` dhall
{% include resources/kubernetes101_with_dhall/ep03/hello-go-service.dhall %}
```

### Deploying Dhall

`kubectl` doesn't accept dhall. So we'll need to transform our manifests into something which `kubectl` can deploy, like [yaml](https://noyaml.com). We can use `dhall-to-yaml` for that, and then deploy with `kubectl apply`. The `-f -` argument to `kubectl` lets us ingest from the command line.

``` shell
dhall-to-yaml --file hello-go-service.dhall | kubectl apply -f -
```

This allows us to deploy a single item at a time. But Kubernetes supports the ability to deploy a multidocument yaml file. Unfortunatly dhall-kubernetes [doesn't support this](https://github.com/dhall-lang/dhall-kubernetes#can-i-generate-a-yaml-file-with-many-objects-in-it). The recommended solution is to use the k8s `list` object with the provided `typesUnion.dhall`. This extra dhall file is just all the k8s objects as a union type, so they can be put in the same list. Funny enough, `list` isn't in the types, so you'll have to build it yourself. You can use it like so (add items ):

``` dhall
{% include resources/kubernetes101_with_dhall/ep03/hello-go-deployment-and-service.dhall %}
```
## Episode 4 : Real-world Apps

Let's convert those manifests!

### drupal.yml


## Reference

Some items relate more to using dhall-kubernetes than to Mr. Geerling's introduction to kubernetes. I've stashed them here until I decide that they're too large and they become their own articles.

### Handling failure

One problem we run into is that some fields which we _know_ will be present cannot be validated to actually be there. For example, we want to access the name of the configmap, which can be found in the `metadata.name` attribute. However, this attribute can be unset (at least according to the schema. Kubernetes might be sad, but it won't be sad in advance). If you're used to most programming languages, we would either let it throw an NPE, or we would throw some other exception and abort the whole process. It's tempting to try to emulate that behaviour in dhall, and you can get something close with `assert`:

``` dhall
let Optional/null =
      https://raw.githubusercontent.com/dhall-lang/dhall-lang/master/Prelude/Optional/null.dhall

let q = Some 3
let _ = assert : Optional/null Natural q ≡ False
in {=}
```

But trying to use assertions in function bodies doesn't work. This is because assertions in dhall are designed for writing tests, not for checking input values. In fact, assertions are evaluated at [type-checking time](https://docs.dhall-lang.org/tutorials/Language-Tour.html#tests). So that's not really useful for us. We can reach (not too deeply) into the functional toolbox and use `Optionals` to ensure that our functions always return something, even if that something is nothing. We can then, when wiring everything together, use some other functional tricks to launch our assert.

The first part of the solution is to have our functions return an `Optional Type`. This will allow us to return `None Type` if things don't make sense. We then want to collect the results into a list so we can iterate over them all at once. We could do fancier FP things, but we're already gathering things into a `List ./typeUnion.dhall`, so turning it into a `List (Optional ./typeUnion.dhall)` is convenient and clear for anyone. Lastly, we assert that none of these are `None` with a handy call to `any` : 
``` dhall
{% include resources/kubernetes101_with_dhall/CheckManifest.dhall %}

-- And then in the real file

let k8sManifest = ???

let _ = assert : check k8sManifest ≡ True
```

I would like to point out, though, that a better solution is to make illegal (or just dumb) states unrepresentable. One example is something we've done extensively: We've used a function to ensure that the same value is used in the spots where they need to match. This is sometimes called a Construction Assurance, or something to that effect. 

One difficulty with this route is that the types in dhall-kubernetes sometimes lack the expressiveness we need. As a concrete example, the `ConfigMap.ObjectMeta.name` property is of type `Optional Text`. But we know we set it! We can sidestep this by defining a smarter type. This is an example implementation for ConfigMap:

``` dhall
{ name : Text
, namespace : Text
, data : List { mapKey : Text, mapValue : Text }
}
```

We can pass this one around instead of the k8s resource itself, guaranteeing that `name` is always set.

These non-api types can do more than just constrain fields to exist (or not exist). They can also refine the type definition to clarify why so many fields are optional. For example, the (now deprecated) Helm Chart for setting up a docker registry contains a [whole bunch of options](https://github.com/helm/charts/blob/master/stable/docker-registry/values.yaml) for storage. But this doesn't make sense, since you can only have 1 storage! So you could create a dhall union type to represent different storage types, and then a dhall type representing the registry would have a storage type as a field. Sketch implementation:

``` dhall
let storage_s3 = {???}
let storage_local = {???}
...
let registry_storage = < s3 storage_s3 | local storage_local | ... > 

let registry = { storage : registry_storage }
```