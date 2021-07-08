---
title: Faking a better HttpApi plugin
description: How I faked a new class of plugins in Ansible, in this case for http api connections
date: 2021-07-30
tags:
  - ansible
#   - "series/ansible_plugins"
series: [ansible plugins]
layout: layouts/post.njk
---

# Faking a better HttpApi plugin

The builtin HttpApi plugins are not great, as [I wrote about before]({% link_to "ansible_httpapi_plugins" %}). This makes interacting with HTTP APIs kind of a pain. It also means that all the collections which make heavy use of HTTP APIs write their frameworks on top of the bad one to make it less bad. Instead of that, we're just going to bypass the connection plugin stack, and the Ansible Plugin situation entirely.

#
