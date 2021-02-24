from _includes.resources.ansible_plugins.filter.extractor import EXAMPLES


EXAMPLES = r"""
- name: format lifecycle policy
  set_fact:
    autodelete_rule: "{{ "autodelete" | storageaccount_lifecycle_rule(filters, blob_actions) }}
  vars:
    blob_actions:
      - {"delete":{"daysAfterModificationGreaterThan": 30}}
    filters:
      - {"blobTypes":["blockBlob"],"prefixMatch":["my_container"]}
"""


from typing import Dict


def rule(
	name,
	filters,
	actions_blob: Dict[str, Dict] = None,
	actions_version: Dict[str, Dict] = None,
):
	return {
		"enabled": True,
		"name": str(name),
		"type": "Lifecycle",
		"definitions": {
			"actions": {"baseBlob": actions_blob, "versions": actions_version,},
			"filters": filters,
		},
	}


class FilterModule(object):
	def filters(self):
		return {"storageaccount_lifecycle_rule": rule}
