---
author:
  name: Ken Andersen
cover_image: /assets/blog/blog_2026_04_29_234112_reference_repos/reference-repos-save-tokens.png
cover_image_alt: Diagram showing reference repos and AGENTS.md files helping an AI
  coding agent build new apps faster with lower token spend.
created_at: '2026-04-29T22:13:53Z'
language: en
post_id: blog_2026_04_29_234112_reference_repos
published_at: '2026-04-29T22:13:53Z'
seo:
  meta_description: A practical guide to using reference repositories, AGENTS.md files,
    and reusable app patterns to make agentic coding faster and less wasteful.
  meta_title: How Reference Repos Help Me Build Apps Faster
slug: how-reference-repos-help-me-build-apps-faster
status: published
summary: A practical look at why I keep building new apps, how reference repos and
  AGENTS.md files speed up agentic coding, and why reusing proven patterns beats rebuilding
  the same app foundation from scratch.
title: How Reference Repos Help Me Build Apps Faster
updated_at: '2026-04-29T22:13:53Z'
---

# How Reference Repos Help Me Build Apps Faster

I do not think every app idea will succeed.

But I do think app ideas deserve to be built and properly tested in the market.

That sounds a little contradictory at first. Why build more than one app if one good idea is supposed to be enough? Why not wait until the perfect idea arrives, commit to it fully, and avoid spreading attention across experiments?

The honest answer is that its really hard to guess beforehand.

Some products look promising as notes in a document, but feel flat when they become an actual app. Some ideas look small, but become much more interesting once the first real interaction is working. Some ideas are mostly practice. Some are technical stepping stones. Some teach us about distribution, pricing, onboarding, paywalls, subscriptions, support, analytics, or why a feature that sounds obvious on paper feels annoying in a real product.

So I like to experiment by building more than one app.

Not because I want chaos, but because repetition is one of the best teachers I know.

## Why Build More Than One App?

There are at least three reasons.

The first reason is discovery.

Most people do not hit their best product idea on the first attempt. A good idea is not just a sentence. It is a combination of timing, user need, execution, positioning, pricing, distribution, design taste, and personal motivation. You can think your way into parts of that, but at some point the idea has to become software.

Building several small apps gives you more shots on goal.

The second reason is learning and getting better at it.

Mobile app development is full of details that only become visible when you tackle it straight on and repeat. Authentication. In app purchases. Local state. Push notifications. In-app purchases. Deep links. App Store assets. Build pipelines. Privacy pages. Error reporting. Release notes. Support flows. The first time through, everything is a project. The fifth time through, some of it becomes muscle memory.

That is valuable.

The third reason is taste.

You develop product taste by seeing what happens when a feature leaves your head and meets reality. Does the onboarding feel calm? Does the paywall appear at the right moment? Is the app asking the backend the right questions? Is the empty state useful? Is the app small enough to understand? Is it too clever? Too vague? 

You do not learn those things by only planning.

You learn them by shipping enough to notice repeating patterns.

## The Problem With Starting From Scratch

The downside is obvious: every new app has a lot of repeated setup.

You need a project structure. You need dependencies. You need app configuration. You need auth. A backend. Maybe database migrations. Maybe storage. Maybe push notifications. Maybe subscriptions. Maybe a design system. Maybe analytics. Privacy pages. App icons, screenshots, and release scripts.

The danger is not just that this takes time.

The danger is that repeated setup consumes attention.

If every app starts with days of wiring, then your product idea has to survive a lot of boring work before it becomes testable. That can kill momentum. It can also tempt you into skipping important parts because you are tired of doing the same thing over again.

Agentic coding makes this more interesting, but not automatically easier.

With a coding agent, it is tempting to say:

> Build me a new app with auth, subscriptions, push notifications, clean architecture, tests, nice UI, and deployment.

Sometimes that works surprisingly well.

But if you ask the agent to rediscover your preferred app structure from nothing every time, you are spending tokens on archaeology. The agent has to infer your taste, rebuild your conventions, choose libraries, decide folder structure, invent naming, and guess where all the seams should be.

That is alot quicker than doing everything manually.

But it still has its costs in time and tokens.

![A tired developer looking at an empty token meter](/assets/blog/blog_2026_04_29_234112_reference_repos/crying-developer-out-of-tokens.png)

*The dramatic reenactment of asking an agent to recreate the same app foundation for the fourth time in a month.*

## Rewriting, Regenerating, Or Reusing?

When I start a new app, I usually see three possible paths.

The first path is to write the code again by hand.

That can be good practice. It gives you control. But if the code is mostly infrastructure you have solved before, writing it again is not always noble. Sometimes it is just expensive nostalgia.

The second path is to ask a coding agent to generate the same foundation again.

This is faster than typing it all yourself, but it has a hidden cost. The agent may solve the same problem in a slightly different way every time. The auth service gets a different shape. The billing integration gets a new naming convention. The folder structure drifts. The error handling changes. The edge cases you learned from the last project may not come along for the ride.

Maybe you switch between Claude and Codex and get slightly different approaches each time.

You can prompt harder, of course.

But now the prompt becomes a novel.

The third path is to keep reference repos.

That is the path I increasingly like.

A reference repo is not a perfect library to import, or a hard template to fill out. I do not always copy it directly. I do not want every app to become the same app with a different color palette. A reference repo is more like a memory bank for solved decisions.

It says:

- Here is how I like auth to be structured.
- Here is how I handled subscriptions last time.
- Here is the shape of a good entitlement endpoint.
- Here is the release checklist that actually worked.
- Here is how push notifications were wired.
- Here are the edge cases I already paid for with time.

That gives both me and the agent something concrete to work from.

## Tokens Are Not Just Money

When people talk about tokens, they often talk about cost.

That matters, but it is not the whole story.

Tokens are also attention. They are context budget. They are time spent explaining. They are the agent reading irrelevant files because it does not know where the important patterns live. They are long prompts repeating the same preferences. They are correction loops when the agent guessed wrong.

If a coding agent has no references, it has to spend tokens discovering what "good" means in your world.

If a coding agent has strong references, it can spend more of its context on the new problem.

![High token burn when every new app starts from an empty folder](/assets/blog/blog_2026_04_29_234112_reference_repos/high-token-burn-from-scratch.png)

*When every app starts from an empty folder, the agent spends context rebuilding foundation instead of solving the product problem.*

## What I Put In Reference Repos

The best reference repos are not giant museums.

They are curated examples of things I expect to do again.

For mobile apps, that can include:

- app startup and dependency wiring
- auth and user flow
- backend client setup
- environment configuration
- database migration style
- push notification setup
- in-app purchase and billing setup
- subscription entitlement model
- privacy, terms, and support page structure

The goal is not to preserve every line of code forever.

The goal is to preserve decisions.

For example, if I have already learned that a purchase observer should live for the app lifetime and not just inside the paywall screen, that lesson should not be trapped in my memory. It should be visible in a reference implementation. If I have already learned how I want backend entitlements shaped, I want that available. If I have already learned where Google Play subscription setup gets weird, I want notes and code close enough that I do not rediscover the same mess from scratch.

That is the real value.

## AGENTS.md Is Part Of The Reference System

A good reference repo is even better with a good `AGENTS.md`.

The code shows what exists.

The `AGENTS.md` explains how to work with it.

I like these files because they make expectations explicit. They can tell the agent where the important patterns are, what not to touch, how tests are run, which scripts matter, how environment variables are handled, and what architectural habits the repo uses.

For example:

```text
When adding a new backend function, follow the pattern in supabase/functions/example-function.
Keep raw provider payloads separate from app-facing state.
Do not put store credentials in the mobile app.
Prefer small migrations with explicit rollback notes.
```

That kind of guidance is boring in the best possible way.

It prevents the agent from improvising where I want consistency.

It also prevents me from writing the same instruction in chat every time.

## Reference Repos Change The Conversation

Without references, a prompt often sounds like this:

> Build the app foundation. Use auth. Add billing. Make it clean.  You know, the good way.

The agent does not actually know "the good way".

It might infer something reasonable. It might even do a great job. But it is still guessing.

With references, the prompt becomes more useful:

> Use all the business logic so far in OUR CURRENT PROJECT. Use `iap_and_billing_reference` repo for the subscription functionality. Use the AGENTS.md files in both repos. Keep consistent with what we have built so far, do not alter business logic, only add iap and billing.

Now the agent has something to read.

It can compare. It can extract patterns. It can reuse decisions without copying product-specific details blindly. It can ask better questions. It can also be corrected more precisely:

> This should follow the billing reference, not invent a second entitlement model.

That is a much better collaboration.

![Reference repos and AGENTS.md files reduce repeated token spend](/assets/blog/blog_2026_04_29_234112_reference_repos/reference-repos-save-tokens.png)

*A reference repo turns prior learning into reusable context. The agent spends less time rebuilding the same foundation and more time on the new app.*

## The Reference Repo Should Not Become A Prison

There is one trap.

Reference repos can become too powerful.

If every new app must inherit every decision from the previous app, you stop learning. You create a private framework without admitting it. You carry old assumptions forward. You make small experiments heavy.

So I try to treat reference repos as strong suggestions, not law.

The point is not to copy everything.

The point is to avoid forgetting what you´ve already learned.

Sometimes the new app should use the same pattern almost exactly. Sometimes it should deliberately diverge. Sometimes the reference repo is useful because it shows what not to do anymore.

That is fine.

A good reference repo should speed up thinking, not replace thinking.

## When A Reference Repo Is Worth Creating

I do not think every experiment needs one.

If the code is throwaway, keep it throwaway.

But if you find yourself saying "I will need this again", that is a signal.

Good candidates are:

- anything involving platform setup
- anything involving store or payment edge cases
- anything involving backend security
- anything involving repeated release workflow
- anything where mistakes are expensive
- anything where the implementation has several moving parts

Subscriptions are a perfect example.

It is not enough to remember "verify the purchase". You need app purchase observers, backend verification, store notifications, entitlement state, repair jobs, ownership checks, sandbox testing, and support tooling. That is exactly the kind of work that should become reference material.

The same is true for auth, push notifications, onboarding, analytics, screenshots, CI, and release checklists.

## How I Want To Use This Going Forward

My ideal flow is simple.

When I build something painful or useful, I should ask:

> Is this a one-time implementation, or did I just create a future reference?

If it is a future reference, I want to clean it up enough that a coding agent can learn from it and utilize it later.

That does not mean making it perfect.

It means:

- give it a clear README
- add or improve `AGENTS.md`
- name the important folders well
- leave notes near the weird parts
- document required secrets and scripts
- keep example flows small enough to understand
- remove product-specific clutter if the pattern is meant to travel

This is less glamorous than launching a new app.

But it compounds.

Every good reference makes the next app cheaper to start. Every clear `AGENTS.md` saves future explanation. Every reusable implementation moves the agent from "please invent my architecture" toward "please apply this known pattern to a new product".

That is a much better use of both human energy and machine context.

## Conclusion

Build more than one app because repetition teaches.

Build faster because momentum matters.

Do not spend your best energy recreating the same foundation every time.

Reference repos can be the answer to that.

They are not magic. They do not remove product thinking. They do not guarantee that an idea is good.

But they preserve hard-won decisions. They make agentic coding more grounded. They reduce wasted tokens. They help me turn previous work into future leverage.

If you are building several apps, especially with coding agents, I think this is worth trying.

Do not just build apps.

Build your own reusable memory for building apps.