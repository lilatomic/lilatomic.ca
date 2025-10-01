---
title: Reading Ludicity
description: Reading notes for https://ludic.mataroa.blog/
date: 2025-08-05
tags:
  - reading
layout: post
---

[Ludicity](https://ludic.mataroa.blog/) writes extensively to the malaise I feel about organisations. It feels like they're as bad as they can be without actually failing. There's a lack of focus on delivering anything, and -- worse -- no one cares. One example from the writing is an org that was cutting headcount for budget but had still deemed low-priority investigating basic waste-reduction (["I accidentally saved half a million dollars"](https://ludic.mataroa.blog/blog/i-accidentally-saved-half-a-million-dollars/)). Other examples include why projects that are obviously dead on arrival are kept alive.

Here, I summarise the articles so I can find them later for linking to folks. I highly recommend reading everything on the site. Ludic's tone is acerbic, which can grate on you. Sometimes you want to read someone tear down and pulverise the stupidity of it all, other times you wish they wouldn't be so loud doing it.

## Leadership Is A Hell Of A Drug

Ludic (and the rest of the company) is invited to a 4-hour onsite meeting "Continuous Improvement Playback & Strategy". The invitation is hillarious on it's own terms, as Ludic details.

Ludic's bigger issue, however, is with the fact that Management has signed off as "The Leadership Team". Ludic's thesis is that "management" is more about making sure things are done (like a grocery store's management), while leadership is about encouraging others to be their best. It goes without saying that no-one on The Leadership Team is capable of leadership. They're more of an omnishambles of skills in technology, project management, finance, and human interaction.

> Leadership in the absence of a skill is just aspiring to run a cult of personality.

A side point is one about metacognition. A relation thought that some parts of golang were poorly designed, but later discovered that these were actually working with complex issues. This lead to the realisation that finding flaws in golang would be better understood as flaws in their own understanding.

## I Accidentally Saved Half A Million Dollars

[source](https://ludic.mataroa.blog/blog/i-accidentally-saved-half-a-million-dollars/)

The company has a spectacularly useless analytics platform, which seems like maybe the norm. The project is a complete trainwreck, destroyed by impossibly bad ideas and people to implement them. The company, of course, doesn't _need_ data science and constantly sidetracks with requests for reports. But the project keeps lurching along. Ludic proceeds to detail how impossibly bad it is. I have a workplace hobby of finding the worst idea that technically gets the job done; but I am outclassed by this system.

> They hired some incredibly talented people to make this happen, and then like five times as many idiots.

Despite the system not having prospects of making money, so long as it only burns a budgeted amount of money, everything will be fine. However, it isn't. Ludic notices that the "on-demand" instances are set to idle for 600s after 2s queries. Ludic suggests not doing that, but it enters the ticket queue in the zone where it will never be a priority to actually do. Ludic, months later, just does it anyhow (after sanity checks in safe chats[^safechat]). Our hero saves the Org 0.5e9$/year. This would ordinarily be a point of triumph. But the ~Organism~ Organisation must now account for how, exactly, there was this much waste. Ludic lists several strategies that are used to dissemble.

Ludic's takeaway is that you can pretty handily outperform entire departments with a few good engineers. I agree. Every time I've just _done the thing_, even putting of "real priorities", my Org's been better for it.


## Your Organization Probably Doesn't Want To Improve Things

[source](https://ludic.mataroa.blog/blog/your-organization-probably-doesnt-want-to-improve-things/)

*honne-tatemae divide* as a name for the concept of the separation between what a person truly feels and the face they present in public.
Example given is about organisations needing to profess to be "data driven". They can't say that everything is garbage always, so they have to put on a face that they're just "in a digital transition". But corporate nonsense is driven both by the fact that most things are crud [Sturgeons's law](https://en.wikipedia.org/wiki/Sturgeon%27s_law)[^Sturgeonslaw]. In bringing up Sturgeon's law, Ludic also raises the point that we shouldn't be "spiritually confused" that we aren't seeing results when people aren't contributing. Ludic continues that it's basically impossible for people who are capable to achieve results as they can spend all of their time dealing with horrors dreamt into reality by people who are bad at everything and their job in particular. Admitting that a team will never be able to achieve their goals, however, is impossible; because

> either too dumb to realize it's hopeless, too perversely incentivized to be honest, or too deep into despair to admit to themselves it is hopeless

Another example given is that Management declared to someone that there was no money for raises, but was able to pay up for a raise to hire a replacement. This leads to Ludic's proposal to acknowledge that this is the face they must present and, therefore, to completely disregard it. They can talk about work culture, but so long as they don't actually remove the actively harmful staff it's just talk. Another proposal is to acknowledge that systemic change in this environment is basically impossible (and generally not worth it, discussed elsewhere) and to not spend effort changing it.

[^Sturgeonslaw]: I feel this law is a bit unfair. I'll accept that 90% of books are not great, but also they are significantly closer to a great book than random character strings or even markov chains. There's a filtering that's already happened, and "not-crud" might tautologically be defined as the 90 percentile.

[^safechat]: A chat with smart people and no Management
