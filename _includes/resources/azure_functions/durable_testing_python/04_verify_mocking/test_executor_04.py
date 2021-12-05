import pytest
import azure.durable_functions as df
import azure.durable_functions.models.actions as dfactions
import azure.durable_functions.models.Task as dftask

from dftest import orchestrator_function

from executor import MockExecutor, mocks2handlers, AZDFMock

class TestMocking:
	def test_pushing_context(self):
		x = MockExecutor(
			mocks2handlers(
				[
					AZDFMock(
						dfactions.ActionType.CALL_ACTIVITY, "Hello", lambda name: f"Hello {name}!"
					)
				]
			)
		)
		r = x.execute(orchestrator_function)

	def test_mocking__works(self):
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

	def test_mocking__reads_args(self):
		x = MockExecutor(
			mocks2handlers(
				[
					AZDFMock(
						dfactions.ActionType.CALL_ACTIVITY, "Hello", lambda name: f"Hello {name}!"
					)
				]
			)
		)
		r = x.execute(orchestrator_function)
		assert r["atomic0"] == "Hello atomic0!"
		assert r["atomic1"] == "Hello atomic1!"
		assert r["taskall"] == ["Hello all0!", "Hello all1!", "Hello all2!"]
		assert r["taskany"] in {"Hello any0!", "Hello any1!", "Hello any2!"}

	def test_mocking__change_any_strategy(self):
		x = MockExecutor(
			mocks2handlers(
				[
					AZDFMock(
						dfactions.ActionType.CALL_ACTIVITY, "Hello", lambda name: f"Hello {name}!"
					)
				]
			),
			lambda l: l.children[2],
		)
		r = x.execute(orchestrator_function)
		assert r["taskany"] == "Hello any2!"

	def test_mocking__lax(self):
		x = MockExecutor.lax()
		r = x.execute(orchestrator_function)
		assert r["atomic0"] == "atomic0"

	def test_mocking__lax_with_fallback(self):
		x = MockExecutor.lax(lambda x: f"default {x}")
		r = x.execute(orchestrator_function)
		assert r["atomic0"] == "default atomic0"

	def test_mocking__fluent_builder__mock(self):
		x = MockExecutor.lax().with_mock(
			AZDFMock(dfactions.ActionType.CALL_ACTIVITY, "Hello", lambda name: f"Hello {name}!")
		)
		r = x.execute(orchestrator_function)
		assert r["atomic0"] == "Hello atomic0!"

	def test_mocking__fluent_builder__handlers(self):
		x = MockExecutor.lax().with_handlers(
			{dfactions.ActionType.CALL_ACTIVITY: {"Hello": lambda name: f"Hello {name}!"}}
		)
		r = x.execute(orchestrator_function)
		assert r["atomic0"] == "Hello atomic0!"


class TestVerification:
	@staticmethod
	def called_once_orchestrator(context):
		yield context.call_activity("NotLast", "called_once")
		result = yield context.call_activity("Hello", "called_once")
		return result

	def test_tasks_are_pushed(self):
		x = MockExecutor.lax()
		r = x.execute(orchestrator_function)
		assert len(x.invocations()) > 0
		assert len(x.calls()) > 0

	def test_calls_is_executed_RMIs(self):
		x = MockExecutor.lax()
		r = x.execute(orchestrator_function)

		assert len(x.calls()) == 6
		assert all(map(lambda x: isinstance(x, dftask.AtomicTask), x.calls()))

	def test_invocations_is_submitted_RMIs(self):
		x = MockExecutor.lax()
		r = x.execute(orchestrator_function)

		i = x.invocations()
		assert len(i) == 4
		assert isinstance(i[0], dftask.AtomicTask)
		assert isinstance(i[1], dftask.AtomicTask)
		assert isinstance(i[2], dftask.WhenAllTask)
		assert isinstance(i[3], dftask.WhenAnyTask)

	def test_verify_called__called(self):
		x = MockExecutor.lax()
		r = x.execute(orchestrator_function)

		x.assert_called(dfactions.ActionType.CALL_ACTIVITY, "Hello")

	def test_verify_called__not_called(self):
		x = MockExecutor.lax()
		r = x.execute(orchestrator_function)

		with pytest.raises(AssertionError):
			x.assert_called(dfactions.ActionType.CALL_ACTIVITY, "NotARealFunction")

	def test_verify_called_once(self):
		x = MockExecutor.lax()
		r = x.execute(self.called_once_orchestrator)

		x.assert_called_once(dfactions.ActionType.CALL_ACTIVITY, "Hello")

	def test_verify_called_once__not_once(self):
		x = MockExecutor.lax()
		r = x.execute(orchestrator_function)

		with pytest.raises(AssertionError):
			x.assert_called_once(dfactions.ActionType.CALL_ACTIVITY, "Hello")

	def test_verify_called_with__last(self):
		x = MockExecutor.lax()
		r = x.execute(orchestrator_function)

		with pytest.raises(AssertionError):
			x.assert_called_once_with(
				dfactions.CallActivityAction("Hello", input_="called_once")
			)

	def test_verify_called_with__not_last(self):
		x = MockExecutor.lax()
		r = x.execute(orchestrator_function)

		with pytest.raises(AssertionError):
			x.assert_called_once_with(
				dfactions.CallActivityAction("NotLast", input_="called_once")
			)

	def test_verify_called_once_with__called(self):
		x = MockExecutor.lax()
		r = x.execute(self.called_once_orchestrator)

		x.assert_called_once_with(dfactions.CallActivityAction("Hello", input_="called_once"))

	def test_verify_called_once_with__called_wrong_arguments(self):
		x = MockExecutor.lax()
		r = x.execute(self.called_once_orchestrator)

		with pytest.raises(AssertionError):
			x.assert_called_once_with(dfactions.CallActivityAction("Hello", input_="wrong_args"))

	def test_verify_called_once_with__called_more_than_once(self):
		x = MockExecutor.lax()
		r = x.execute(orchestrator_function)

		with pytest.raises(AssertionError):
			x.assert_called_once_with(
				dfactions.CallActivityAction("Hello", input_="called_once")
			)

	def test_verify_any_call__called(self):
		x = MockExecutor.lax()
		r = x.execute(orchestrator_function)

		x.assert_any_call(dfactions.CallActivityAction("Hello", input_="atomic0"))

	def test_verify_any_call__not_called(self):
		x = MockExecutor.lax()
		r = x.execute(orchestrator_function)

		with pytest.raises(AssertionError):
			x.assert_any_call(dfactions.CallActivityAction("Hello", input_="bad args"))

	def test_verify_any_call__nested(self):
		"""Test for when the call is nested inside of a WhenAnyTask or a WhenAllTask"""
		x = MockExecutor.lax()
		r = x.execute(orchestrator_function)

		x.assert_any_call(dfactions.CallActivityAction("Hello", input_="all0"))

	def test_verify_has_calls__ordered_has(self):
		x = MockExecutor.lax()
		r = x.execute(orchestrator_function)

		x.assert_has_calls(
			[
				dfactions.CallActivityAction("Hello", input_="atomic0"),
				dfactions.CallActivityAction("Hello", input_="atomic1"),
			]
		)

	def test_verify_has_calls__ordered_not_matched(self):
		x = MockExecutor.lax()
		r = x.execute(orchestrator_function)

		calls = [
			dfactions.CallActivityAction("Hello", input_="notfound"),
			dfactions.CallActivityAction("Hello", input_="atomic1"),
		]

		with pytest.raises(AssertionError) as e:
			x.assert_has_calls(calls)

		# assert returns unmatched calls
		assert e.value.args[1] == calls

	def test_verify_has_calls__ordered_out_of_order(self):
		x = MockExecutor.lax()
		r = x.execute(orchestrator_function)

		calls = [
			dfactions.CallActivityAction("Hello", input_="atomic1"),
			dfactions.CallActivityAction("Hello", input_="atomic0"),
		]

		with pytest.raises(AssertionError) as e:
			x.assert_has_calls(calls)

		# assert returns unmatched calls
		assert e.value.args[1] == [calls[1]]

	def test_verify_has_calls__unordered_out_of_order(self):
		x = MockExecutor.lax()
		r = x.execute(orchestrator_function)

		calls = [
			dfactions.CallActivityAction("Hello", input_="atomic1"),
			dfactions.CallActivityAction("Hello", input_="atomic0"),
		]

		x.assert_has_calls(calls, any_order=True)

	def test_verify_has_calls__unordered_not_matched(self):
		x = MockExecutor.lax()
		r = x.execute(orchestrator_function)

		calls = [
			dfactions.CallActivityAction("Hello", input_="notfound"),
			dfactions.CallActivityAction("Hello", input_="atomic1"),
		]

		with pytest.raises(AssertionError) as e:
			x.assert_has_calls(calls)


	def test_verify_not_called__called(self):
		x = MockExecutor.lax()
		r = x.execute(orchestrator_function)

		with pytest.raises(AssertionError):
			x.assert_not_called(dfactions.ActionType.CALL_ACTIVITY, "Hello")

	def test_verify_not_called__not_called(self):
		x = MockExecutor.lax()
		r = x.execute(orchestrator_function)

		x.assert_not_called(dfactions.ActionType.CALL_ACTIVITY, "NotARealFunction")
