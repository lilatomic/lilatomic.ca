DOCUMENTATION = """
---
author: lilatomic
httpapi: http
short_description: generic http connection
description: 
  - This HttpApi plugin provides a generic HTTP client. This makes it quicker to interact with HTTP APIs than using the URI module
"""

import json

from ansible.plugins.httpapi import HttpApiBase

EMPTY_DATA = object()


class HttpApi(HttpApiBase):
	def send_request(self, path, data=EMPTY_DATA, method="GET", **message_kwargs):
		# set headers for body
		headers = {'Accept-Encoding': 'application/json'}
		if not data or data == EMPTY_DATA:
			data = {}
		else:
			headers['Content-Type'] = 'application/json'

		# actually send the connection
		r, r_data = self.connection.send(path=path, data=data, method=method, headers=headers)

		# data is returned as bytes, so we have to pull it out
		r_data_serialisable = json.loads(r_data.read().decode("utf-8"))

		return {
			"response": {
				"data": r_data_serialisable,
				"msg": r.msg,
				"code": r.code,
				},
			"request": {
				"url": r.url
				}
			}
