---
title: SSL with Microstack
description: Microstack is Openstack in a Snap! let's add some SSL to it
date: 2021-02-17
tags:
  - infra
  - openstack
  - trying
layout: layouts/post.njk
---

# SSL with Microstack

## Setting up HTTPS on Horizon (the dashboard)

Let's follow the docs [here](https://docs.openstack.org/horizon/latest/admin/customize-configure.html#configure-dashboard)

The config files for microstack are all in the snap directory, so look in `/var/snap/microstack/common/etc`. We want to change the hostname by replacing the relevant lines:

:/common/etc/local_settings.d/\_05_snap_tweaks.py

```python
OPENSTACK_HOST = "{{ openstack_host }}"
ALLOWED_HOSTS = "{{ openstack_host }}"
```

## SSL Cert

I tossed my cert and key into :/common/etc/ssl/private . Make sure to give it appropriate permissions

## Nginx

The config for horizon lives in :/common/etc/nginx/snap/sites-enabled/horizon.conf . I replaced the `listen` directive, gave it a `server_name`, and added the `ssl_certificate` and `ssl_certificate_key`. I found that giving the absolute path to the SSL folder worked. That gives us:

```nginx
server {
	listen 443 ssl;
	server_name alpacloud.lilatomic.ca;

	ssl_certificate /var/snap/microstack/common/etc/ssl/private/certificate.pem;
	ssl_certificate_key /var/snap/microstack/common/etc/ssl/private/private-key.pem;

	client_max_body_size 16G;

	error_log syslog:server=unix:/dev/log;
	access_log syslog:server=unix:/dev/log;
	location / {
		include /snap/microstack/222/usr/conf/uwsgi_params;
		uwsgi_param SCRIPT_NAME '';
		uwsgi_pass unix:///var/snap/microstack/common/run/horizon.sock;
	}
}

```
