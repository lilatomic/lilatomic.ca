from ansible.plugins.action import ActionBase  # 1


class ActionModule(ActionBase):  # 2
	def run(self, tmp=None, task_vars=None):  # 3
		super().run(tmp=tmp, task_vars=task_vars)  # 4
		return {}  # 5
