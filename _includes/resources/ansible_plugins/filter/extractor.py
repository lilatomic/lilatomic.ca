DOCUMENTATION = r"""
name: extract_connectionstring
short_description: extracts the connection stirng from azure_rm_storageaccount_info
description:
  - extracts the connection stirng from M(azure_rm_storageaccount_info)
  - make sure to use the option C(show_connection_string: true) on the M(azure_rm_storageaccount_info) invocation
options:
  rm_info:
  description: 
    - The result of azure_rm_storageaccount_info
  type: object
  required: True
  endpoint:
  description:
    - The storageaccount endpoint to get the connectionstring for
    - if blank, will fetch for blob
    - use "key" to get the key itself
  choices: ["blob", "file", "queue", "table", "key"]
  required: False
    default: blob
"""

EXAMPLES = r"""
- name: get storageaccount info
  azure_rm_storageaccount_info:
    name: "{{ storage_acount_name }}"
    resource_group "{{ rg }}"
    show_connection_string: true # important !
  register: storageaccount_raw

- name: get blob connection string
  set_fact:
    blob_connectionstring: "{{ storageaccount_raw | extract_connectionstring }}

- name: get connection string for something other than blob
  set_fact:
    table_connectionstring: "{{ storageaccount_raw | extract_connectionstring('table') }}

- name: get account key
  set_fact:
    connectionstring: "{{ storageaccount_raw | extract_connectionstring('key') }}
"""


def extract_connectionstring(rm_info, endpoint="blob"):
	if endpoint == "key":
		return rm_info["storageaccounts"][0]["primary_endpoints"]["key"]
	else:
		return rm_info["storageaccounts"][0]["primary_endpoints"][endpoint][
			"connectionstring"
		]


class FilterModule(object):
	def filters(self):
		return {"extract_connectionstring": extract_connectionstring}
