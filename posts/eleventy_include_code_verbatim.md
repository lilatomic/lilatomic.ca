---
title: Eleventy Include Code File Verbatim
description: An Eleventy shortcode to include a code file verbatim
date: 2021-11-15
revisions:
  - date: 2021-02-24
    desc: "first published"
  - date: 2021-11-15
    desc: "add ability to pull in line ranges"
tags:
  - eleventy
layout: layouts/post.njk
---

# Eleventy Include Code File Verbatim

I didn't find what I needed, so I wrote it. It was pretty simple. In your ".eleventy.js" file, somewhere in the big `module.exports` function, add this little snippet:

## Whole file

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

## Partial files

I found that I wanted to include only a few lines from a file, but still wanted those lines to exist in context. This allows me to test those lines. It also allows other tools to act on the full file. The motivating example was Bicep files, which get rendered to ARM templates. These have to be syntactically valid to be rendered. But if all I wanted to show was how a line is rendered, including all the boilerplate (especially in the verbose ARM template) is just clutter for the article. So I modified the above to have this:

```js
const resource_path = "_includes/resources/";
eleventyConfig.addShortcode(
	"include_raw",
	function (path, start = 1, end = -1) {
		let lines = fs
			.readFileSync(resource_path + path)
			.toString()
			.split("\n");
		var selected_lines;
		if (end === -1) {
			selected_lines = lines.slice(start - 1);
		} else {
			selected_lines = lines.slice(start - 1, end);
		}
		return String(selected_lines.join("\n"));
	}
);
```

This is backwards-compatible with the initial pass. The unusual bounds ([non-dijkstra](https://www.cs.utexas.edu/users/EWD/transcriptions/EWD08xx/EWD831.html)) make it easy to just look at the line numbers in an editor in the 1-starting convention used by everyone. I would try to persuade everyone to stop using the convention we all make fun of Matlab for, but I already have enough trouble getting [the actual accessibility feature of tabs](https://www.reddit.com/r/javascript/comments/c8drjo/nobody_talks_about_the_real_reason_to_use_tabs/) adopted.
