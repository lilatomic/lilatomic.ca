---
title: Changing the password on kartoza/docker-osm
description: "docker:docker" is not acceptable"
date: 2021-02-10
tags:
  - kartoza/osm
  - hindsight
layout: layouts/post.njk
---
Default credentials are not acceptable. [OWASP link](https://owasp.org/www-project-web-security-testing-guide/latest/4-Web_Application_Security_Testing/04-Authentication_Testing/02-Testing_for_Default_Credentials)

I made my changes on commit [90735fae170a18bb1c288c0503cf9905561c973d](https://github.com/kartoza/docker-osm/commit/90735fae170a18bb1c288c0503cf9905561c973d).

There are several places the username and password must be changed:

1. Docker compose:
	1. services.db.environment.POSTGRES_USER
	1. services.db.environment.POSTGRES_PASS
	1. services.db.environment.POSTGRES_DBNAME
	1. services.imposm.environment.POSTGRES_USER
	1. services.imposm.environment.POSTGRES_PASS
	1. services.imposm.environment.POSTGRES_DBNAME
	1. services.osmenrich.environment.POSTGRES_USER
	1. services.osmenrich.environment.POSTGRES_PASS
	1. services.osmenrich.environment.POSTGRES_DBNAME
1. settings/qgis_style.sql
	1. l40 change OWNER
	1. l54 change OWNER
	1. l814 change docker to osm
	1. l1589 change docker to osm
	1. l1860 change docker to osm
	1. l2154 change docker to osm
	1. l2423 change docker to osm
	1. l3027 change docker to osm
	1. l3297 change docker to osm