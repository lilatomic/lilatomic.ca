---
title: Dhall for Config Files
description: A quick how-to-use on generating text-based config files with the Dhall language
date: 2020-11-04
tags:
  - dhall
  - using
layout: layouts/post.njk
---
# Dhall for Config Files

## Setting up a Dhall project

Let's start with the standard directory used in the [dhall-nethack repo](https://github.com/dhall-lang/dhall-nethack/blob/master/types.dhall)

- types.dhall : this file is a convenient import of all the types
- types/ : this is where we put all of our type definitions
- render.dhall : this is a convenient way of importing all the render functions
- render/ : this is where we put all of our render functions

Neat!

## Adding a type

1. Add your type as a record in a file under the :/types/ directory.

	:/types/Install.dhall
	``` dhall
	{ WantedBy : Text }
	```

	If you need to reference another type in this type, you can use an import, like `./TypeName.dhall`. Since we're in the folder with all of our types, we can just use access to the local directory.
	:/types/SystemdUnit.dhall
	``` dhall
	{ Unit : ./Unit.dhall, Service : ./Service.dhall, Install : ./Install.dhall }
	```

1. Register your type in :/types.

	:/types.dhall
	``` dhall
	{ Unit = ./types/Unit.dhall
	  , Service = ./types/Service.dhall
	  , Install = ./types/Install.dhall
	  , SystemdUnit = ./types/SystemdUnit.dhall
	}
	```

1. You can now use your type by importing the :/types.dhall file:

	``` dhall
	let Systemd = ./types.dhall

	let t
	    : Systemd.SystemdUnit
	    = { Unit.Description = "hello"
	      , Service = { User = "me", ExecStart = "/usr/bin/bash pwd" }
	      , Install.WantedBy = "multi_user.target"
	      }

	in  { Unit.Description = "hello"
	    , Service = { User = "me", ExecStart = "/usr/bin/bash pwd" }
	    , Install.WantedBy = "multi_user.target"
	    }
	```

## Adding a renderer for a type

If you need to output to a format other than JSON or YAML, you'll need to write your renderers and pass it through `dhall text`

1. Add a renderer for your type in a file under the :/render/ directory. This is a function which takes one of your type and returns Text. You can import your type with all types through the phrase `let types = ../types.dhall`, or you can use a direct import with `../types/YourType.dhall`.

	:/render/Install.dhall
	``` dhall
	let types = ../types.dhall

	in  λ(i : types.Install) →
	      ''
	      [Install]
	      WantedBy=${i.WantedBy}
	      ''
	```

	If you need to reference another renderer in this renderer, you can do that with a simple import, like `./Service.dhall`

1. Register the renderer in the :/render.dhall file

	:/reder.dhall
	``` dhall
	{ Unit = ./render/Unit.dhall
	, Service = ./render/Service.dhall
	, Install = ./render/Install.dhall
	, SystemdUnit = ./render/SystemdUnit.dhall
	}

1. You can now use your renderers by importing them with `./render.dhall`

	``` dhall
	let Systemd = ./types.dhall

	let Render = ./reder.dhall

	let t
	    : Systemd.SystemdUnit
	    = { Unit.Description = "hello"
	      , Service = { User = "me", ExecStart = "/usr/bin/bash pwd" }
	      , Install.WantedBy = "multi_user.target"
	      }

	in  Render.SystemdUnit t
	```

1. And you can run the dhall with `dhall text`

	``` bash
	> dhall text --file f.dhall
	[Unit]
	Description=hello
	[Service]
	User=me
	ExecStart=/usr/bin/bash pwd
	[Install]
	WantedBy=multi_user.target
	```

If you have a standard format you're building to, you can create a helper for easier importing. The example builds systemd unit files, so we might create one like

:/toSystemdUnit
``` dhall
./render/SystemdUnit.dhall
```

## Adding examples

Everyone loves seeing examples of how to use your stuff, so let's add those. They're just a file located in the expected directory :/examples

:/examples/templated_unit.dhall
``` dhall
let Systemd = ../types.dhall

let jupyterhub_unit
    : Text → Systemd.SystemdUnit
    = λ(config_location : Text) →
        { Unit.Description = "JupyterHub"
        , Service =
          { User = "jupyterhub"
          , ExecStart = "/opt/jupyterhub/bin/jupyterhub -f ${config_location}"
          }
        , Install.WantedBy = "multi_user.target"
        }

in  jupyterhub_unit
```

And then we can invoke this from the command line, with something like:

``` bash
echo "./render/SystemdUnit.dhall (./examples/templated_unit.dhall \"/opt/jupyterhub/etc/jupyterhub/jupyterhub_config.py\")" | dhall text
```

or with our helper renderer:

``` bash
echo "./toSystemdUnit.dhall (./examples/templated_unit.dhall \"/opt/jupyterhub/etc/jupyterhub/jupyterhub_config.py\")" | dhall text
```
