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

## the most basic BICEP

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

which renders to this in ARM template:

```json
{% include_raw "bicep/01_bicep.json", 39, 39 %}
```
