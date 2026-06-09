---
title: Bad in the Second Derivative
description: Identifying a bad thing that will never improve
date: 2026-06-09
tags:
  - thoughts
layout: post
---
# Bad in the Second Derivative

I've been thinking about capabilities that don't improve after a long time.

- The capability is bad
- it's also not improving
- the rate at which it's improving is itself not improving

That is, the quantity is low, the 1st derivative of the quantity is low, and the 2nd derivative of the quantity is also low.

I'll use cooking as the example throughout, but this is really about technical capabilities.
- The capability is bad: Dishes made do not taste good. Errors in execution result in failures
- The capability is not improving: Dishes remain bad, and failures continue.
- The rate at which it's improving is itself not improving: The rate of improvement remains flat, if improvement happens at all.

{% note %}
I assume that the skill in question is one that a person should actively be improving.
If an SRE has no frontend skills, but it's acceptable that their web UIs are made with raw HTML,
it doesn't really matter if they're not improving
{% endnote %}

## What this means

These are the observable features. Each dish provides an assessment of the current culinary capability. Evaluating dishes over time provides an assessment of improvement. Evaluating the rate of change of the rate of improvement requires thinking a little, but is straightforward to evaluate by comparing the rate of change over time. If you do quarterly reviews, compare the rate of change noted in each quarter for the past year.

A bad capability means that someone isn't very good at the task. Cooking is a skill, and training and experience matter; not everyone has that. A bad rate of change means that someone isn't good at learning the skill. Cooking requires some talents (such as a sense of taste, following directions, fusing multiple sense and correlating them with previous results); not everyone has developed those. Someone who stuggles with complex instructions will struggle to follow recipes where each step has unlabelled substeps and the ingredients aren't near the instructions that use them (which is most of them). Someone without strong intuition of cooking might struggle to learn what sounds and smells imply that meat is cooked through. Not having those talents will mean that practicing cooking will be slower and less successful. A bad 2nd derivative means that someone isn't good at learning. They aren't evaluating their process for which parts aren't working. They aren't identifying that they stuggle with the instructions, and that they should rewrite the recipe to be easier to follow. They aren't recognising that their trial-and-error isn't building an intuition for when meat is cooked through, and that they should find another way.

{% note %}
Some problems and interventions will operate on multiple levels.
For example, improving the clarity of the recipe instructions increases the raw capability,
since dishes are more likely to be correctly made and therefore successful.
But clear instructions can also increase the rate of learning:
A recipe that fails because a key step was skipped doesn't actually teach much about the how the techniques are supposed to work.
{% endnote %}

{% note %}
Also remember that each derivative is the rate of change of the quantity before it.
It should feel like interventions in a particular derivate "happen" in the quantity they're a derivative of.
For example, a cooking class improves the actual cooking ability.
That's correct, that's the rate of change:
each cooking class is an improvement in the cooking ability, and the rate of improvement due to cooking classes per unit time is the rate of change.
{% endnote %}

## It's worse than that

But these are only the observable features. A 2nd derivative which is not changing implies that the 3rd derivative is near 0.
- they aren't good
- they're not improving
- they aren't able to evaluate their progress at improving
- and they don't have an effective way of evaluating that

Is there hope that somehow the 4th derivative will save this mess?
