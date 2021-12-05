import azure.durable_functions as df


def orchestrator_function(context: df.DurableOrchestrationContext):
	atomic0 = yield context.call_activity("Hello", "atomic0")
	atomic1 = yield context.call_activity("Hello", "atomic1")

	tasks_all = [context.call_activity("Hello", x) for x in ("all0", "all1", "all2")]
	taskall = yield context.task_all(tasks_all)

	tasks_any = [context.call_activity("Hello", x) for x in ("any0", "any1", "any2")]
	taskany = yield context.task_any(tasks_any)

	r = {
		"atomic0": atomic0,
		"atomic1": atomic1,
		"taskall": taskall,
		"taskany": taskany.result,
	}
	return r


main = df.Orchestrator.create(orchestrator_function)
