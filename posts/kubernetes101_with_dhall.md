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
*[PVC]: Persistant Volume Claim

# Learning Kubernetes with dhall-kubernetes

This is mostly me trying to use dhall-kubernetes effectively. I am using Jeff Geerling's Kubernetes 101 series as an exercise set. I figure that following along with a paced course on k8s will allow me to discover neat ways of using dhall-kubernetes to make manifests which are better in almost all ways than straight YAML.

## Episode 3 : Deploying Apps

The first manifests we deploy are for a drupal app. We could always bash everything together in the same Dhall file and ignore all the features of Dhall. For example, we could have the namespace parameter specified at every location where it is used. This would limit the gains of using Dhall to a type-checked config. But there is a cost to this type-checking, since Dhall (and especially dhall-kubernetes) force us to be very specific about everything. This includes fields which are technically optional but it is almost certainly a mistake to leave blank, like the name of a PVC.

So we're going to jump in making reasonable assumptions about what might work. You can follow along here with my thought process, and I'll try to collect the results of this process into a separate article.

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

### MariaDB

#### PersistentVolumeClaim

This is identical to the other PVC, except for the name. We can just reuse the function we had for that. We might want to rename the file and consider extracting this to a separate function (with a parameter for the size) so that we can reuse it everywhere. Or we don't have to, YAML gives us no ability to reuse these pieces. (Well, there are [YAML Anchors](https://yaml.org/spec/1.2/spec.html#id2785586), but I have never seen these in the wild.)

#### Deployment 

We create a handy helper to transform maps into the specific type. Having to do a bit of munging for what would otherwise just be kv-pairs in YAML is a bit of a pain point for using Dhall. If you have some helpers it's just a bit more ceremony.

``` dhall
{% include resources/kubernetes101_with_dhall/ep04/mkEnv.dhall %}
```

The deployment is pretty similar to the drupal one. Note that we make it really easy to change the credentials. Security is everyone's business.

``` dhall
{% include resources/kubernetes101_with_dhall/ep04/mariadb-deployment.dhall %}
```

#### Service

The service is also very similar to the other one. So let's refactor it. I've put a single parameter here for the port, and I've used the full dhall-kubernetes type. I could have wrapped the port in a custom record and built it, but I didn't think there was a need for that, since it's a fairly simple resource. (Unlike with `ObjectMeta`, where I there's a bit of fiddling to marshall it.). I've also decided to only accept a single port. In most cases, this will be fine, since I will only be exposing a singly port, and this function signature maps closer to that use case. In cases where I'd need more ports, there are a few options: I could just write the thing as a one-off, I could write a new function, or I could use one of Dhall's fun record-modifier operations.

``` dhall 
{% include resources/kubernetes101_with_dhall/ep04/service.dhall %}
```

#### Tying things together

We just make one big k8s list of things which includes all of our things. We use Dhall's ability to include values from environment variables to pass in the DB credentials. This way, we don't have to write them into the config file, but they'll show up when we render the file with those variables set.

``` dhall
{% include resources/kubernetes101_with_dhall/ep04/mariadb.dhall %}
```



