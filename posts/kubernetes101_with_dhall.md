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
*[kv-pairs]: Key-Value Pairs
*[k8s]: Kubernetes

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

#### ConfigMap

Let's start with the configmap. We're going to tke advantage of dhall's ability to load files as text to keep the drupal config as a separate file. This makes it possible to edit the file with syntax highlighters, linters, and validation tooling. It also makes it easier for drupal experts to just do their job without having to copypaste things into k8s manifest.

``` dhall
{% include resources/kubernetes101_with_dhall/ep04/drupal-config.dhall %}
```

I've set it up to accept a namespace and a name. It would be alright to hardcode these; but since we'll need to cross-reference the name in other places, I've kept it injectable. This way, we can have a variable in the dhall file which coordinates the whole deployment. This single variable will ensure that we always have the names in sync.

#### PersistentVolumeClaim

Nothing special about this PVC. Do be careful about what things are `Optional`s as they will require `Some`.

``` dhall
{% include resources/kubernetes101_with_dhall/ep04/drupal-files-pvc.dhall %}
```

#### Deployment

The Deployment is where we'll be able to use dhall to keep properties in sync with each other, like with the `label`s and the volume names.

We can also use Dhall to pull out some common functionality. Here, I pull out a little helper to generate the the `Probe`s. Most of the time, I will want to use the `tcpSocket`-type of probe. So I can pull this out into its own file so I can use it all over. It also allows us to not need to remember all the syntax for it, and only specify the things we can about.

``` dhall
{% include resources/kubernetes101_with_dhall/ep04/mkProbe.dhall %}
```

We can also use Dhall to give structure to "unstructured" fields. Here, the `resources` section is (by the spec) just kv-pairs for the requests and limits. But we want to give them cpu and memory, and we probably also have reasonable defaults that we normally want. In the `container-resource.dhall` file, we have 4 items we export:

1. Type : a Record Type which describes the fields we want

1. default : the defaults for that type. This makes it easier to override specific values

1. mkResources : this function transforms the requirements Type into the k8s type

1. default_resources : this is just a convenience for me, it is just the default which has been turned into the k8s type


The Deployment has a lot of components to get right. To get more informative errors from the dhall checker, you can work on it in pieces. You can also default with the empty record, like `k8s.DeploymentSpec::{=}`, to fill in some of typecheck holes and get the ones you are interested in.

``` dhall
{% include resources/kubernetes101_with_dhall/ep04/drupal-deployment.dhall %}
```

#### Bundling things all together

We can create a list similar to the last time we did this. Here, we're going to leave it easy to modify the namespace, by wrapping the whole thing in a function. If we wanted to ship this to other people, we would probably want to export the function itself.

``` dhall
{% include resources/kubernetes101_with_dhall/ep04/drupal.dhall %}
```

One thing to note is that we have to be careful with the Deployment, since the names for the ConfigMap and the PVC can be interchanged. This is because they are both `Text` types. Some type systems will let you define types which are backed by other types but are still disctinct. That is, we could say that `PVCName` and `ConfigMapName` are both backed by `Text`, but they cannot be assigned to each other. This doesn't work in Dhall, since they will both be normalised to `Text`. I haven't found a good way around this, which isn't great; but this is similar to many commonly used programming languages where there isn't really a way to distinguish between different `string`s or `bool`s. 

One way to push the problem a bit farther up is to use a portfolio for these arguments. We could define a record `{ PVCName : Text, ConfigMapName : Text }` and pass that around. This makes it harder to confuse the two while passing them around. This Record type also helps people load them correctly because the fields are explicitly named, which hopefully helps minimise those types of errors.


## Reference

Some items relate more to using dhall-kubernetes than to Mr. Geerling's introduction to kubernetes. I've stashed them here until I decide that they're too large and they become their own articles.

