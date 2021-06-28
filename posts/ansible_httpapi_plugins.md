---
title: Understanding Ansible HttpApi plugins
description: How to write an HttpApi plugin. These let you interact with HTTP APIs better.
date: 2021-06-30
revisions:
  - date: 2021-06-30
    desc: "first published"
tags:
  - ansible
#   - "series/ansible_plugins"
series: [ansible plugins]
layout: layouts/post.njk
---

# Understanding Ansible HttpApi plugins

> TL;DR: I wouldn't recommend this method. It's not actually that good.

It's common to need to interact with HTTP APIs in an Ansible playbook. The standard method involves using the `uri` module or a `command` with `curl`. These can be clunky, especially when common connection parameters have to be copypasted between tasks. These also mix the concerns of the connection from those of the actual request. For example, the cert for mTLS has nothing to do with the body being submitted to the API.

Looking through the list of plugin types in Ansible, there's something called an `httpapi` plugin. [The documentation](https://docs.ansible.com/ansible/latest/plugins/httpapi.html) is a bit light, but it's described as:

> HttpApi plugins tell Ansible how to interact with a remote device’s HTTP-based API and execute tasks on the device.

This isn't _exactly_ what we're after. It's really set up for devices like network switches where SSH isn't really the intended connection method.

## Adapting the HttpApi plugin

But being able to submit HTTP requests is about 100% of what we need, so we might be able to just use it with a little adapting. There are several steps involved in creating an HttpApi plugin:

1. Create HttpApi plugin
1. Create Module for invoking the plugin

And for using it, it's fairly simple:

1. Supply connection information
1. Delegate tasks to that connection

## Understanding the HttpApi connection structure:

The flow for how HttpApi plugins work is a bit involved with a few unexpected outcomes. The flow is as follows:

1. an Ansible task requests the `httpapi` connection type, possibly with the `ansible_connection` parameter
1. the connection type has parameters which specify the `ansible_network_os`. This is used to look up which `httpapi` plugin to use
1. if the connection has not already been established, ansible uses the `ansible-connection` command to create it in a separate process. Getting messages back from the connection is weird, as they are only flushed at the _start_ of every task, after the connection has been established. Using `queue_message` during a module will cause those messages to be displayed at the start of the _next_ module invocation which uses that connection.
1. A Module will be invoked and can instantiate its connection to the httpapi plugin. This is basically just a wrapper around the socket path to the connection created above.
1. The connection will allow the Module to send requests through the httpapi plugin
1. The httpapi plugin send the requests through to _its_ connection, which is the `ansible.netcommon.httpapi` connection plugin. This connection plugin has a method for enriching an HTTP request
1. the connection plugin shells out to the util `ansible.module_utils.urls.open_url`, which is a generic way of making web requests, and eventually shells out to `urllib.request.urlopen`

## Implementing the HttpApi stack

So that's a bit complicated, but it's actually pretty easy to get a barebones version of this:

### HttpApi plugin

.../plugins/httpapi/http.py

```python
{% include resources/ansible_plugins/httpapi/httpapi/basic.py %}
```

Wow there's actually a lot going on here just to submit requests, and we haven't even gotten into authentication.
This barebones version assumes that everything will be JSON in and JSON out, so we can just set the Content-Type header to that.

Sending the data is done with a call to `self.connection.send`. As mentioned before, this resolves to the `ansible.netcommon.httpapi` connection plugin and will eventually make their way to `urllib`, but not before 2 more layers of munging.

We then have to unload the body ourselves.

For the return, note that we're rebuilding most of the response ourselves. This is because the response will need to be serialised over JSON for interprocess communication back to the main Ansible process. Remember when `ansible-connection` spun this connection off as a separate process? Well there's also a bespoke JSON-rpc remote-method-invocation framework which fails to serialise most of the things returned by the `ansible.netcommon.httpapi`. One of the things which fails to return is error messages, so I guess just hope you don't get those...

### Module

.../plugins/modules/http.py

```python
{% include resources/ansible_plugins/httpapi/modules/basic.py %}
```

We start with the argument spec. This is sorta nice for automatically performing parameter validation for us. For example, if we mistyped the one of the parameter names, we'd get a warning that that parameter wasn't allowed. That's checked during the AnsibleModule instantiation.

We then get a reference to the httpapi connection, which we defined just above. We use the connection to send the request, which requires us to forward all the parameters. It's a bit cumbersome.

We then need to use the `AnsibleModule.exit_json` function. This method is the way to return from an Ansible module. These are executed in separate processes and their return values are gathered from stdout. It's certainly a way to do that. In the event of an error, we use the `AnsibleModule.fail_json` for the same type of thing, but for failure.

Don't forget the shebang and the thing that launches the function is it's invoked.

### Supply connection information

One of the sneaky ways of adding these connections is to include them as a Host in the inventory file:

```yml
all:
  hosts:
    httpbin:
      ansible_connection: "httpapi"
      ansible_network_os: "lilatomic.api.http"

      ansible_host: "httpbin.org"
      ansible_port: "443"
      ansible_httpapi_use_ssl: true
```

**ansible_connection** this must be set to `httpapi`, and tells Ansible to select the `httpapi` connection plugin.

**ansible_network_os** this must match the name of your `httpapi` plugin.

**ansible_host** the host subcomponent of the url

**ansible_port** the port

**ansible_httpapi_use_ssl** whether to use http or https

I haven't found a way to combine the last 3 parameters. I also haven't found a way to add a start of the URL path component (for example, tomcat-hosted applications are by default hosted at `/{{appname}}`).

### Delegate tasks to the connection

This is the easiest way of sending the requests to this connection, in my opinion. It's literally just the `delegate_to` line:

```yml
- name: test
  hosts: localhost
  gather_facts: false

  tasks:
    - name: test get
      lilatomic.api.http:
        path: "/get"
        method: "GET"
      delegate_to: "httpbin"
    - name: test post
      lilatomic.api.http:
        path: "/post"
        method: "POST"
        data: "HIHELLO"
      delegate_to: "httpbin"
```

## Other features of HttpApi Plugins

The `HttpApiBase` base class has several other methods:

- login
- logout
- update_auth
- handle_httperror

The only method which isn't a virtual method is the handle_httperror. Its behaviour is to try to authenticate if a 401 is returned.

These methods are also invoked appropriately during the `ansible.netcommon.httpapi` sessions.

## Tradeoffs

So, there's a lot of implementation stuff. And there's a lot of boilerplate. And it's not even correct.
The interface for libraries like `requests` or `urllib3` are so much better than this, and don't require any of the machinery to get correct.

There are many other downsides to this approach. The requests happen either in another process or in a module, which is another process. This makes it almost impossible to get trace logging or unexpected errors.
You might also write modules which wrap more complicated operations, like creating a user and granting them permissions. This either needs to happen in a module, so your tracebacks are terrible; or in an action plugin invoking the module multiple times, so now we need to either copypaste the invocations or make _another_ layer as a helper method to invoke the method.
And there are at least 4 layers of munging, so if you're trying to figure out why a GET request is being given `"Content-Type": "application/x-www-form-urlencoded"` you might be in for a bad time.

So all-in-all, I wouldn't recommend using this method.
