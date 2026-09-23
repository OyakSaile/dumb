# Levels — templates and examples

Headers below are shown in English, the canonical form; render them in the user's language.

The simplicity rules in `SKILL.md` apply to every template here: short sentences, at most one new technical term per sentence, no stacked definitions, no chains of story IDs, and an everyday analogy of at most two sentences that maps one thing.

## `dev` (default) — about 150 words

```
🧠 What we're doing
<1–2 short sentences. Name the story / file / function being touched right now.>

🎯 Why (the bigger picture)
<2–3 short sentences. What this makes possible; what the earlier work built and
 what the next work needs from it, at most one story named each way.>

🪄 Analogy
<At most 2 sentences, everyday, mapping one thing. Omit if none fits naturally.>

👀 Senior's eye
<2 bullets, one sentence each: a trade-off or pitfall right here.>

➡️ Next step: <one line>

Want me to explain <term>, <term> or <term>, or shall we continue?
```

## `zero` — first reply about 120 words, then a dialogue

Aliases `eli5`, `beginner`, `junior`. The first reply ends at the check block and stops the turn.

```
🧠 What we're doing
<1–2 short sentences, no jargon.>

🎯 Why it matters
<2–3 short sentences. What goes wrong without it, in everyday terms.>

🪄 Analogy
<At most 2 sentences, everyday, mapping one thing. Omit if none fits naturally.>

🤔 Before we go on:
1. Want me to explain any of these? <term> · <term> · <term>
2. Quick question: <one simple comprehension question about this step>
```

No `👀 Senior's eye` at this level. On the user's reply: about 80 words per term they pick, meaning then how it works in this project then one tiny example; a wrong answer gets a different and simpler explanation plus one new question; "got it" closes with `➡️ Next step` alone.

## `senior` — about 120 words

Aliases `pro`, `expert`. No analogy, no comprehension question, no offer to define terms.

```
🎯 Why
<2–3 sentences. What this makes possible and what depends on it.>

👀 Trade-offs
<2–3 bullets, one sentence each: what a senior weighs right here, including the
 option that was not taken.>

➡️ Next step: <one line>
```

## `terms` — 3 to 8 items, no analogy

```
📚 Terms in this step
- **<term>** — <one-sentence meaning>. Here: <one concrete example from this task>.
- ...

➡️ Next step: <one line>
```

## Worked example (`dev`, BMAD story)

Situation: story 5.6 "Retry with backoff for webhook delivery", the migration `webhook_retries` was just written, the user asks "why are we doing this story?".

```
🧠 What we're doing
We wrote the `webhook_retries` migration for story 5.6. It stores each payment
confirmation we failed to process.

🎯 Why (the bigger picture)
Epic 5 promises that a confirmed payment always becomes a paid order. Story 5.4
already made reprocessing safe to repeat. Today, if our order service is down for a
second, that confirmation is lost and the customer paid for nothing. The 5.7
status screen cannot be trusted until this exists.

🪄 Analogy
A courier who finds nobody home leaves a notice and comes back later, instead of
binning the parcel.

👀 Senior's eye
- `next_attempt_at` will need an index, because the retry job scans it every minute.
- Five attempts over about three hours is the ceiling; a longer outage still ends in the dead-letter pile.

➡️ Next step: the job that reads `next_attempt_at <= now()`.

Want me to explain webhook, idempotency or dead letter, or shall we continue?
```

## Worked example (`zero` dialogue, same story)

First reply, then the turn ends:

```
🧠 What we're doing
We created a table called `webhook_retries`. It stores the payment
confirmations our system failed to handle.

🎯 Why it matters
When someone pays, the provider sends our system a message. If our system
is down at that moment, the message is lost and the order never becomes paid,
even though the money already left the customer. This table lets us retry.

🪄 Analogy
A courier who finds nobody home leaves a notice and returns later, instead of
binning the parcel.

🤔 Before we go on:
1. Want me to explain any of these? webhook · idempotency · dead letter
2. Quick question: if we never saved that message, what would happen to the
   customer's order?
```

The user replies "I don't know what a webhook is". Only that term is answered, then one new question:

```
🧠 webhook
A webhook is one system calling another to announce that something just happened.
Here the payment provider calls our `handlePaymentWebhook` function in
`src/payments/webhook.ts` the moment a payment clears. We never ask "is it paid
yet?" in a loop. They tell us once, so we have to be listening.

🤔 One more: that function calls `processOrder` straight away. What happens today
if `processOrder` fails?
```
