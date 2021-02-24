from ipaddress import ip_network


def ip_in_snet(snet, ip):
	_snet = ip_network(snet)
	_ip = int(ip)
	return _snet[_ip]


class FilterModule(object):
	def filters(self):
		return {"ip_in_snet": ip_in_snet}