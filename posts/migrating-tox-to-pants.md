---
title: Migrating a project from tox to Pants
description: Lets walk through migrating a Python project from tox to the Pants build system
date: 2024-03-22
tags:
  - python
  - howto
layout: layouts/post.njk
---

<!-- prettier-ignore-start -->
*[PE]: Private Endpoint
<!-- prettier-ignore-end -->

# Migrating a project from tox to Pants

Tox is a fine environment manager and test command runner. I think the Pants build system has advantages. I'm also a contributor. Let's port one of [my projects, grafanaramadillo](https://github.com/lilatomic/grafanarmadillo). TLDR: [MR HERE](https://github.com/lilatomic/grafanarmadillo/pull/19)

## Initialise Pants

After [getting Pants](https://www.pantsbuild.org/2.18/docs/getting-started/installing-pants), run `pants --version` to initialise the repository. This gives us an empty Pants config file. We're going to bump the version up to at least 2.20, because we've done some great work making it easier to incorporate tools.

```toml
{% include_raw "tox2pants/pants.0.toml" %}
```

Don't forget to add internal Pants files to the gitignore with [the gitignore fragment](https://www.pantsbuild.org/2.19/docs/getting-started/initial-configuration#4-update-gitignore).

Let's enable the Python backend. We add some default interpreter constraints. We also enable resolves which will allow us to install packages with lockfiles.

```toml
{% include_raw "tox2pants/pants.1.toml" %}
```

Since my package uses a src/test layout, I need to configure source roots:

```toml
[source]
root_patterns = [
	"/",
	"src/",
]
```

### Telling Pants about our files

Now we have Pants run `tailor` generate BUILD files which find all of our Python sources and tests `pants tailor ::`. This will get most of our source files into Pants, but it won't get our other files, such as test resources. We need to add `files` or `resources` targets. You can just use a large target at the start. If you need more granularity, you can break it up later.

```python
files(
    name="test_resources",
    sources=["*.json", "**/*.json", "**/*.bash"],
)
```

### Telling Pants about our package

Pants doesn't automatically generate `python_distribution` targets for many ways of setting up a Python package. I've got a setup.py file, and while someday I might port it to a pyproject.toml, I can put that off for now. We create a `python_distribution`. You might also have to add dependency links to files like your docs.

## Porting linters included in Pants

Pants comes with many builtin linters. Switching to them is easy.

### isort

Enable the `"pants.backend.python.lint.isort"` backend. I had settings in my `tox.ini`, and I moved them over to a `pyproject.toml`. Pants can automatically pick up config files from a variety of places. A cool tip is to add your first-party packages as known first-party packages in the config. This can help isort know which packages are yours in cases where Pants is only looking at some of your files, such as with `--changed-since=main`.

### flake8

Enable the `"pants.backend.python.lint.flake8"` backend. If you don't use plugins, you're done! If you use plugins, we're going to set up a resolve for them. Resolves are how Pants handles requirements. They're essentially a universe of dependencies Pants can install. This is also pretty simple, and Pants has a [page on Python lockfiles](https://www.pantsbuild.org/2.18/docs/python/overview/lockfiles). It's simply:

1. create a resolve in `pants.toml` and tell flake8 to install from there
   ```toml
   [python.resolves]
   flake8 = "devtools/flake8.lock"
   [flake8]
   install_from_resolve = "flake8"
   ```
2. create a requirements file with your requirements
   ```text
   flake8>3
   flake8-docstrings
   flake8-bugbear
   pygments
   ```
3. create a `python_requirements` target in the nearest BUILD file with `pants tailor ::`. Modify this target to point to the new resolve

   ```python
   python_requirements(
     name="flake8",
     source="flake8_requirements.txt",
     resolve="flake8",
   )
   ```

4. generate lockfiles with `pants generate-lockfiles --resolve=flake8`

Pants will automatically pull flake8 config from a variety of places, including "tox.ini", but I moved my config over to "setup.cfg".

While we're here, you can enable autoflake by just adding it as a backend `"pants.backend.python.lint.autoflake`

## Adding custom tools

Pants doesn't have plugins for every linter. If the tool is simple enough, though, a few lines in a BUILD file is all you need to add it. We're going to follow along with [the article on adding tools from the docs](https://www.pantsbuild.org/2.18/docs/ad-hoc-tools/integrating-new-tools-without-plugins).

We need to set our `[GLOBAL].pythonpath` to include the directory where our in-repo plugins will live. In my case, that's done with `pythonpath = ["%(buildroot)s/devtools"]`. Then, we enable the `"pants.backend.experimental.adhoc"` backend, which includes helpers to generate the rules for us.

### A tool from PyPI

Adding a tool with the adhoc backend is really easy.
1. create a new resolve
   ```toml
   [python.resolves]
   radon = "devtools/radon.lock"
   ```
2. create the requirements for the tool in a BUILD file
   ```python
   python_requirement(name="radon", requirements=["radon"], resolve="radon")
   ```
3. create a `code_quality_tool` target in a BUILD file. There are a few things to note here. Pants can pick up the entrypoints of some requiremets automatically and can convert them into a runnable target. If Pants can't for your tool, you can wrap it in a `pex_binary` target and define the entrypoint (see this section for an [example of wrapping with pex_binary](#a-tool-from-your-repo)). Another thing to note is that `code_quality_tool`s operate on raw files, not on targets, so you must set the `file_glob_include`.
   ```python
   code_quality_tool(
     name="radon_cc",
     runnable=":radon",
     args=["cc", "-s", "--total-average", "--no-assert", "-nb", "src/"],
 	   file_glob_include=["src/**/*.py"],
   )
   ```
4. create an in-repo plugin using the rule-builder-helper. The helper provides all the rules, so you just need to create a file `register.py` inside of your plugin's module and generate a `python_sources` target for it.
   ```toml
   {% include_raw "tox2pants/radon.py" %}
   ```
5. register your plugin by adding your plugin to the `[GLOBAL].backend_packages`
   ```toml
   backend_packages = [
     "radon.cc",
   ]
   ```

I then repeated steps 3 through 5 for the `radon mi` subcommand

### A tool from your repo

Why not also wrap my in-repo plugin with the `code_quality_tool`? It's so convenient! It's just some things in the build file and another little plugin stub. Note how I use a `pex_binary` target to specify the entrypoint and provide a runnable target.

```python
python_sources()

pex_binary(
    name="prreqs_tool",
    entry_point="check_changelog.py",
)

code_quality_tool(
    name="prreqs",
    runnable=":prreqs_tool",
    file_glob_include=["docs/**/*.rst"],
)
```

### A tool that generates files

I build my docs with sphinx. Pants doesn't yet have a dedicated plugin for sphinx, but we can hack something together with `adhoc_tool`. We start with a `pex_binary` target containing our requirements and our package (installing our package is necessary for automodule to work). We set the `entry_point` to "sphinx" so the pex will run that. We then create an `adhoc_tool` to run our command. We include all the resources and supporting files we'll need, such as code samples. We then create an `archive` task to collect the files at the end. We can now build our docs with `pants package devtools:docs`.

```python
{% include_raw "tox2pants/sphinx.BUILD" %}
```

A downside of this approach is having to pass all the files into `adhoc_tool.execution_dependencies`. This is necessary because Pants is trying to model dependency relations with `adhoc_tool`. This can be inconvenient as the number of these targets grows. Instead of using `adhoc_tool`, you could use a runnable target (such as a `pex_binary`), since runnable targets work in the build root and have access to all files.

## Tests

Your tests might just work. For dependencies, you can add them to the same resolve as the rest of your code. Pants treats the resolve as a universe of possible dependencies, so it's more like a local PyPI than a requirements.txt file. Pants won't add these as requirements of your packages unless you import them in your source code. If you use test resources (like snapshots of test data), make sure you've added them as `files` or `archives` targets and put a dependency link.

### Testing scripts and commands defined in setup

One of tox's features is that it installs your package. This makes any CLI entrypoints available for integration testing. I have a few of these types of test for the usage examples. Unfortunately, this isn't well-supported by Pants.
You can wrap the `python_distribution` target in a `pex_binary` target and then reference that as a `runtime_dependency` of the test. You have to wrangle to get the PEX to appear on the path and without an extension.

```python
pex_binary(
    name="grafanarmadillo",
    dependencies=[
        "//:grafanarmadillo",
    ],
    script="grafanarmadillo",
    output_path="tests/grafanarmadillo",
)

python_tests(
    name="doc_example_tests",
    sources=["test_doc_examples.py"],
    runtime_package_dependencies=[
        ":grafanarmadillo",
    ],
    dependencies=[
        ":test_resources",
        "//tests/flow:flow",
    ],
)
```

### Code coverage

Pants supports test coverage reports. Just enable it with `[test].use_coverage = true`. You might also want to enable machine-readable reports for tools with `[coverage-py].report = ["xml", "html", "raw"]`
