---
title: Writing a Vars Plugin in Ansible
description: How to write an Action Plugin in Ansible. These let you load variables.
date: 2021-03-10
tags:
  - ansible
layout: layouts/post.njk
---

# Writing a Vars Plugin in Ansible

Often there are facts you wish were just ambiently available, especially if you are working with cloud infrastructure. For example, you might want to have your subscription id, tenant id, user object id, contents of a resource group, and many other things. You could have tasks which set these as facts, but that severly limits your ability to resume at a task.

## Basic outline

The most basic version of a vars plugin is just a reflectable classname and method name.

```python
from ansible.plugins.vars import BaseVarsPlugin

class VarsModule(BaseVarsPlugin):

	def get_vars(self, loader, path, entities, cache=None):
		return {}
```

Let's get our documentation in order. We want to include this fragment to let people know how to set when the plugin runs (See [Execution](#execution) for why)

```yaml
vars: gitroot
version_added: "0.2" # for collections, use the collection version, not the Ansible version
short_description: Finds the git root
description: Finds the git root
options:
  stage:
    ini:
      - key: stage
        section: lilatomic.alpacloud.gitroot
    env:
      - name: LILATOMIC_ALPACLOUD_GITROOT
extends_documentation_fragment:
  - vars_plugin_staging
```

Combining we get a sample like:

```python
{% include_raw "ansible_plugins/vars/basic.py" %}
```

This sample is really bad, because it gets executed _a lot_ (See [Execution](#execution)). So we want to build some caching into it. This is patterned off of how host_group_vars does it (the only vars plugin included in base), but other vars plugins do a similar thing:

```python
{% include_raw "ansible_plugins/vars/basic_cache.py" %}
```

## Using hosts and groups

In the above example, we added a general var (one which isn't attached to a particular host). We may want to add other data associated with each host or group. There are a couple moving pieces detailed in the following:

```python
{% include_raw "ansible_plugins/vars/entities.py" %}
```

## Loading files

You can probably figure out how to load files by cribbing from the host_group_vars plugin. I've included one here for completeness. The main difference is that `loader.load_from_file` only supports YAML/JSON, so we write our own little functionlet.

```python
{% include_raw "ansible_plugins/vars/entity_files.py" %}
```

## Execution

Vars plugins are invoked at 2 stages:

1. Inventory : upon initial inventory parsing

- once for every group (including "all" and "ungrouped")
- once for every host

1. Task : every task

- once per cartesian product of:
  - entity: hostname or group involved in the play
  - path:
    - each inventory source path
    - the basedir for the play (or the nested play)

This can be specified with the option specified in the documentation.

This is why you want your plugin to implement a load phase and some form of caching!
