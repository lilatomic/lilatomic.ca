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
		if isinstance(task, dftask.AtomicTask):
			return self._handle_task(task)
		elif isinstance(task, dftask.WhenAllTask):
			return self._handle_task_all(task)
		elif isinstance(task, dftask.WhenAnyTask):
			return self._handle_task_any(task)

	def _handle_task(self, task):
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
