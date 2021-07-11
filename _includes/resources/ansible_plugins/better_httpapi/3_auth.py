from typing import Dict, Optional
from urllib.parse import urljoin

import requests
from ansible.plugins.action import ActionBase
from requests.auth import HTTPBasicAuth, AuthBase

NS = "lilatomic_api_http"


class HTTPBearerAuth(AuthBase):
	def __init__(self, token, header="Authorization", value_format="Bearer {}"):
		self.token = token
		self.header = header
		self.value_format = value_format

	def __call__(self, r):
		r.headers[self.header] = self.value_format.format(self.token)
		return r


class ConnectionInfo(object):
	def __init__(self, base, auth=None, kwargs=None):
		self.base = base
		self.auth = self.make_auth(auth)
		self.kwargs = kwargs or {}

	@staticmethod
	def make_auth(params) -> Optional[AuthBase]:
		if params is None or params == {}:
			return None
		auth_method = params.pop("method", "basic")
		if auth_method == "basic":
			return HTTPBasicAuth(params["username"], params["password"])
		elif auth_method == "bearer":
			return HTTPBearerAuth(**params)
		else:
			return None


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
			auth=connection_info.auth, data=data, json=json, **request_kwargs)

		return {"result": str(r.__dict__), "h": r.request.headers}

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
