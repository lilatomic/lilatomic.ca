---
title: Common Dhall Tasks for Config Files
description: How to do that thing you want to do in Dhall 
date: 2020-12-09
tags:
  - dhall
  - using
layout: layouts/post.njk
---
# Common Dhall Tasks for Config Files

This page describes common tasks in using Dhall for generating config files. It provides the step-by-step for implementing these common features. 

## Enums (Sum Types)

1. Define the type. Angle brackets around all the options, pipelines between the options. These are the names which appear in code, so it's alright if they follow your code convention rather than how they appear in the config file. So if you write enums in all capital letters because they're basically constants, you do you.

	:/types/ServiceType.dhall
	``` dhall
	< simple | forking | oneshot | notify | dbus | idle >
	```

1. Register it in the types.dhall file:

	:/types.dhall
	``` dhall
	{...
	, ServiceType = ./types/ServiceType.dhall
	}
	```

1. Use it in an example by referencing through the type import:

	```dhall
	let ServiceType = Systemd.ServiceType.simple
	```

1. Make a renderer for the type. Start with the import of the types files. Then we make a function which merges a record with the string equivalents with the input. The only thing which falls out is the correct string equivalent. Neat!

	:/render/ServiceType.dhall
	``` dhall
	let types = ../types.dhall

	in  λ(x : types.ServiceType) →
		merge
			{ simple = "simple"
			, forking = "forking"
			, oneshot = "oneshot"
			, notify = "notify"
			, dbus = "dbus"
			, idle = "idle"
			}
			x
	```

1. Register the renderer with:

	:/render.dhall
	``` dhall
	{...
	, ServiceType = ./render/ServiceType.dhall
	}

1. Use it in other renderers like normal. Since we're in the 'render' folder, we can just import it with a local import, like `./ServiceType.dhall`

	:/render/Service.dhall
	``` dhall
	let types = ../types.dhall

	in  λ(i : types.Service) →
		''
		[Service]
		User=${i.User}
		ExecStart=${i.ExecStart}
		Type=${./ServiceType.dhall i.ServiceType}
		''
	```

## Unions | Complex Sum Types

Sometimes you've got a field which is a value of Type a _or_ Type b. A sum type represents that. This example combines an enum and Text, but the same principle holds for any types. Here's a [link](https://hackage.haskell.org/package/dhall-1.16.1/docs/Dhall-Tutorial.html#g:12) for the official tutorial

1. Create the sum type similarly to how you'd create an Enum. Note that each option has both a name and a Type. These also generate the constructors for the Union type.

	:/types/Dependency.dhall
	``` dhall
	< Runlevel : ./RunlevelTargets.dhall | Service : Text >
	```

1. Register it in the ':/types.dhall'

1. Make a renderer for the type. You can use merge to select a function and then apply it. You can compose this from other functions you have already. Note that we use `=` here, since this isn't defining a type signature. Also note that we're using `id`, `Text/show` was adding extra quotes.

	:/render/Dependency.dhall
	``` dhall
	let types = ../types.dhall

	let id = λ(a : Type) → λ(x : a) → x

	in  λ(x : types.Dependency) →
		merge { Runlevel = ./RunlevelTargets.dhall, Service = id Text } x
	```

1. Register it in the ':/render.dhall'

1. Use it by accessing the constructor you want. Note that the renderer is the same, since they're ultimately the same type:

	``` dhall
	let Systemd = ../types.dhall

	let Render = ./reder.dhall

	in  ''
		${Render.Dependency (Systemd.Dependency.Service "nfs-common.service")}
		${Render.Dependency
			(Systemd.Dependency.Runlevel Systemd.Runlevel.multiuser)}
		''
	```

## Optional fields (autoexclusion)

Sometimes you want a field to not appear if there is no value defined.

We'll define a helper function to render optionals. I use it frequently so I gave it a short name. Mine adds a newline automatically, so they don't appear if the option doesn't render. 

:/render/ro.dhall
``` dhall
{-
	a: Type parameter
	f: Renderer
	opt: Value
-}
λ(a : Type) →
λ(f : a → Text) →
λ(opt : Optional a) →
	merge { Some = λ(x : a) → f x ++ "\n", None = "" } opt
```

Using that one is a bit clunky:

``` dhall
in  λ(i : types.Install) →
          ''
          [Install]
          ''
      ++  ro
            types.Dependency
            (λ(l : types.Dependency) → "WantedBy=${./Dependency.dhall l}")
            i.WantedBy

```

So I made this following helper, which works better with the config file format:

:/render/ron.dhall
``` dhall
let ro = ./ro.dhall

in  λ(a : Type) →
    λ(n : Text) →
    λ(f : a → Text) →
    λ(opt : Optional a) →
      ro a (λ(l : a) → "${n}=${f l}") opt
```

And can be used like:

``` dhall
in  λ(i : types.Install) →
          ''
          [Install]
          ''
      ++  ron types.Dependency "WantedBy" ./Dependency.dhall i.WantedBy
```

If you find yourself frequently using the same type (for example, bools), you can make another wrapper for that. The dhall-nethack repo makes significant use of those, see the [config class](https://github.com/dhall-lang/dhall-nethack/blob/2b7ea599ae09c077bd8bda82cfb3c2601925e300/render/Config.dhall)

## Multiple exports per file

Dhall likes you to have a single type per file. But sometimes you have a group of types which don't make sense separately. Or you have a lot of types which are basically just type aliases for primitive types. You can export them in a file like so

:/ex.dhall
``` dhall
{ Thing0 = Text, Thing1 = Integer }
```

and then use them like

``` dhall
let ex = ./ex.dhall

let y
    : ex.Thing0
    = "HELLO"

in y
```

If some of your types reference another, you'll need to pull the referenced type into a `let` higher in the file:

:/ex.dhall
``` dhall
let T
    : Type
    = Text

in  { T, ListOfT = List T }
```