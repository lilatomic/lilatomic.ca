---
title: The DNS Shenanigans that make Azure Private Endpoints Work
description: Azure private endpoints allow you to privately access services via their public DNS names. DNS shenanigans are at play.
date: 2024-02-11
tags:
  - azure
  - hindsight
layout: layouts/post.njk
---

<!-- prettier-ignore-start -->
*[PE]: Private Endpoint
*[PL]: Private Link
*[VNet]: Virtual network
*[DNS]: Domain Name System
*[CNAME]: Canonical name, a pointer to another domain name
*[LRS]: Locally Redundant Storage, a redundancy level in Azure that stores data in 1 zone
*[ZRS]: Zone Redundant Storage, a redundancy level in Azure that stores data in multiple zones
<!-- prettier-ignore-end -->

# The DNS Shenanigans that make Azure Private Endpoints Work

In Azure, you can create a PE to an IaaS service, like blobstores. These allow you to have a "local" IP in a VNet to the "internet" resource. Convenient. Just as convenient is that you can access them via their public DNS name: "myblobs.blob.core.windows.net" will work whether you're on the public Internet or your VNet.
How this works is interesting. The DNS name needs to resolve to a public IP on the Internet, but your custom local IP on your VNet. Not only are these 2 different, but one is in Public IP space and the other is (probably) in [RFC1918](https://en.wikipedia.org/wiki/Private_network) IP space.

## How it works

Let's examine the shenanigans that make this work by stepping through all the DNS configurations.

### A resource with no PEs

You'd expect this DNS to function normally: Just a pointer to an IP. It's more complicated, as Azure adds some redirect elements to make redundancy scenarios easier. For an LRS storage account, it's simply a CNAME to (presumably) a datacentre's name and then an A to the IP:

```command-line
dig +noall +answer myblobstorenopelrs.blob.core.windows.net
myblobstorenopelrs.blob.core.windows.net. 60 IN CNAME	blob.yto22prdstr05a.store.core.windows.net.
blob.yto22prdstr05a.store.core.windows.net. 86202 IN A 20.60.242.11
```

For a storage account with ZRS, there are multiple datacentres/zones that keep the data. We see the redirect to the store.core.windows.net domain this time redirect to a trafficmanager endpoint. This allows Azure to balance traffic between the 3 zones, which are the 3 A records.

```command-line
dig +noall +answer myblobstorenope.blob.core.windows.net
myblobstorenope.blob.core.windows.net. 7 IN	CNAME	blob.yto21prdstrz05a.store.core.windows.net.
blob.yto21prdstrz05a.store.core.windows.net. 7 IN CNAME	blob.YTO21PrdStrz05A.trafficmanager.net.
blob.YTO21PrdStrz05A.trafficmanager.net. 7 IN A	20.150.16.196
blob.YTO21PrdStrz05A.trafficmanager.net. 7 IN A	52.239.189.228
blob.YTO21PrdStrz05A.trafficmanager.net. 7 IN A	20.150.31.4
```

### A resource with a PE

Adding a PE to a resource engages the PL DNS machinery. This adds a redirection to a privatelink.blob.core.windows.net. It's this privatelink name that adds the decoupling that can redirect to the correct endpoint.

On the public Internet, this just forwards to the same datacentre or trafficmanager name as before:

```command-line
dig +noall +answer myblobstorepe.blob.core.windows.net
myblobstorepe.blob.core.windows.net. 60 IN	CNAME	myblobstorepe.privatelink.blob.core.windows.net.
myblobstorepe.privatelink.blob.core.windows.net. 60 IN CNAME blob.yto22prdstr03c.store.core.windows.net.
blob.yto22prdstr03c.store.core.windows.net. 86279 IN A 20.60.43.235
```

On the side of the VNet, this is supposed to redirect to the PE. Some additional infra/magic makes this work. The PE itself has the option of integrating with a Private DNS Zone Group. This is the default. And, if you've created this in the portal, it'll even create the privatelink DNS zone for you (in this case, blob.privatelink.core.windows.net). This Private DNS Zone Group must also be linked with the VNet for the records to show up with the Azure resolver (the default). (If you're using your own resolver, you'll want to figure out some really fun [split-horizon DNS](https://en.wikipedia.org/wiki/Split-horizon_DNS) and automatic loading of config into it.)

```command-line
dig +noall +answer myblobstorepe.blob.core.windows.net
myblobstorepe.blob.core.windows.net. 60 IN	CNAME	myblobstorepe.privatelink.blob.core.windows.net.
myblobstorepe.privatelink.blob.core.windows.net. 10 IN A 10.0.0.10
```

## Shenanigans!

This leads to some complications. There's [a doc](https://learn.microsoft.com/en-us/azure/private-link/private-endpoint-dns) on Azure that has some big red boxes about this. Let's go over them and include implementations of the workaround.

The privatelink DNS zone is needed for the PE to work. This DNS zone will only contain entries of PEs linked to it. But, every resource that has a PE anywhere has the CNAME redirect to a private endpoint. This means that if you try to use the public endpoint to access a resource that has a private endpoint, you will receive an NX for the privatelink domain and won't be able to. For example, our Private DNS zone from above only contains a record for myblobstorepe.privatelink.blob.core.windows.net, and it doesn't have a record for publicblob.privatelink.core.windows.net; therefore, we get NXDOMAIN and can't access a publicly accessible resource.

This requirement for a private DNS zone that will NX other records also prevents you from using service endpoints and private endpoints together in similar circumstances. You'll have to complete the DNS chain yourself.

One solution is to add the missing DNS record manually. In our example, we could add the record `publicblob.privatelink.blob.core.windows.net. 60 IN CNAME blob.yto22prdstr03c.store.core.windows.net.`. This is fiddly. Finding the value for the target requires some manual intervention. The target is obviously internal to Azure. I have no idea how often or if ever it changes. From my experience, it hasn't changed in a year. But is also clearly linked to the region and zones the storage account is in, so it could change suddenly if the owner of the storage account reconfigures it in ways that would seem safe.
