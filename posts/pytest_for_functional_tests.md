---
title: Using Pytest for Testing Deployments
description: How to use Pytest to test deployments, batch processes, and other long-running things
date: 2020-12-30
tags:
  - python
  - infra
  - using
layout: layouts/post.njk
---

_[CD]: Continuous delivery
_[DB]: Database
_[K8s]: Kubernetes
_[SaaS]: Software as a Service \*[SLF]: ServerLess Function

# Using Pytest for Testing Deployments

[Jump to example solution](#full-solution)

## Why

Functional tests are tests against the whole application, as deployed. And if you're doing stuff in the Cloud :tm:, the Infrastructure is the Application, in many cases. So you _should_ be doing functional tests, to ensure that you are using the SaaS offerings correctly, and you may need to be in order to test the application at all. Also, if you're doing CD or if people are deploying/installing your application, you might want to test that process.

One of the problems with testing deployments is that the process can be fairly lengthy (maybe it needs to spin up a DB or K8s cluster). Tests will require the same Deployment step, though might have different setups. For example, you might have an application which can receive events from a messagequeue, a storage account, or from HTTP requests through an API Gateway. You would want to test that it consumes from all 3 sources, and would need to set up those test resources individually; but it's the same application under test.

This type of setup can be generalised to any sort of batch process. For example, you might be testing infrastructure compliance tooling, where you trigger the "evaluate" function and _all_ resources will be scanned and remediated. Triggering the "evaluate" multiple times is time-prohibitive and unnecessary, since each compliance rule will be evaluated individually. Another example would be a service which needs to be submitted to a job processor. It might be impractical to submit individual jobs for every test, because of per-job overhead.

## What

In this situation, we'd like to have: 1. several tests : It is critical that these tests are independent and look like normal tests. Solutions which will involve collecting a pile of assertions (or worse, asserting them sequentially so you only get the first failure) 2. with individual setup steps (as stated above, they may have different requirements) 3. sharing a common setup step (this is the big, time-consuming step) 4. which occurs after the individual setups (if the setups occur after big deploy step, it is actually pretty easy to do with pytest, since their failure wouldn't count as a failed prerequisite) 5. which will not be impacted by the failure of any individual test setup (obviously, the failure of the messagequeue input should not impact testing the storage account)

## How

This is my "reasonable" solution to the problem. I walk through each step to explain it. Skip ahead to the [full solution](#full-solution)

1. Several tests : Nothing complicated. The `order` fixture lets us see the execution order of fixtures. It has a `session` scope so it lasts across all of our tests. It also stands in for other common dependencies, like credentials or whatever.

```python
import pytest

@pytest.fixture(scope="session")
def order():
	x = []
	yield x
	print(x)

def test_0(order):
	order.append("test_0")
def test_1(order):
	order.append("test_1")
```

2. With individual fixtures : these are our setup filters. They're straightforward for now, but we'll need to make some modifications to them later. The first thing we'll do is to mark them with a `class` scope, which will be used to make them run only once. It might not be necessary because of pytest's fun fixture scoping rules, but I just mark them this way since it doesn't really make a difference to me.

```python
import pytest
@pytest.fixture(scope="class")
def setup_0(order):
	order.append("setup_0")

@pytest.fixture(scope="class")
def setup_1(order):
	order.append("setup_1")
```

3. Sharing a common setup step : This is our Big Thing. I've taken inspiration from the pytest page for [running multiple asserts safely](https://docs.pytest.org/en/latest/fixture.html#running-multiple-assert-statements-safely). We make a Test Class to hold all the tests which depend on the big setup. This allows us to create the Big Thing as a class-scoped fixture. The important thing about this fixture is that it is `autouse`, so it will automatically occur before all the tests. This does force us to put all the tests in this class, but that doesn't seem to be a really hard thing to do.

```python
import pytest

class TestBatch:
	@pytest.fixture(scope="class", autouse=True)
	def deploy(self, order):
		order.append("deploy")

	def test_0(order, setup_0):
		order.append("test_0")
	def test_1(order, setup_1):
		order.append("test_1")
```

4. Which occurs after the individual setups : Unfortunately, this doesn't _quite_ work, since the `setup` operations don't have to occur before the `deploy`. So we need to add them as dependencies to the `deploy` operation. The duplication of these setups is a bit not great. If I figure something better out I'll let you know. I think it's still reasonably fine to say that there's an extra step to register something as needing to happened before the deploy

```python
import pytest

class TestBatch:
	@pytest.fixture(scope="class", autouse=True)
	def deploy(self, order, setup_0, setup_1):
		order.append("deploy")

	def test_0(order, setup_0):
		order.append("test_0")
	def test_1(order, setup_1):
		order.append("test_1")
```

5. Which will not be impacted by the failure of any individual test setup : You may have notices that since the `setup` are fixture dependencies of `deploy`, their failure will cause the whole `deploy` to not start and all the tests to fail. So we'll have a fun way of catching those exceptions, and we'll explode them in the relevant test, so that only that test fails. It's not the greatest that you have to do this for all the setups.

:/conftest.py

```python
import pytest
from decorator import deorate

def shroud(f):
	def _shroud(func, *args, **kwargs):
		try:
			return func(*args, **kwargs)
		except:
			return e
	return decorate(f, _belt)

def unshroud(a):
	if isinstance(a, Exception):
		raise a
	return a
```

:/test.py

```python
import pytest
from conftest import shroud, unshroud


import pytest
@pytest.fixture(scope="class")
@shroud
def setup_0(order):
	order.append("setup_0")

@pytest.fixture(scope="class")
@shroud
def setup_1(order):
	order.append("setup_1")


class TestBatch:
	@pytest.fixture(scope="class", autouse=True)
	def deploy(self, order, setup_0, setup_1):
		order.append("deploy")

	def test_0(self, order, setup_0):
		unshroud(setup_0)
		order.append("test_0")
	def test_1(self, order, setup_1):
		unshroud(setup_1)
		order.append("test_1")
```

## Full Solution

:/conftest.py

```python
import pytest
from decorator import deorate

def shroud(f):
	def _shroud(func, *args, **kwargs):
		try:
			return func(*args, **kwargs)
		except:
			return e
	return decorate(f, _belt)

def unshroud(a):
	if isinstance(a, Exception):
		raise a
	return a
```

:/test.py

```python
import pytest
from conftest import shroud, unshroud


import pytest
@pytest.fixture(scope="class")
@shroud
def setup_0(order):
	order.append("setup_0")

@pytest.fixture(scope="class")
@shroud
def setup_1(order):
	order.append("setup_1")

@pytest.fixture(scope="class")
@shroud
def setup_failing(order):
	""" This setup fails, but only test_failing will fail """
	order.append("setup_failing")
	raisse Exception("setup failure")


class TestBatch:
	@pytest.fixture(scope="class", autouse=True)
	def deploy(self, order, setup_0, setup_1):
		order.append("deploy")

	def test_0(self, order, setup_0):
		unshroud(setup_0)
		order.append("test_0")
	def test_1(self, order, setup_1):
		unshroud(setup_1)
		order.append("test_1")

	@pytest.mark.xfail
	def test_failing(self, setup_failing, order):
		order.append("test_failing_begin")
		unshroud(setup_failing)
		order.append("unshrouding will cause this not to appear")
```
