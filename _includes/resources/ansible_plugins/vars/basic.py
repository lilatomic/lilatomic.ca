DOCUMENTATION = r"""
vars: gitroot
version_added: "0.2"
short_description: Finds the git root
description: Finds the git root
options:
  stage:
    ini:
      - key: stage
        section: lilatomic.alpacloud.gitroot
    env:
      - name: LILATOMIC_ALPACLOUD_GITROOT
extends_documentation_fragment:
  - vars_plugin_staging
"""

import subprocess

from ansible.plugins.vars import BaseVarsPlugin


class VarsModule(BaseVarsPlugin):  # Must be named VarsModule
	def __init__(self):  # Not necessary if you're just going to call up
		super().__init__()

	def get_vars(
		self, loader, path, entities, cache=None
	):  # the function which actualy does the lookup

		# call to super. `self._basedir = basedir(path)`
		super(VarsModule, self).get_vars(loader, path, entities)

		return {"src": _get_git_root()}


def _get_git_root():
	res = subprocess.run(
		"git rev-parse --show-toplevel".split(" "),
		stdout=subprocess.PIPE,
		universal_newlines=True,
	)
	return res.stdout