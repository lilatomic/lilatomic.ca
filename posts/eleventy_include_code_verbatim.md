---
title: Eleventy Include Code File Verbatim
description: An Eleventy shortcode to include a code file verbatim
date: 2021-02-24
revisions:
tags:
  - eleventy
layout: layouts/post.njk
---

# Eleventy Include Code File Verbatim

I didn't find what I needed, so I wrote it. It was pretty simple. In your ".eleventy.js" file, somewhere in the big `module.exports` function, add this little snippet:

```js
const resource_path = "_includes/resources/";
eleventyConfig.addShortcode("include_raw", function (path) {
	return fs.readFileSync(resource_path + path);
});
```

Then just toss your files into something in the `resource_path` folder and reference them from your code like so:

````jinja2
{%raw%}	```python
	{% include_raw "ansible_plugins/filter/filter_as_function.py" %}
	```{%endraw%}
````
