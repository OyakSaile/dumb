# Levels — templates and a worked example

Headers below are shown in English, the canonical form; render them in the user's language.

## `dev` (default) — about 250 words

```
🧠 What we're doing
<1–2 sentences. Names the story / file / function / command being touched right now.>

🎯 Why (the bigger picture)
<At most 4 sentences: the goal this serves; where it sits (epic, roadmap,
 dependency chain); what breaks or gets harder without it; why now and not later.>

🪄 Analogy
<2–3 sentences. One real-world analogy, each part mapped to one part of this step.>

👀 Senior's eye
<2 bullets, one sentence each: trade-offs or pitfalls a senior would watch for right here.>

🤔 One question
<One question the user can answer to check they got it. Omit if it would be forced.>

➡️ Next step: <one line>
```

## `zero` — about 300 words, the analogy carries the explanation

```
🪄 Analogy
<3–4 sentences. The real-world analogy first; the rest of the answer refers back to it.>

🧠 What we're doing
<2–3 sentences. The step, told through the analogy; every technical word appears as
 "term (plain-words meaning)" the first time.>

🎯 Why (the bigger picture)
<2–3 sentences: what goes wrong without it, in the analogy's terms, then in the
 project's terms. On a BMAD story this slot still names the epic, the stories it
 builds on and the story it blocks — in plain words, not numbers alone.>

🤔 One question
<One question answerable from the analogy.>

➡️ Next step: <one line>
```

No `👀 Senior's eye` section at this level.

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
We wrote the `webhook_retries` migration for story 5.6: the table holding every failed payment webhook and when to retry it.

🎯 Why (the bigger picture)
5.6 belongs to Epic 5 (Payments): "a confirmed payment becomes a paid order, always". 5.3 (webhook) and 5.4 (idempotency) guarantee the confirmation arrives and is not processed twice, but not that it arrives at all if the order processor is down that second. Without retry a real payment vanishes, which is why 5.7 (status screen) is blocked: you cannot show "paid" for something that can disappear. AC 2 fixes the shape: 1m → 5m → 25m → 2h, 5 attempts.

🪄 Analogy
A tracked parcel: if nobody answers, the carrier does not bin it; they leave a notice and come back at longer and longer intervals. After 5 attempts it goes to the depot (dead letter) and someone collects it.

👀 Senior's eye
- `next_attempt_at` needs an index: the job asks "what is due?" every minute.
- Retry without 5.4's idempotency = double payment; reprocessing goes down the same path.

🤔 One question
Why growing intervals instead of retrying every minute?

➡️ Next step: the job that reads `next_attempt_at <= now()`.
```
