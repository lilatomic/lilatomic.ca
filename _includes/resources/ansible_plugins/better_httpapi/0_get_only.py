from urllib.parse import urljoin

import requests
from ansible.plugins.action import ActionBase

NS = "lilatomic_api_http"


class ConnectionInfo(object):
	def __init__(self, base):
		self.base = base


class ActionModule(ActionBase):
	def run(self, tmp=None, task_vars=None):
		super().run(tmp=tmp, task_vars=task_vars)
		connection_name = self.arg("connection")
		connection_info = ConnectionInfo(**task_vars[NS][connection_name])
		r = requests.get(urljoin(connection_info.base + '/', self.arg("path").strip("/")))
		return {"result": r.json()}

	def arg(self, arg):
		return self._task.args[arg]
