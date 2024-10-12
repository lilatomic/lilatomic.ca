---
title: Enwiden the Internet
description: Make the Internet full-width
date: 2024-10-12
tags:
  - off-topic
layout: layouts/post.njk
---

# Enwiden the Internet

It's very frustrating when sites have a constrained width and then insist on putting content that doesn't fit inside that width. This is most common with code listings, as these aren't wrapped. You have to scroll back and forth for each line.

But this is your browser, and you can override their stylesheets with a User Stylesheet. For example, [here's how to add user stylesheet in Firefox](https://davidwalsh.name/firefox-user-stylesheet). You then just need to jam `max-width: none !important;` and `width: auto !important;` on anything that looks like the main content.

## General solution

Here's a fragment which does this for most things:
```css
{% include_raw "enwiden/userContent.css", 1, 18 %}
```

## Stackoverflow

Stack overflow has some internal objects that we want to hit:
```css
{% include_raw "enwiden/userContent.css", 20, 29 %}
```

## Everything else

See the [whole sheet](https://raw.githubusercontent.com/lilatomic/lilatomic.ca/refs/heads/prod/_includes/resources/enwiden/userContent.css) as I add more things
