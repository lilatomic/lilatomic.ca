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


FOUND = {}


class VarsModule(BaseVarsPlugin):
	def get_vars(self, loader, path, entities, cache=None):

		if not isinstance(entities, list):
			entities = [entities]

		super(VarsModule, self).get_vars(loader, path, entities)

		if "src" not in FOUND:
			FOUND["src"] = _get_git_root()

		return {"src": FOUND["src"]}


def _get_git_root():
	res = subprocess.run(
		"git rev-parse --show-toplevel".split(" "),
		stdout=subprocess.PIPE,
		universal_newlines=True,
	)
	return res.stdout