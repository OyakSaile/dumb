# Levels — the chat reply and the dialogue

The depth goes in the document ([document.md](document.md)). The chat stays short: at most 100 words plus the path. Never paste the document into the chat.

Headers below are shown in English, the canonical form; render them in the user's language.

## The chat reply, every level except `terms`

```
<3–5 short lines: what we're doing and why it matters, plain words,
 one new technical term per sentence at most.>

📄 <path to the file that was written>
Read the whole document first. When you are done, say so and we go on from there.
```

At `senior` the last line is omitted. This first reply never asks a question and never offers terms: the user has not read the document yet. The level's ending below is sent only after the user says they have read it ("li", "read it", "done").

## `dev` (default) — ending, after the user has read the document

One line, nothing more:

```
Want me to explain <term>, <term> or <term>, or shall we continue?
```

If the user says continue, say nothing further and continue the task. If the user picks a term, answer it in chat under the dialogue rules below.

## `zero` — ending, after the user has read the document

Aliases `eli5`, `beginner`, `junior`. Sent when the user says they have read it; the reply ends here and **the turn stops**. Do not explain the offered terms yet.

```
🤔 Before we go on:
1. Want me to explain any of these? <term> · <term> · <term>
2. Quick question: <one simple comprehension question about this step>
```

## `senior` — ending

Aliases `pro`, `expert`. Nothing, not even the "read it first" line. No question, no offer to define terms. The document carries the trade-offs.

## `terms` — chat only, no file

Aliases `termos`, `jargon`, `glossary`.

```
📚 Terms in this step
- **<term>** — <one-sentence meaning, with the reason it exists>. Here: <one concrete example from this task>.
- ...

➡️ Next step: <one line>
```

Three to eight items, no analogy.

## Dialogue rules

- **A term the user picked** — about 80 words: one sentence of meaning, then how it works in this project naming a real file or function, then one tiny example. Then, at `zero` only, one new question.
- **A wrong answer to the check question** — do not repeat the same explanation. Explain it a different and simpler way, then ask one new question.
- **"entendi" / "ok" / "got it"** — close with `➡️ Next step` and nothing else.
- Never offer a term the user already knows or already had explained.
- Stop asking the moment the user turns back to the task.

## Worked example — `dev` chat reply

Situation: story 5.6, the `webhook_retries` migration was just written, the user asks "why are we doing this story?".

```
We just added the table that remembers a payment confirmation we failed to
process, so a retry can pick it up later. Without it, one second of downtime in
the order service loses a real payment, because the provider only tells us once.
I wrote the whole thing up, parts and diagrams included.

📄 docs/dumb/2026-09-22-retry-webhook-backoff.md
Read the whole document first. When you are done, say so and we go on from there.
```

The user replies "read it". Only now the offer line:

```
Want me to explain webhook, idempotency or dead letter, or shall we continue?
```

## Worked example — `zero` chat reply, then one follow-up

```
We created a table called `webhook_retries`. It stores the payment confirmations
our system failed to handle the first time, so we can try again later. Without
it, the money leaves the customer and the order never becomes paid.

📄 docs/dumb/2026-09-22-retry-webhook-backoff.md
Read the whole document first. When you are done, say so and we go on from there.
```

The user replies "done, read it". Only now the check block:

```
🤔 Before we go on:
1. Want me to explain any of these? webhook · idempotency · dead letter
2. Quick question: if we never saved that message, what would happen to the
   customer's order?
```

The user replies "I don't know what a webhook is". Only that term is answered, then one new question:

```
A webhook is one system calling another to announce that something just happened,
so we never have to keep asking. Here the payment provider calls our
`handlePaymentWebhook` function in `src/payments/webhook.ts` the moment a payment
clears. It arrives once, which is exactly why losing it is expensive.

🤔 One more: that function calls `processOrder` straight away. What happens today
if `processOrder` fails?
```
