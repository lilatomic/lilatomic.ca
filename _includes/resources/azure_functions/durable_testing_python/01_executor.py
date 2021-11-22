e = []
def log(event):
	e.append(event)


def workflow():
	log("init generator")
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


def useful(x):
	r = 100 + x
	log(f"useful function running {x} -> {r}")
	return r


def executor(generator):
	log("init executor")
	arg = generator.send(None)
	try:
		log("entering loop")
		while True:
			value = useful(arg)
			log(value)
			arg = generator.send(value)
	except StopIteration as ret:
		log("stopped iteration")
		log(f"return value is {ret.value}")


g = workflow()
executor(g)
import pprint
pprint.pp(e)