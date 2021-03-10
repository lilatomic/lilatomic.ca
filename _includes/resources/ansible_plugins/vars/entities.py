DOCUMENTATION = r"""
vars: knownhostentry
version_added: "0.2"
short_description: Adds a known-hosts entry for each host, if you have one
description: 
  - Adds a known-hosts entry for each host, if you have one in you local known-hosts
  - Useful for not having to construct it every time
options:
  stage:
    ini:
      - key: stage
        section: lilatomic.alpacloud.knownhostentry
    env:
      - name: LILATOMIC_ALPACLOUD_KNOWNHOSTENTRY
extends_documentation_fragment:
  - vars_plugin_staging
"""
import json
import os
import subprocess

from ansible.errors import AnsibleParserError
from ansible.module_utils._text import to_bytes, to_native, to_text
from ansible.plugins.vars import BaseVarsPlugin
from ansible.inventory.host import Host
from ansible.inventory.group import Group
from ansible.utils.vars import combine_vars


from ansible.utils.display import Display

display = Display()

FOUND = {}


class VarsModule(BaseVarsPlugin):
	def get_vars(self, loader, path, entities, cache=True):

		# not sure what this is about, it's not invoked when I run it
		# there's probably a compatibility thing
		if not isinstance(entities, list):
			entities = [entities]

		super(VarsModule, self).get_vars(loader, path, entities)

		data = {}
		# loop through entities
		for entity in entities:
			# entities come as either Hosts or Groups. This example ignores groups.
			if isinstance(entity, Host):
				...
			elif isinstance(entity, Group):
				continue
			else:
				raise AnsibleParserError(
					"Supplied entity must be Host or Group, got %s instead" % (type(entity))
				)

			if entity.name.startswith(os.path.sep):
				# avoid 'chroot' type inventory hostnames /path/to/chroot
				# this is from the sample plugin
				continue

			try:
				key = str(entity.name)
				if cache and key in FOUND:
					known_hosts = FOUND[key]
				else:
					FOUND[key] = _get_known_host(entity.name)
					known_hosts = FOUND[key]

				if known_hosts:
					data["known_hosts"] = known_hosts

			except Exception as e:
				display.warning("HALP")
				raise AnsibleParserError(to_native(e))

		display.v(json.dumps(data))
		return data


def _get_known_host(host, file="~/.ssh/known_hosts"):
	file = os.path.expanduser(file)

	cmd = ["/usr/bin/ssh-keygen", "-f", file, "-F", host]

	display.v(f"cmd : {cmd}")
	res = subprocess.run(
		cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, universal_newlines=True,
	)
	display.v(f"stdout {res.stdout}")
	display.v(f"stderr {res.stderr}")
	display.warning(res.stderr)
	lines = res.stdout.split("\n")
	hostlines = [x for x in lines if x and not x.startswith("#")]
	return hostlines
