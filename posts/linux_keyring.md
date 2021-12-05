---
title: Exploring the Linux Keyring
description: The Linux Keyring seems like the place you'd want to put keys. Let's explore how to use it and see if it works for you
date: 2021-12-30
tags:
  - linux
  - trying
layout: layouts/post.njk
buildscript: linux-keyring.xonsh
---

# Exploring the Linux Keyring

The Linux Keyring ([keyrings(7)](https://man7.org/linux/man-pages/man7/keyrings.7.html)) are described as "in-kernel key management and retention facility". Which sounds exactly like a cool thing you could do if you needed to manage or retain keys!

## TLDR

The Linux Keyring provides a way to load keys or secrets into an application. This is a great way to stop passing secrets through insecure methods, like hard-coding them in your code files or passing them on the command line.
One of the cool things about the keyring is that you can use a privileged process to load them from disk and pass them to the less-privileged application. This can mitigate security risks of a path traversal reading your super-secret file-on-disk.
You can even restrict them by process or thread if you're persistent. This can be exciting if you have to run untrusted code (like extensions/plugins or just by devs you don't trust) and want a way to not extend the secrets to that code.

## Getting your bearings

The entrypoint for exploring the keyring is `keyctl` ([keyctl(1)](https://man7.org/linux/man-pages/man1/keyctl.1.html)). You can get a view of the current ring with `keyctl show`.

```bash
{% include_raw "linux_keyring/o/00_keyctl_show.txt" %}
```

You can inspect a specific key with `keyctl describe $key` or `keyctl rdescribe $key`. The difference is that `describe` is the "friendly" form of the output.

```bash
{% include_raw "linux_keyring/o/01_keyctl_describe.txt" %}
```

### Keyrings

Keyrings hold keys. You can attach keys to any keyring. Keyrings are also a type of key, so you can attach them to another keyring. Keys can be attached to multiple keyrings. All keys must be attached to another keyring (except for anchoring keys, which are roots of the key tree).

There are many default keyrings. They're detailed in [the man page](https://man7.org/linux/man-pages/man1/keyctl.1.html#KEY_IDENTIFIERS). The ones you'll probably be using are the user keyring (unique per user) or the session keyring (the "current" one).

### Exploring everything

You'll notice that there aren't any keys in the keyring, just another keyring. That's because there are many keyrings you can have access to, but only some of them are visible if you're looking normally. If you want to see all the keys you can see, you can inspect the `/proc/keys` file:

```bash
{% include_raw "linux_keyring/o/02_proc_keys.txt" %}
```

The OS uses the keyring for its own purposes. Let's try seeing them with sudo:

```bash
{% include_raw "linux_keyring/03_sudo_keyctl_show.txt" %}
```

You'll notice that that is the same as when we did that without sudo. That's because of the fun things that the keyring can do! This will make a lot of sense later when we dive into key permissions. For now, we can think of it as helping things make more sense for usability: it allows us to load a key into the keyring, execute a command with sudo, and still have our keys accessible.
If you want to actually see all the keys that root can see, you have to _actually_ become root. One way of doing this is by using sudo to open a new session, like with `sudo -u#0 bash -c 'keyctl show'`. Seeing all the keys can be done without this trick, so `sudo cat /proc/keys` dumps a whole lot of keys.

## Key Permissions and Access
