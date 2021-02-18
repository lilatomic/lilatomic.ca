#!/usr/bin/python #1

# 2
from __future__ import absolute_import, division, print_function

__metaclass__ = type


from ansible.plugins.action import ActionBase  # 3


class ActionModule(ActionBase):  # 4
	def run(self, tmp=None, task_vars=None):  # 5
		super().run(tmp=tmp, task_vars=task_vars)  # 6
		return {}  # 7
