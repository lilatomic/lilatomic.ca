---
title: Testing Azure Durable Functions in Python
description: It is possible to test Azure Durable Functions in Python, but it's more difficult than you'd want and not for the reasons you'd expect
date: 2021-11-30
tags:
  - serverless
  - azure
  - testing
  - python
layout: layouts/post.njk
buildscript: azure_function_durable_testing.xonsh
---

<!-- prettier-ignore-start -->
*[ADF]: Azure Durable Function
*[SLF]: ServerLess Function
<!-- prettier-ignore-end -->

# Testing Azure Durable Functions in Python

[TLDR](#making-a-useful-mocking-library)

Azure Durable Functions allow you to use Azure Serverless Functions to make workflows and to implement a number of standard patterns for enterprise systems. Obviously, we'd like to test our code. But the Serverless paradigm does not lend itself well to rapid cycle times and deep testing. Every deploy-test-evaluate cycle to a testing instance in Azure takes about 5 minutes, especially if you've bought into the whole stack and are monitoring with AppInsights. Plus, it's difficult to test for error conditions if you have to actually produce them in an environment rather than being able to mock them in. Wouldn't it be nice if we could test these function like they were normal functions with all the techniques and tools that we developed for those?

Forunately, Azure Functions are amenable to this. But most of the examples are wrong.

## Background : Python Generators

ADFs make use of Python generators to invoke other functions. Here's an example from the [tutorial](https://docs.microsoft.com/en-us/azure/azure-functions/durable/durable-functions-sequence?tabs=python):

```python
result1 = yield context.call_activity('E1_SayHello', "Tokyo")
```

If you're only a little familiar with Python generators, you've probably seen them as a way to generate a (possible infinite) sequence of values. The example from the [Python wiki](https://wiki.python.org/moin/Generators) generates a series of numbers up to a value:

```python
def first_n(n):
	num = 0
	while num < n:
		yield num
		num += 1
```

The syntax here is a bit different than the one used in the ADF, in that the return of the yield statement is discarded. If you're more familiar with Python generators, you might know that the `yield` statement can have a return value if you're using it to send values _to_ a generator and get a return from it using the `send` keyword:

```python
def useful():
	n = 0
	while True:
		x = n * 2
		n = yield x
```

We can then use it with

```python
>>> g = useful()
>>> g.send(None) # prime the generator
0
>>> g.send(42)
84
```

But this is actually hiding some complexity, which we can see if we instrument this function. We could use print statements, but we're going to need some more sophisticated instrumentation later, so we're instead going to just push things onto a list:

```python
e = []
def log(event):
	e.append(event)

def useful():
	r = 0
	log("init")
	while True:
		log("start of loop")
		x = r * 2
		log(f"computation done: {r} * 2 = {x}")
		r = yield x
		log(f"yielded {x=}, got {r=}")
```

We can test this out with

```python
g = useful()
log(g.send(None))
log("sending 10")
log(g.send(10))
log("sending 11")
log(g.send(11))
```

This gives us about what we'd expect:

```python
['init',
 'start of loop',
 'computation done: 0 * 2 = 0',
 0,
 'sending 10',
 'yielded x=0, got r=10',
 'start of loop',
 'computation done: 10 * 2 = 20',
 20,
 'sending 11',
 'yielded x=20, got r=11',
 'start of loop',
 'computation done: 11 * 2 = 22',
 22]
```

What complexity is that hiding? From one perspective, none. This is exactly what the `send` keyword was built for. Of course this is how you build coroutines. But there is a key difference between a coroutine and an ADF: the ADF is the one doing the driving. That is, in this example, we sent values to the generator and got results back; but in an ADF, the generator submits tasks nebulously and gets the results back. This is completely backwards. For example, we normally have a function that looks something like this:

```python
{% include_raw "azure_functions/durable_testing_python/00_sample_function.py" %}
```

So what happens if we make a generator which looks like that?

```python
{% include_raw "azure_functions/durable_testing_python/00_generator_like_sample.py", 7, 19 %}
```

Let's pretend that we're submitting tasks and we want the number to be added to 100:

```python
{% include_raw "azure_functions/durable_testing_python/00_generator_like_sample.py", 21, 26 %}
```

we get

```python
Traceback (most recent call last):
  File "_includes/resources/azure_functions/durable_testing_python/00_generator_like_sample.py", line 25, in <module>
    log(g.send(102))
StopIteration: 102
>>> pprint.pp(e)
['init',
 0,
 'yielded x=0, got r=100',
 1,
 'yielded x=1, got r=101',
 2,
 'yielded x=2, got r=102']
```

Well that makes sense. It's a bit weird that the return value comes in the `StopIteration`, but it's in the documentation for generators.

## Background : A basic executor

Let's pretend that instead of mocking out the dispatching, we actually wanted to run the ADF. With the knowledge we gained from exploring generators previously, we know that we'll have 3 different conditions to handle:

- the initial task which will be submitted through the priming (with `send(None)`)
- all the intermediate executions
- the return value which will be sent in a `StopIteration`

We can then bang out the following executor:

```python
{% include_raw "azure_functions/durable_testing_python/01_executor.py", 26, 37 %}
```

We can also restart it equivalently as follows, although I'm not sure it's clearer.

```python
{% include_raw "azure_functions/durable_testing_python/01_executor_alternative.py", 26, 37 %}
```

This simple executor suggests an alternative for mocking the functions that our orchestrator calls out to. Instead of trying to patch those functions, we could simply execute the function-under-test with an executor which will provide the answers we need. This means that we can't use fun mocking libraries out-of-the-box, but it also means that we might not need to use them.

## Background : Examining the source code

Microsoft has been open-sourcing a lot of their stuff. This is very convenient for them: Every time their documentation is missing something very basic, if it happens to be important enough for a company, that company might pay someone to dig into that code and write up that documentation.

There are 3 relevant repositories:

- [azure-fucntions-python-worker](https://github.com/Azure/azure-functions-python-worker) : the thing that loads functions and dispatches calls
- [azure-functions-python-library](https://github.com/Azure/azure-functions-python-library) : contains various bits for bindings and extensions
- [azure-functions-durable-python](https://github.com/Azure/azure-functions-durable-python) : the extension for ADFs

The 3rd is the important one. The executor is called [TaskOrchestrationExecutor](https://github.com/Azure/azure-functions-durable-python/blob/9a02c58616a5de272ea7ad81c7071449b83509ab/azure/durable_functions/models/TaskOrchestrationExecutor.py). You'll notice that you can't find calls which invoke the `__next__()` method (either the `next` keyword or hidden in iterable operations, like `list(generator)`) on the generator itself. But it does call `send` on that generator [here](https://github.com/Azure/azure-functions-durable-python/blob/9a02c58616a5de272ea7ad81c7071449b83509ab/azure/durable_functions/models/TaskOrchestrationExecutor.py#L214). They do iterate over the `history` [here](https://github.com/Azure/azure-functions-durable-python/blob/9a02c58616a5de272ea7ad81c7071449b83509ab/azure/durable_functions/models/TaskOrchestrationExecutor.py#L76), but it's not as straightforward as that.

### User code generator

We'll start closest to our code: the `resume_user_code` function. I'll first point out that they catch the `StopIteration` and mark that as the function output, just like out little executor. The most interesting part is:

```python
# resume orchestration with a resolved task's value
task_value = current_task.result
task_succeeded = current_task.state is TaskState.SUCCEEDED
new_task = self.generator.send(
	task_value) if task_succeeded else self.generator.throw(task_value)
self.context._add_to_open_tasks(new_task)
```

It's a bit hard to parse out, but this code uses the `send` to send the previous result _and_ to get the next task at the same time. Just like our little executor!
Later, it also shuffles the new task to the current task, and adds it to the list of actions in the `context`.But if you trace it, you find that this doesnt actually trigger any further execution.

### Iterating over the tasks

The only iteration we've seen is over the `history` parameter. This is passed into the `TaskOrchestrationExecutor.execute` method. You have to dig in to the internals of the ADF execution to find where this comes from. Essentially, every time a function is ready to advance, the entire function up to that point will be invoked. Every time a task is created (with `yield context.call_activity(...)`, for example), that result has been serialised and is passed back into the function. The orchestrator can then advance until it hits a `yield` statement which creates a new task.

This replay behaviour is somewhat described in the article on [Orchestrator function code constraints](https://docs.microsoft.com/en-us/azure/azure-functions/durable/durable-functions-code-constraints). The focus isn't really on the implementation; it's on the natural consequence that only deterministic APIs can be used.

You can see the replay behaviour for yourself by instrumenting a basic function.

```python
{% include_raw "azure_functions/durable_testing_python/02_instrumented_orchestrator.py" %}
```

We then get this as the trace. We _also_ get a `Non-Deterministic workflow detected` warning, which is True.

```
[['Tokyo'],
 ['Tokyo', 'Seattle'],
 ['Tokyo', 'Seattle', 'London'],
 ['Tokyo', 'Seattle', 'London', 'Done']]
```

## Mocking durable functions

With all the background done, it looks like there are 3 parts to the challenge of implementing mocking for ADF:

1. feeding in a DurableOrchestrationContext
2. creating a mock executor
3. mocking the evaluation of remote calls

### DurableOrchestrationContext

There's a bit of shimming that you have to do to get one of these created, but you can just fake all the values and it seems to work as well as we need it to.

```python
{% include_raw "azure_functions/durable_testing_python/03_with_mocking/simple.py", 16, 24 %}
```

### Creating a mock executor

We've done most of the generator work for the executor. Now we have to build it to actually interpret the Tasks that are given to it. There are a few task types that we have to handle: `AtomicTask`, `WhenAllTask`, `WhenAnyTask`. We can also handle `RetryAbleTask` (subclass of `WhenAllTask`) and `TimerTask` (subclass of `AtomicTask`) separately if we choose, although I'm going to leave that as a contribution for the reader. Handling these is mostly a matter of dispatching down to the `AtomicTask`s in the `CompoundTask`s. After that, we just need to unwrap the requested `Action` and dispatch that to our mocks.

```python
{% include_raw "azure_functions/durable_testing_python/03_with_mocking/simple.py", 98, 108 %}
```

### Mocking the evaluation of remote calls

The `Action` itself has 3 properties we care about:

- type (`ActionType`) : the category of thing we want invoked, like an Activity Function or a SubOrchestrator
- function name : the name of that thing we want invoked
- intput\_ : the paylod to send to that function

So now it's just a matter of building a system which can dispatch the first 2 and pass in the 3rd item. This too isn't hard. One hiccough is that some of the types are sortof equivalent from a unit-testing point of view (`CALL_ACTIVITY` vs `CALL_ACTIVITY_WITH_RETRY`). We don't need to handle `WHEN_ANY` or `WHEN_ALL` because we expand those into the component tasks, although we do need to add a way of determining which task to resolve.

There's honestly not much special with this code, so I'm just going to skip talking about it. you can see the whole resources in the repo.

## Making a useful mocking library

This executor is competent enough at walking through a function, but it lacks the ability to intelligently verify calls like other popular mocking libraries. Good thing all of our functions accept Task objects which contain the function invocation and the argument.
We should try for a similar API to `unittest.mock`. Implementing it is straightforward, although does require a bit of gruntwork. Reporting results is where most of the utility comes from, and I'll admit that I skimped on that.

```python
{% include_raw "azure_functions/durable_testing_python/04_verify_mocking/executor.py" %}
```
