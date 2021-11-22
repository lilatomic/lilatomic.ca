e = []
def log(event):
	e.append(event)



def workflow():
	log("init")
	x = 0
	r = yield x
	log(f"yielded {x=}, got {r=}")
	x = 1
	r = yield x
	log(f"yielded {x=}, got {r=}")
	x = 2
	r = yield x
	log(f"yielded {x=}, got {r=}")
	return f"return value {r=}"


g = workflow()
log(g.send(None))
log(g.send(100))
log(g.send(101))
log(g.send(102))
