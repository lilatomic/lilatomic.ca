DOCUMENTATION = r"""
vars: dhall_vars
version_added: "0.2"
short_description: Loads vars from a Dhall file
description: 
  - Loads vars from a Dhall file
options:
  stage:
    ini:
      - key: stage
        section: lilatomic.alpacloud.dhall_vars
    env:
      - name: LILATOMIC_ALPACLOUD_DHALL_VARS
extends_documentation_fragment:
  - vars_plugin_staging
"""

import os
import subprocess

from ansible.errors import AnsibleParserError
from ansible.module_utils._text import to_bytes, to_native, to_text
from ansible.plugins.vars import BaseVarsPlugin
from ansible.inventory.host import Host
from ansible.inventory.group import Group
from ansible.utils.vars import combine_vars

import dhall


FOUND = {}


class VarsModule(BaseVarsPlugin):
	def get_vars(self, loader, path, entities, cache=None):

		if not isinstance(entities, list):
			entities = [entities]

		super(VarsModule, self).get_vars(loader, path, entities)

		data = {}

		for entity in entities:
			# we set the subdir here
			if isinstance(entity, Host):
				subdir = "host_vars"
			elif isinstance(entity, Group):
				subdir = "group_vars"
			else:
				raise AnsibleParserError(
					"Supplied entity must be Host or Group, got %s instead" % (type(entity))
				)

			# avoid 'chroot' type inventory hostnames /path/to/chroot
			if entity.name.startswith(os.path.sep):
				continue

			try:
				# mostly copied from host_group_vars
				found_files = []
				# load vars
				b_opath = os.path.realpath(to_bytes(os.path.join(self._basedir, subdir)))
				opath = to_text(b_opath)
				self._display.v("\tprocessing dir %s" % opath)

				# We set the cache key to be specific to both entity and file
				key = "%s.%s" % (entity.name, opath)
				if cache and key in FOUND:
					# cache hit
					found_files = FOUND[key]
				else:
					if os.path.exists(b_opath):
						if os.path.isdir(b_opath):
							self._display.debug("\tprocessing dir %s" % opath)
							# use the file loader to load
							found_files = loader.find_vars_files(
								path=opath,
								name=entity.name,
								extensions=["", ".dhall"],
								# allow_dir=True
							)
						else:
							self._display.warning(
								"Found %s that is not a directory, skipping: %s" % (subdir, opath)
							)

				for found in found_files:
					new_data = _read_dhall_file(found)
					if new_data:  # ignore empty files
						data = combine_vars(data, new_data)

			except Exception as e:
				raise AnsibleParserError(to_native(e))

		return data


def _read_dhall_file(filename):
	with open(filename, "r") as f:
		ctn = f.read()
		vars = dhall.loads(ctn)
	return vars