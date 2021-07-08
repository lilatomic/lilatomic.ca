You can include only the sections of the documentation that you want to appear. Here's the [full referece](https://docs.ansible.com/ansible/2.10/dev_guide/developing_modules_documenting.html) for the version this article was written to. For convenience, here they are:

- Shebang & encoding
- Copyright
- DOCUMENTATION (includes module parameters)
- EXAMPLES
- RETURN

These have to be python strings which contain the YAML. This makes it kinda gross to work on, since you have no YAML syntax highlighting to help you. Here's a stub python file (feel free to change the license line):

{% raw %}

```python
#!/usr/bin/python
# -*- coding: utf-8 -*-
# Copyright: (c) {{ year }}, {{ Your Name }} <{{ your email }}>
# GNU Affero General Public License v3.0+ (see COPYING or https://www.gnu.org/licenses/agpl-3.0.txt)

DOCUMENTATION = r"""
module:
short_description:
description:
  -
version_added: "0.1.0"
options:
"""

EXAMPLES = r"""
"""

RETURN = r"""
{{ key }}:
  desctiption:
  returned:
  type:
  sample:
"""
```

{% endraw %}
