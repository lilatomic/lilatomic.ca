---
title: "Incident: Temporal Thundering Herd"
description: An incident with Temporal where a thundering herd made it worse
date: 2026-06-10
tags:
  - incident
  - temporal
layout: post
---

<!-- prettier-ignore-start -->
*[PG]: PostgreSQL
*[Temporal]: Temporal is a distributed, scalable, and fault-tolerant workflow orchestration platform.
*[CNPG]: Cloud Native PostgreSQL, the Kubernetes operator for PostgreSQL.
*[QPS]: Queries Per Second
<!-- prettier-ignore-end -->

# Incident: Temporal Thundering Herd

Maybe this helps you?

## The problem

We had an incident with our self-hosted temporal cluster. It started with our database, a single node Postgres managed by CNPG, being overwhelmed with database connections, logging that the remaining connections were reserved for Admin access.
The DB wasn't being overstretched for resources, however. It has available mem limit and uncapped CPU. Historically, the single node has handled the traffic of our little Temporal just fine, even dealing with large traffic spikes.
I'm honestly not sure why the connections were all consumed.

Hotfixing that was simply increasing the number of allowed connections. Once the DB was back up, temporal was not back to normal. Workflows could be enqueued, but would not be dispatched to even run to their first activity function. Activity functions would also not be called.

## The investigation

PG logs showed tonnes of `PID in cancel request did not match any process`. I think that indicates that something attempted to cancel a PG query that had already completed. On the Temporal History side, there were lots of Golang errors about contexts canceled/deadline exceeded with message `Error acquiring shard`, and many others with `shard status unknown`. My understanding of Temporal History is that it divides the history into shards so multiple history nodes can operate without contention. The query for acquiring a shard for PG involves some row-locking with `SELECT ... FOR UPDATE` {% source "https://github.com/temporalio/temporal/blob/87ece67d6134ee4af33dfb999bc9c9a3212e9cad/common/persistence/sql/sqlplugin/postgresql/shard.go#L22" %}.

Now, we only have one history node, and that's worked well forever (even at 10x normal load). So Temporal failing to claim a shard is not a result of contention between history nodes having locked rows. Restarting the PG server, which ought to release the lock (by ending all transactions), didn't fix it either. This indicates to me that the timeout isn't because of locking.

I increased logging on PG for long queries to see if any of the attempts to get the lock were actually taking a long time. Nope. Logging every query showed that indeed many queries were being made. None were taking a long time (more than 1s), and only a few were taking more than 100ms. So PG itself wasn't overwhelmed.

To try that out some more, I tried fiddling with the number of allowed connections on the Temporal side. At the SQL connection level, none of `maxIdleConns`, `maxConns`, or `maxConnLifetime` resulted in a resolution. Lowering the Temporal dynamic config max QPS only resulted in a tonne of errors about exceeding the max QPS.

## The resolution

This all lead me to believe that the issue was some type of thundering herd problem. Temporal tries to do everything, but it's too many at once. These tasks spend too long in some queue before they resolve, while their timer is still running. Eventually the timer expires, and Temporal cancels the task and re-enqueues it. Since nothing ever completes, this queue never gets drained.

There isn't a way to increase the timeout for these queries. If we could increase the timeout, at least _some_ of the queries would complete, which would remove some from the doomed queue; eventually, the queue would drain. But the context deadline is calculated as 2s, scaled by `debug.TimeoutMultiplier` {% source "https://github.com/temporalio/temporal/blob/8530a1017e6bde84d1fed61adbd6401ec428677a/service/history/shard/context_impl.go#L199" %}. This is a compile-time constant set to 1 in non-debug builds. Shame it isn't a dynamic config.

If I couldn't increase the timeout to eventually drain the config, I could try to increase the throughput of the PG server. Even if each query takes the same amount of time, more queries could be processed in the same duration. This would reduce the number of queries in the queue and eventually drain it. I'm never sure what I'm doing when tuning postgres, but doubling `max_parallel_workers` and  `max_worker_processes` from the default 32 to 64 seemed to work.

After that, the Temporal cluster was able to claim shards and resume operation. We accumulated a sizable backlog. Temporal worked through it at about 20x the baseline rate. This increase in processing rate is comparable with what we've seen in the past with other times we've had large backlogs (for example, when bugs took out the workers).

