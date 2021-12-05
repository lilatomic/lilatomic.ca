import os

def wo(filename: str, text: str):
	"""Write output to file"""
	with open(os.path.join("o", filename), "w") as f:
		f.write(text)

def wc(filename: str, *commands: str):
	"""Execute command and write to file, with command"""
	lines = []
	for command in commands:
		r = evalx(f"$({command})")
		lines.append("(sh)> " + command)
		lines.append(r)
		
	with open(os.path.join("o", filename), "w") as f:
		f.write("\n".join(lines))