---
title: Writing a Filter Plugin in Ansible
description: How to write a Filter Plugin in Ansible. These let you process some data
date: 2021-02-24
revisions:
tags:
  - ansible
series: [ansible plugins]
layout: layouts/post.njk
---

# Writing a Filter Plugin in Ansible

You might find that you're doing the same kind of data-munging in multiple places. There are many cases where you'd want to pull this into a little named package:

- It requires logic which can't be expressed simply in basic jinja filters
- It's common and used in many places, so there's lots of duplication
- It's uncommon and you can never remember the requirements
- It's actually complicated
- You just want to name what these 3 filters do together

## Basic outline

The basic outline of a plugin is as follows:

```python
{% include_raw "ansible_plugins/filter/basic.py" %}
```

1. Create a class FilterModule
2. Create a function `filters`
3. Define your function
4. Return a dict with k-vs of `filter_name:function_reference`

## Documenting your plugin

If you want your documentation to work with the Ansible tooling (showing up nicely in the docs, working with `ansible-doc`), you can't use the standard ansible documentation, since Filter plugins don't show up as an option you can select documentation for. Go figure. You can still try to use the standard documentation features, though.

{% include_raw "ansible_plugins/documenting.fragment.md" %}

## Common things you'd want to do

### Using an existing filter

If you want to use an existing filter pluging (perhaps to format your output), you can just import them from the Ansible package:

```python
from ansible.plugins.filter.core import to_json, quote
```

### Including other parameters in your filter

If you want to have other parameters in your filter, you can just do that

```python
{% include_raw "ansible_plugins/filter/multiple_parameters.py" %}
```

and then use that like you'd expect, more or less

```python
{% raw %} "{{ '10.0.1.0/24' | ip_in_snet(10) }}" {% endraw %}
```

### Building an extractor

Sometimes you can't remember the sequence of keys you need to extract that thing you want from the huge JSON blob. You can write a simple extractor:

```python
{% include_raw "ansible_plugins/filter/extractor.py" %}
```

## Abusing filters as functions

Let's say that you want to have some functions assemble things, like you would with some proper typed data modelling. I'm not saying this is a _good_ idea, but you can use functions as the closest thing to that (it's not really close). For an example, I always forget the little fiddly bits of assembling an Azure Storageaccount Lifecycle Policy. I could do the following:

```python
{% include_raw "ansible_plugins/filter/filter_as_function.py" %}
```

And yes, you can also build filters to construct those `filters` and `blob_actions`, and make a terrible filter chain. But maybe don't and just write a one-off plugin.
