#!/usr/bin/env python


__metaclass__ = type

from ansible.module_utils.basic import AnsibleModule
from ansible.module_utils.connection import Connection
from ansible.utils.display import Display

display = Display()


def main():
	argument_spec = {
		"path": {"type": "str", "default": None},
		"method": {"type": "str", "default": "GET"},
		"data": {"type": "raw", "default": None},
		}

	result = {}

	module = AnsibleModule(argument_spec=argument_spec)
	try:
		# get reference to httpapi process through socket path for RMI
		connection = Connection(module._socket_path)

		r = connection.send_request(
			path=module.params.get("path"),
			method=module.params.get("method"),
			data=module.params.get("data"),
			)
		result.update(r)
		module.exit_json(**result)
	except Exception as e:
		module.fail_json(msg=f'{e}', **result)


if __name__ == '__main__':
	main()
