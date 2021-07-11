from typing import Dict
from urllib.parse import urljoin

import requests
from ansible.plugins.action import ActionBase

NS = "lilatomic_api_http"


class ConnectionInfo(object):
	def __init__(self, base, kwargs=None):
		self.base = base
		self.kwargs = kwargs or {}


class ActionModule(ActionBase):
	def run(self, tmp=None, task_vars=None):
		super().run(tmp=tmp, task_vars=task_vars)

		connection_name = self.arg("connection")
		connection_info = ConnectionInfo(**task_vars[NS][connection_name])
		task_kwargs = self.arg_or("kwargs", {})

		method = self.arg_or("method", "GET")
		data = self.arg_or("data")
		json = self.arg_or("json")

		request_kwargs = recursive_merge(connection_info.kwargs, task_kwargs)
		r = requests.request(method, urljoin(connection_info.base + '/', self.arg("path").strip("/")),
			data=data, json=json, **request_kwargs)

		return {"result": r.json()}

	def arg(self, arg):
		return self._task.args[arg]

	def arg_or(self, arg, default=None):
		return self._task.args.get(arg, default)


def recursive_merge(a: Dict, b: Dict, path=None) -> Dict:
	""" Recursively merges dictionaries
	Mostly taken from user `andrew cooke` on [stackoverflow](https://stackoverflow.com/a/7205107)
	"""
	path = path or []
	out = a.copy()
	for k in b:
		if k in a:
			if isinstance(a[k], dict) and isinstance(b[k], dict):
				out[k] = recursive_merge(a[k], b[k], path + [str(k)])
			else:
				out[k] = b[k]
		else:
			out[k] = b[k]
	return out
