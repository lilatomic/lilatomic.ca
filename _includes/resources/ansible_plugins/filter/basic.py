import re


def storage_account(name):  # 3
	return re.sub("[^a-z0-9]", "", name)[:24]


class FilterModule(object):  # 1
	def filters(self):  # 2
		return {"storage_account": storage_account}  # 4
