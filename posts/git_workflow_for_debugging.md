---
title: A Git Workflow for Debug builds
description: A git workflow for debugging projects where you need to push a commit for a system to run that code.
date: 2025-04-01
tags:
  - using
  - git
layout: post
---

# A Git Workflow for Debug builds

We all deal with systems where the only way to run code is to push a git commit. Most CI systems have no local executor, and many don't even have basic validation. This leads to _hilarious_ commit trails as you just try to figure out what magic incantation will satisfy the CI spirits. But you don't have to have this mess forever, and it doesn't even need to take more of your time.

<img src="/img/git_history.png" alt="A snippet of a git commit log. The commit messages are nonsensical but humourous, such as 'oopsie', 'dont push', 'lol', 'ok thats it', and 'heyya'">

## The Workflow

While developing:

1. Make your changes
2. Commit your changes with a commit message that begins with `fixup!` and then the text of the commit you want to fix up. For example, have the first commit be "fix CI", and following commits be "fixup! fix CI". In the VSCode IDE, you can get previous commit messages by using the arrow keys within the commit message box. Within the JetBrains suite, you can also type `fixup!` and it will autosuggest commit messages.
3. Push

Before showing your history to others:

0. (optionally) fetch the latest main branch for continuous integration. Do this without needing to change branches with `git fetch origin main:main`
1. `git rebase -i --autosquash main`
2. Confirm that the plan looks sensible and run the rebase
3. push. You will probably need to force push, using `git push --force-with-lease`

## Background

### Git squash and fixup

Git has several ways of combining commits:

- squash: merge two commits and combine their commit messages
- fixup: merge two commits and discard the second's commit message

You can specify these during a rebase, for example with `git rebase -i main`

### Git autosquash

Git also has a feature to automatically specify these modifications during a rebase, called "autosquash". A commit message starting with `fixup!` or `squash!` will trigger that action. Following the directive, you can include a hash or commit message to have git automatically target that commit. To trigger this, use the `--autosquash` flag when rebasing `git rebase -i --autosquash main`

### Making autosquash commits

You can manually type the directive and commit hash or message. You can also use the `--fixup` or `--squash` arguments to `git commit`. You can also use the `:/foo` syntax in the message to have git search for "foo" in the commit logs and target the first commit matching that.

