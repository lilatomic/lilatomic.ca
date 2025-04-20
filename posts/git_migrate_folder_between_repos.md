---
title: Migrate Files Between Git Repositories
description: How to move files from one git repository to another
date: 2025-04-01
tags:
  - howto
  - using
  - git
layout: post
---

# Migrate Files Between Git Repositories

Sometimes you decide that some files belong in a different git repo. For me, I've needed to pull IAC scattered across many libraries into a common repo. I've also used this to move code from a specific repo into a common library repo. You can also move split a service or transfer one. Copying files is trivial; copying them with history takes a bit. We use git subtree to transfer all the history.

## HowTo

The following assumes that you want to do the transfer locally. Clone both repositories.

0. Set up common variables. The path to the src repo is the path to the `.git` folder of the source repo on your filesystem. (I'm sure it)
	 ```shell
   swap_branch='split'
   src_path='path/from/'
   dst_path='path/to/'
   path_to_src_repo='/home/me/gitstuff/src_repo/.git'
   ```

1. In the source repo, create a subtree branch
   ```shell
   git subtree split -P "$src_path" -b "$swap_branch"
   ```

2. Optionally, filter files with filter-repo (on Ubuntu, you will need to install it with `sudo apt install git-filter-repo`). For example, the following will only include `.tf` files. There are many options to `git filter-repo`.
   ```shell
   git filter-repo --path-glob '**.tf' --refs "$swap_branch" --force
   ```

3. In the destination repo, we import the split-off branch
   ```shell
   git subtree add -P "$dst_path" "$path_to_src_repo" "$swap_branch"
   ```

## Result

You will now have a git history that includes commits from the other repo. This will add a root to your git tree, which might be horrifying to you.

## Example

<figure>
<figcaption>An example of two repositories, src and dst, where we want to move the "things" folder in src to the "other_things" folder in dst folder</figcaption>

```
.
├── dst
│   ├── readme.md
│   └── stuff
│       └── other_file.md
└── src
    ├── readme.md
    └── things
        └── file.md
```

</figure>

<figure>
<figcaption>An example resulting directory, showing the moved directory</figcaption>

```
.
├── other_things
│   └── file.md
├── readme.md
└── stuff
    └── other_file.md
```

</figure>

<figure>
<figcaption>An example of a resulting git tree, with multiple roots</figcaption>

```
*   3aa20bd (HEAD -> main) Add 'other_things/' from commit '580634f1da305b9df559d36389efba0112f68b71'
|\
| * 580634f add some words
| * 26a23b4 make a file
* f4ca64b add another file
* 1f5d476 init
```

</figure>
