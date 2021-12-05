import copy
import datetime
import itertools
import json
import operator
import random
from collections import defaultdict
from dataclasses import dataclass
from typing import Callable, Dict, Iterable, List, NewType, Union

import azure.durable_functions as df
import azure.durable_functions.models.actions as dfactions
import azure.durable_functions.models.Task as dftask


def make_ctx() -> df.DurableOrchestrationContext:
	"""Create a DurableOrchestrationContext by filling in dummy values """
	fakeEvent = {
		"EventType": 12,
		"EventId": -1,
		"IsPlayed": False,
		"Timestamp": datetime.datetime.utcnow().isoformat(),
	}
	return df.DurableOrchestrationContext([fakeEvent], "", False, "")


@dataclass
class AZDFMock:
	type_: dfactions.ActionType
	name: str
	fn: Callable


Handlers = NewType("Handlers", Dict[dfactions.ActionType, Dict[str, Callable]])


def mocks2handlers(mocks: List[AZDFMock]) -> Handlers:
	by_type = itertools.groupby(mocks, key=operator.attrgetter("type_"))
	handlers = {type_: {mock.name: mock.fn for mock in mocks} for type_, mocks in by_type}
	return handlers


def combine_handlers(this, that):
	combined = {}
	for type_ in dfactions.ActionType:
		combined[type_] = {**this.get(type_, {}), **that.get(type_, {})}
	return combined


class MockExecutor:
	def __init__(
		self, handlers: Handlers, _select_winning_task: dftask.WhenAnyTask = None
	) -> None:
		self.handlers = handlers
		self._select_winning_task = _select_winning_task or self._select_random_task

		self._calls = []
		self._invocations = []

	@staticmethod
	def _select_random_task(task: dftask.WhenAnyTask):
		"""Resolve a WhenAnyTask by selecting a random Task. This is used as the default"""
		return random.choice(task.children)

	@staticmethod
	def _collapse_types(type_: dfactions.ActionType) -> dfactions.ActionType:
		remapped = {
			dfactions.ActionType.CALL_ACTIVITY_WITH_RETRY: dfactions.ActionType.CALL_ACTIVITY,
			dfactions.ActionType.CALL_SUB_ORCHESTRATOR_WITH_RETRY: dfactions.ActionType.CALL_SUB_ORCHESTRATOR,
		}
		if type_ in remapped:
			return remapped["type"]
		else:
			return type_

	@classmethod
	def create(cls, mocks: Union[AZDFMock, Iterable[AZDFMock]]) -> "MockExecutor":
		"""Create an executor with handlers taken from mocks"""
		if isinstance(mocks, AZDFMock):
			mocks = [mocks]
		return cls(mocks2handlers(mocks))

	@classmethod
	def lax(cls, default: Callable = lambda x: x) -> "MockExecutor":
		"""Create an executor where all not-found handlers will be passed to a default.
		If the `default` is not supplied, it defaults to just returning the arguments."""
		default_by_type = defaultdict(lambda: default)
		default_handler = defaultdict(lambda: default_by_type)
		return cls(default_handler)

	def with_handlers(self, handlers: Handlers) -> "MockExecutor":
		"""Specialise a copy of this executor with another handler tree"""
		return MockExecutor(combine_handlers(self.handlers, handlers))

	def with_mock(self, mock: Union[AZDFMock, Iterable[AZDFMock]]):
		"""Specialise a copy of this executor with other mocks"""
		if isinstance(mock, AZDFMock):
			mock = [mock]
		return MockExecutor(combine_handlers(self.handlers, mocks2handlers(mock)))

	def execute(self, fn):
		"""Execute an orchestrator function with external calls mocked"""
		ctx = make_ctx()
		g = fn(ctx)
		result = None
		try:
			while True:
				task = g.send(result)
				result = self._handle(task)
		except StopIteration as ret:
			return ret.value

	def _handle(self, task: dftask.TaskBase):
		self._invocations.append(task)
		if isinstance(task, dftask.AtomicTask):
			return self._handle_task(task)
		elif isinstance(task, dftask.WhenAllTask):
			return self._handle_task_all(task)
		elif isinstance(task, dftask.WhenAnyTask):
			return self._handle_task_any(task)

	def _handle_task(self, task):
		self._calls.append(task)
		return self._handle_action(task._get_action())

	def _handle_task_all(self, task: dftask.WhenAllTask):
		return [self._handle_task(x) for x in task.children]

	def _handle_task_any(self, task: dftask.WhenAnyTask):
		winning_task = copy.copy(self._select_winning_task(task))
		result = self._handle_task(winning_task)
		setattr(winning_task, "result", result)
		return winning_task

	def _handle_action(self, action: dfactions.Action):
		return self.handlers[self._collapse_types(action.action_type)][
			action.function_name
		](json.loads(action.input_))

	def invocations(self):
		"""
		RMIs that are submitted for execution through `yield` statements.
		WhenAllTasks will have subcalls nested within it.
		WhenAnyTasks will have _all_ of their subcalls nested as children
		"""
		return self._invocations

	def calls(self):
		"""
		RMIs that are actually executed
		`WhenAllTask`s will not be included, but their children will
		`WhenAnyTask`s will not be included, and only the "winning" task will be included
		"""
		return self._calls

	def _find_calls_matching_action(
		self, predicate: Callable[[dftask.TaskBase, dfactions.Action], bool]
	) -> List[dftask.TaskBase]:
		calls_and_actions = ((t, t._get_action()) for t in self.calls())
		# matched = next(ca for ca in calls_and_actions if predicate(*ca), (None, None))
		matched = filter(lambda ca: predicate(*ca), calls_and_actions)
		tasks = map(lambda ca: ca[0], matched)
		return list(tasks)

	def _find_called(self, action_type, function_name) -> List[dftask.TaskBase]:
		def _p(c, a):
			return a.action_type == action_type and a.function_name == function_name

		return self._find_calls_matching_action(_p)

	def assert_called(self, action_type, function_name):
		assert len(self._find_called(action_type, function_name)) > 0

	def assert_called_once(self, action_type, function_name):
		assert len(self._find_called(action_type, function_name)) == 1

	def _find_called_with(self, action: dfactions.Action):
		action_as_json = action.to_json()

		def _p(c, a):
			return a.to_json() == action_as_json

		return self._find_calls_matching_action(_p)

	def assert_called_with(self, action: dfactions.Action):
		c = self.calls()[-1]
		assert c._get_action().to_json() == action.to_json()

	def assert_called_once_with(self, action: dfactions.Action):
		self.assert_called_once(action.action_type, action.function_name)
		assert len(self._find_called_with(action)) == 1

	def assert_any_call(self, action: dfactions.Action):
		assert len(self._find_called_with(action)) > 0

	def assert_has_calls(
		self, actions: Iterable[dfactions.Action], any_order: bool = False
	):
		if any_order:
			for action in actions:
				self.assert_any_call(action)
		else:
			remaining_calls = iter(self.calls())
			remaining_actions = iter(actions)

			def find_next_call_matching(a: dfactions.Action):
				while True:
					call = next(remaining_calls)
					if call._get_action().to_json() == a.to_json():
						return

			for action in remaining_actions:
				try:
					find_next_call_matching(action)
				except StopIteration:
					unmatched = [action] + list(remaining_actions)
					raise AssertionError("not all calls matched", unmatched)

	def assert_not_called(self, action_type, function_name):
		assert len(self._find_called(action_type, function_name)) == 0
		
