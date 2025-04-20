import {DateTime} from "luxon";
import fs from "fs";
import pluginRss from "@11ty/eleventy-plugin-rss";
import pluginSyntaxHighlight from "@11ty/eleventy-plugin-syntaxhighlight";
import pluginNavigation from "@11ty/eleventy-navigation";
import pluginLinkTo from "eleventy-plugin-link_to";
import pluginTOC from 'eleventy-plugin-toc';

import MarkdownIt from 'markdown-it'
import markdownItAnchor from "markdown-it-anchor";
import markdownitAbbr from 'markdown-it-abbr';
import markdownItFootnote from 'markdown-it-footnote';

import {jsxToString} from "jsx-async-runtime";

import pluginRecipes from "recipes/recipes_plugin";

const groupBy = function (xs, extractor) {
	return xs.reduce(function (rv, x) {
		(rv[extractor(x)] = rv[extractor(x)] || []).push(x);
		return rv;
	}, {});
};

module.exports = function (eleventyConfig) {
	eleventyConfig.addPlugin(pluginRss);
	eleventyConfig.addPlugin(pluginSyntaxHighlight, {
		alwaysWrapLineHighlights: true,
		lineSeparator: "\n",
	});
	eleventyConfig.addPlugin(pluginNavigation);

	eleventyConfig.addPlugin(pluginTOC)

	eleventyConfig.addPlugin(pluginLinkTo);

	eleventyConfig.addPlugin(pluginRecipes);

	eleventyConfig.setDataDeepMerge(true);

	eleventyConfig.addLayoutAlias("post", "layouts/post.njk");

	eleventyConfig.addFilter("readableDate", dateObj => {
		return DateTime.fromJSDate(dateObj, {zone: 'utc'}).toFormat("yyyy-LL-dd");
	});

	// https://html.spec.whatwg.org/multipage/common-microsyntaxes.html#valid-date-string
	eleventyConfig.addFilter('htmlDateString', (dateObj) => {
		return DateTime.fromJSDate(dateObj, {zone: 'utc'}).toFormat('yyyy-LL-dd');
	});

	// Get the first `n` elements of a collection.
	eleventyConfig.addFilter("head", (array, n) => {
		if (n < 0) {
			return array.slice(n);
		}

		return array.slice(0, n);
	});

	eleventyConfig.addCollection("tagList", function (collection) {
		let tagSet = new Set();
		collection.getAll().forEach(function (item) {
			if ("tags" in item.data) {
				let tags = item.data.tags;

				tags = tags.filter(function (item) {
					switch (item) {
						// this list should match the `filter` list in tags.njk
						case "all":
						case "nav":
						case "post":
						case "posts":
							return false;
					}

					return true;
				});

				for (const tag of tags) {
					tagSet.add(tag);
				}
			}
		});

		// returning an array in addCollection works in Eleventy 0.5.3
		return [...tagSet];
	});

	eleventyConfig.addCollection("seriesList", function (collection) {
		var items = groupBy(collection.getAll().filter(
			x => "series" in x.data
		), x => x.data.series)

		return Object.entries(items).map(e => [e[0], e[1].sort((a, b) => a.data.date - b.data.date)])
	})

	eleventyConfig.addPassthroughCopy("img");
	eleventyConfig.addPassthroughCopy("css");
	eleventyConfig.addPassthroughCopy("CNAME");

	/* tsx */
	eleventyConfig.addExtension(["11ty.jsx", "11ty.ts", "11ty.tsx"], {
		key: "11ty.js",
		compile: function () {
			return async (data) => {
				// console.log("data:", data)
				// console.log("this", this)
				const content = await this.defaultRenderer(data);
				// console.log("content", content)
				const result = await jsxToString(content);
				return result
			}
		}
	})
	eleventyConfig.addTemplateFormats("11ty.jsx", "11ty.tsx",)
	eleventyConfig.addWatchTarget("./_includes/components")

	/* Markdown Overrides */
	let markdownLibrary = MarkdownIt({
		html: true,
		breaks: true,
		linkify: true
	})
		.use(markdownItAnchor, {
			permalink: markdownItAnchor.permalink.headerLink({
				class: "direct-link",
			}),
		})
		.use(markdownitAbbr)
		.use(markdownItFootnote);

	eleventyConfig.setLibrary("md", markdownLibrary);

	// Browsersync Overrides
	eleventyConfig.setBrowserSyncConfig({
		callbacks: {
			ready: function (err, browserSync) {
				const content_404 = fs.readFileSync('_site/404.html');

				browserSync.addMiddleware("*", (req, res) => {
					// Provides the 404 content without redirect.
					res.write(content_404);
					res.end();
				});
			},
		},
		ui: false,
		ghostMode: false
	});

	const resource_path = "_includes/resources/";
	eleventyConfig.addShortcode(
		"include_raw",
		function (path, start = 1, end = -1, indent = "") {
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
			return String(selected_lines.map(line => indent + line).join("\n"));
		}
	);

	return {
		templateFormats: [
			"md",
			"njk",
			"html",
			"liquid",
			"11ty.ts",
			"11ty.tsx",
		],

		markdownTemplateEngine: "njk",
		htmlTemplateEngine: "njk",
		dataTemplateEngine: "njk",

		// These are all optional, defaults are shown:
		dir: {
			input: ".",
			includes: "_includes",
			data: "_data",
			output: "_site"
		}
	};
};
