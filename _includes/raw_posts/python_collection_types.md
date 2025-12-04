---
title: Python Collection Types for Typehinting
description: An explanation of Python's type hierarchy of collection classes for typehinting
date: 2025-12-01
tags:
  - python
layout: post
---

# Python Collection Types for Typehinting

I've split the collection structure into these segments

- linear types : list-like collections. Use `Sequence` or `MutableSequence`
- mapping types : key-value collections. Use `Mapping` or `MutableMapping`
- nonlinear types : unordered collections. Use `Set` or `MutableSet`. For generators, it's `Generator[YieldT]`[^1].
- async types : async-coloured collections
- other types : other things

## Linear Types

The linear types are list-like. If you want to manipulate the collection, you will probably want `Sequence` (which includes `tuple` and `list`) or `MutableSequence`. If all you need is to traverse it, use `Iterable`

Instead of using `TupleOf = tuple[T, ...]`, use `Sequence[T]`.

```mermaid
classDiagram
	accTitle: Class hierarchy of linear types
	Iterable: __iter__
	Iterator: __next__
	Iterator ..|> Iterable
	Reversible: __reversed__
	Reversible ..|> Iterable
	Sized: __len__
	Collection: __contains__
	Collection: __iter__
	Collection: __len__
	Collection ..|> Sized
	Collection ..|> Iterable
	Collection ..|> Container
	Sequence: __getitem__
	Sequence: __len__
	Sequence ..|> Reversible
	Sequence ..|> Collection
	MutableSequence: __getitem__
	MutableSequence: __setitem__
	MutableSequence: __delitem__
	MutableSequence: __len__
	MutableSequence: insert
	MutableSequence ..|> Sequence
```

## Mapping Types

Mapping types are key-value pairs, or something like that. Use `Mapping` or `MutableMapping`, which includes `dict` and
several relatives.

```mermaid
classDiagram
	accTitle: Class hierarchy of mapping types
	Iterable: __iter__
	Sized: __len__
	Collection: __contains__
	Collection: __iter__
	Collection: __len__
	Collection ..|> Sized
	Collection ..|> Iterable
	Collection ..|> Container
	Mapping: __getitem__
	Mapping: __iter__
	Mapping: __len__
	Mapping ..|> Collection
	MutableMapping: __getitem__
	MutableMapping: __setitem__
	MutableMapping: __delitem__
	MutableMapping: __iter__
	MutableMapping: __len__
	MutableMapping ..|> Mapping
	MappingView ..|> Sized
```

## Nonlinear Types

These collections have unordered membership, but are not associated with values. This does not extend to other semantics of `set`. For example, a `KeysView` can have duplicates, although `set` does not. You are probably not interested in MappingView.

```mermaid
classDiagram
	accTitle: Class hierarchy of nonlinear types
	Iterable: __iter__
	Generator: send
	Generator: throw
	Generator ..|> Iterable
	Sized: __len__
	Collection: __contains__
	Collection: __iter__
	Collection: __len__
	Collection ..|> Sized
	Collection ..|> Iterable
	Collection ..|> Container
	Set: __contains__
	Set: __iter__
	Set: __len__
	Set ..|> Collection
	MutableSet: __contains__
	MutableSet: __iter__
	MutableSet: __len__
	MutableSet: add
	MutableSet: discard
	MutableSet ..|> Set
	MappingView ..|> Sized
	ItemsView ..|> MappingView
	ItemsView ..|> Set
	KeysView ..|> MappingView
	KeysView ..|> Set
	ValuesView ..|> MappingView
	ValuesView ..|> Set

```

## Async Types

```mermaid
classDiagram
	accTitle: Class hierarchy for async types
	Coroutine: send
	Coroutine: throw
	Coroutine ..|> Awaitable
	AsyncIterable: __aiter__
	AsyncIterator: __anext
	AsyncIterator ..|> AsyncIterable
	AsyncGenerator: asend
	AsyncGenerator: athrow
	AsyncGenerator: AsyncIterator
```

## Other Types

If you think about it, a mapping is a function that turns keys into values. So a `Callable` is sortof a mapping type.

```mermaid
classDiagram
	accTitle: Class hierarchy of other types
	Hashable: __hash__
	Callable: __call__
	Buffer: __buffer__
```

[^1]: The full signature is `Generator[YieldType, SendType, ReturnType]`, but `SendType` and `ReturnType` default to `None` so you can just use `Generator[YieldType]`. You can also just use `Iterator[YieldType]`. You _could_ also use `Iterable[YieldType]`, but you might be confused that you can't start multiple `Iterators` of it (double-traversal will confuse everything).
