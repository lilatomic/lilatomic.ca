---
title: Writing an Action Plugin in Ansible
description: How to write an Action Plugin in Ansible. These let you add custom tasks to your playbooks
date: 2021-02-17
tags:
  - ansible
layout: layouts/post.njk
---

# Writing an Action Plugin in Ansible

It's common to want to wrap up a task in Ansible into a reusable unit. This is especially common with common shell commands. Ansible has a few ways to do that.

1. Including a task list
1. Module plugin
1. Action plugin

Including a task list is the most straightforward: just have an `import_tasks` directive. You can set variables for that task with an attached `vars` attribute. There are several downsides to this method. The most obvious is that there isn't a good way of distributing task lists, either with Ansible-Galaxy or without it. Another downside is that there is a lack of documentation. Yet another is that it can be complicated to provide some basic defaults, formatting, validation, and debugging.

Ansible Module plugins might sound like the right thing, especially since the Ansible documentation says that if you use the `command` module a lot you might want to write one of these. When you look into the documentation, the difference between these and an Action plugin becomes murky. The capabilities of each aren't clearly outlined, despite them being practically welded to each other. You may also find documentation which says that when resolving what action to take from a task in a playbook, Ansible will first look for a match for the task action in the Action plugins and, if one isn't found, in the Modules.

The short distinction is that Modules are the code which will get uploaded to the target machine and then launched, and Action modules run on the controller. Action plugins have access to useful Ansible function, like `_execute_module`, which allows you to wrap an existing directive (or launch a specially-built `command`). Note that these executed modules function like you'd expect: on the remote machine.

So, most likely, you'll want to use an Action plugin.

## Basic outline

The basic outline of a plugin is as follows:

```python
{% include resources/ansible_plugins/action/basic.py %}
```

1. Import the plugin base
2. Create a class called ActionModule. To name the plugin, put it in a file with that name.
3. Make the `run` method
4. Invoke the `super().run` method
5. Return results as a dict

## Documenting your plugin

If you want your documentation to work with the Ansible tooling (showing up nicely in the docs, working with `ansible-doc`), you have to create an Ansible Module for that as well. It doesn't have to contain anything except for the sections of the documentation that you want to appear. Here's the [full referece](https://docs.ansible.com/ansible/2.10/dev_guide/developing_modules_documenting.html) for the version this article was written to. For convenience, here they are:

- Shebang & encoding
- Copyright
- DOCUMENTATION (includes module parameters)
- EXAMPLES
- RETURN

These have to be python strings which contain the YAML. This makes it kinda gross to work on, since you have no YAML syntax highlighting to help you. Here's a stub python file (feel free to change the license line):

```python
#!/usr/bin/python
# -*- coding: utf-8 -*-

# Copyright: (c) {{ year }}, {{ Your Name }} <{{ your email }}>
# GNU Affero General Public License v3.0+ (see COPYING or https://www.gnu.org/licenses/agpl-3.0.txt)

DOCUMENTATION = r"""
module:
short_description:
description:
  -
version_added: "0.1.0"
options:
"""

EXAMPLES = r"""
"""

RETURN = r"""
{{ key }}:
  desctiption:
  returned:
  type:
  sample:
"""
```

## Common things you'd want to do

### Run another module/action plugin

Inside of your `run` method:

```python
module_name = "???"
module_args={"???":"???"}

result = self._execute_module( #1
	module_name=module_name,
	module_args=module_args,
	task_vars=task_vars, #2
	#3
)
```

1. use the `self._execute_module` method
2. generally pass these forward, don't forget to provide them
3. tmp no longer has any effect, if the comments are to be believed, so we don't need to forward it.

### Run a freeform command

If you just want to wrap a task like

```yaml
- name: Run thing
  command:
    cmd: "Some freeform text"
```

You will need to provide the `cmd` arg as the value of "\_raw_params" to the module_args.

```python
cmd="ls -la"

result = self._execute_module(
	module_name=module_name,
	module_args={"_raw_params": cmd},
	task_vars=task_vars,
	tmp=tmp
)
```

### Adding a fact

Ansible wants you to use a Fact plugin for these, but sometimes a fact only makes sense mid-playbook. Simply set the "ansible_facts" key with a dictionary of the facts you want to add:

```python
return {"ansible_facts":{"FACT":1}}
```

### Using an existing filter

If you want to use an existing filter pluging (perhaps to format your output), you can just import them from the Ansible package:

```python
from ansible.plugins.filter.core import to_json, quote
```
