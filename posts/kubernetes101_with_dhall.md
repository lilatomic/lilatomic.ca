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

let's start with the configmap. 