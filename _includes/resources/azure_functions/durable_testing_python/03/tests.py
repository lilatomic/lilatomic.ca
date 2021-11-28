import azure.durable_functions.models.actions as dfactions


from simple import MockExecutor, mocks2handlers, AZDFMock
from dftest import orchestrator_function

def test_pushing_context():
	x = MockExecutor(
		mocks2handlers(
			[
				AZDFMock(dfactions.ActionType.CALL_ACTIVITY, "Hello", lambda name: f"Hello {name}!")
			]
		)
	)
	r = x.execute(orchestrator_function)


def test_mocking__works():
	x = MockExecutor(
		mocks2handlers(
			[AZDFMock(dfactions.ActionType.CALL_ACTIVITY, "Hello", lambda _: f"exec")]
		)
	)
	r = x.execute(orchestrator_function)
	assert r["atomic0"] == "exec"
	assert r["atomic1"] == "exec"
	assert r["taskall"] == ["exec", "exec", "exec"]
	assert r["taskany"] == "exec"


def test_mocking__reads_args():
	x = MockExecutor(
		mocks2handlers(
			[
				AZDFMock(dfactions.ActionType.CALL_ACTIVITY, "Hello", lambda name: f"Hello {name}!")
			]
		)
	)
	r = x.execute(orchestrator_function)
	assert r["atomic0"] == "Hello atomic0!"
	assert r["atomic1"] == "Hello atomic1!"
	assert r["taskall"] == ["Hello all0!", "Hello all1!", "Hello all2!"]
	assert r["taskany"] in {"Hello any0!", "Hello any1!", "Hello any2!"}


def test_mocking__change_any_strategy():
	x = MockExecutor(
		mocks2handlers(
			[
				AZDFMock(dfactions.ActionType.CALL_ACTIVITY, "Hello", lambda name: f"Hello {name}!")
			]
		),
		lambda l: l.children[2],
	)
	r = x.execute(orchestrator_function)
	assert r["taskany"] == "Hello any2!"


def test_mocking__lax():
	x = MockExecutor.lax()
	r = x.execute(orchestrator_function)
	assert r["atomic0"] == "atomic0"


def test_mocking__lax_with_fallback():
	x = MockExecutor.lax(lambda x: f"default {x}")
	r = x.execute(orchestrator_function)
	assert r["atomic0"] == "default atomic0"


def test_mocking__fluent_builder__mock():
	x = MockExecutor.lax().with_mock(
		AZDFMock(dfactions.ActionType.CALL_ACTIVITY, "Hello", lambda name: f"Hello {name}!")
	)
	r = x.execute(orchestrator_function)
	assert r["atomic0"] == "Hello atomic0!"


def test_mocking__fluent_builder__handlers():
	x = MockExecutor.lax().with_handlers(
		{dfactions.ActionType.CALL_ACTIVITY: {"Hello": lambda name: f"Hello {name}!"}}
	)
	r = x.execute(orchestrator_function)
	assert r["atomic0"] == "Hello atomic0!"
