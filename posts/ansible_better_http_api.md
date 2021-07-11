---
title: Faking a better HttpApi plugin
description: How I faked a new class of plugins in Ansible, in this case for HTTP API connections
date: 2021-07-30
tags:
  - ansible
#   - "series/ansible_plugins"
series: [ansible plugins]
layout: layouts/post.njk
---

# Faking a better HttpApi plugin

The builtin HttpApi plugins are not great, as [I wrote about before]({% link_to "ansible_httpapi_plugins" %}). This makes interacting with HTTP APIs kind of a pain. It also means that all the collections which make heavy use of HTTP APIs write their frameworks on top of the bad one to make it less bad. Instead of that, we're just going to bypass the connection plugin stack, and the Ansible Plugin situation entirely.

[TLDR](#final-version)

## Development

### The goal

Let's start by sketching out what we want the API to look like. Remember that this is a low-level action plugin. We'll be able to wrap this later to build more specific APIs. Here's an example for upserting a dashboard to Grafana:

{% raw %}

```yaml
- name: add grafana dashboard
  lilatomic.api.http:
    connection: grafana
    method: POST
    path: "/dashboards/db"

    body:
      dashboard: "{{ lookup('file', dashboard_file) | from_json }}"
      message: "redeploy"
      overwrite: true
```

{% endraw %}

### Supplying connection information

You can just use normal variables for this, but I'm going to use the Inventory file. To my mind, most HTTP APIs are like nodes and actions targeting them are configuring them, so they're just another type of thing you can run Ansible tasks against. I therefore think it's natural to have them fit into the Inventory file.

We'd like for them to _not_ show up in the conventional hosts list (for example, when targeting _all_). Fortunately the `yaml` inventory plugin lets us add vars which get passed to all hosts. This is just about what we want. Note also that you can template these. I'm going to namespace the connections, so they don't conflict with other variables. So my inventory will be structured like this:

```yaml
all:
  vars:
    lilatomic_api_http: {}
  hosts:
  children:
```

You could also write a [Vars Plugin]({% link_to "ansible_writing_facts_plugin" %}). I didn't think it was necessary, and I wanted to keep these connections with the Hosts.

### Basic requests

We're going to start with a basic [Action Plugin]({% link_to "ansible_writing_action_plugin" %}).

The first thing we'll want to do is retrieve the connection information for the specified connection. That's easily done by just accessing the vars. The vars above actually are injected as hostvars common to all hosts, so accessing them is pretty easy. `task_vars["lilatomic_api_http"][connection_name]`

This first pass at the plugin is already much nicer for making GET requests.

```python
{% include_raw "ansible_plugins/better_httpapi/0_get_only.py" %}
```

We can then use this with a playbook with a task like:

```yaml
- name: get alerts
  lilatomic.api.http:
    connection: grafana
    path: /alerts
```

### More methods

One way of supporting more methods would be to make a plugin for each method type. I intend to do this, for convenience. But it would also be convenient to reduce duplication with a single low-level module. This would also more easily allow parametrising the method (which could be useful for things where using PUT vs PATCH is something known at runtime only). Implementing this is as simple as using the requests library, which is pretty nice.

```python
{% include_raw "ansible_plugins/better_httpapi/1_multimethod.py" %}
```

### More parameters

HTTP APIs are full of other things that you need to specify, like proxy settings or headers or cookies or mTLS or all that. We could set all of those up as different parameters, but at some point we're just repeating the `requests` API. So instead, we'll offer an access hatch: a dedicated way of passing advanced parameters to the actual call to requests. I've simply labelled these fields as `kwargs`, which will hopefully indicate that these args are unvalidated. We also add a way of recursively merging the kwargs, which allows us to specify headers for all requests made with the connection and just for specific tasks and have them merged; as an example.

```python
{% include_raw "ansible_plugins/better_httpapi/2_kwargs.py" %}
```

### Simple Auths

Let's add some basic auths. One goal for the auths is that it should be possible to pass around the whole block as a unit. This allows us to easily use different endpoints which share the same underlying authentication system. We want to be able to support a variety of auths. I'm going to use a tagged union, with the `method` field as the tag. We leverage `requests` for the Basic auth, and write out own class for Bearer. This class has a few customisation points for APIs which are special and want you to put `api_key` or `GenieKey` or something...

```python
{% include_raw "ansible_plugins/better_httpapi/3_auth.py" %}
```

### Better returns

Currently we always return the JSON, even if it's not there. This is multiple problems:

1. we can't load anything which doesn't return JSON
1. we never see any errors
1. we never get any other information

So lets solve those. We can first just _not_ return JSON if it's not supposed to be there:

```python
out = {}
if r.headers["Content-Type"] == "application/json":
	out["json"] = r.json()
```

Neat. For errors, we can leverage the `response.ok` property. We'd also like to support the permissible return codes, since sometimes a 409 Conflict just means things are OK. Ansible modules signal failure with the "failure" key in the return: `out["failed"] = not self.is_ok(r, self.arg_or("status_code"))`. The body of that helper method is pretty simple:

```python
@staticmethod
def is_ok(response: Response, acceptable_codes: Optional[List[int]] = None):
	if acceptable_codes:
		return response.status_code in acceptable_codes
	else:
		return response.ok
```

And last we've got to build up the rest of the response. That's pretty easy, it's just transforming things. I've tried to generate all the fields that the `ansible.builtin.uri` module does.

```python
{% include_raw "ansible_plugins/better_httpapi/4_returns.py" %}
```

### Friendlier API

The current API requires people to add Headers in the kwargs, which sucks a bit. Adding another parameter is easy enough.

While we're at it, it's pretty easy to make shortcuts for specific methods:

```python
from .http import ActionModule as Http


class ActionModule(Http):
	def run(self, tmp=None, task_vars=None):
		self._task.args["method"] = "POST"

		return super().run(tmp=tmp, task_vars=task_vars)
```

### Documentation

Didn't think I'd let us off the hook for this, did you? It's easy if tedious, you just have to create a fake module and fill in the required docstrings. I've only done that for the main HTTP plugin. Ideally, I would pull out everything except for the "method" parameter into a document fragment, and then have them all reference that. something for a future improvement

## Final Version

With a few improvements along the way, we have:

.../plugins/action/http.py

```python
{% include_raw "ansible_plugins/better_httpapi/final_action.py" %}
```

.../plugins/modules/http.py

```python
{% include_raw "ansible_plugins/better_httpapi/final_module.py" %}
```
