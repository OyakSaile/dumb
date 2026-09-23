---
name: dumb
description: Use when the user invokes /dumb or, in the middle of any task (a BMAD story, a refactor, a bug fix, a migration, a config change), asks why the current step exists or what it is for — "why are we doing this?", "what is this for?", "I don't get it", "explain this step", "não entendi", "por que isso?", "explica". Optional level after the name — dev (default), zero, senior, terms.
---

# dumb — explain the current step and its why

## Overview

The user is watching work happen and wants to understand it. Give a short, plain explanation of what is being done right now and why it matters, in the user's language, then either hand the turn back or continue the task.

**Specific beats correct-but-generic.** Every sentence names something real from this task: the story, the file, the table, the command.

**One idea at a time.** A reply the user has to decode has failed, however accurate it is.

## Simplicity rules — every level

- Short sentences, one idea each.
- At most **one** new technical term per sentence.
- Never stack definitions. No `term (meaning)` runs. A term is defined when the user asks for it, or at `zero` when the step makes no sense without it.
- **No chains of story IDs.** Say what the earlier work built and what the next work needs, naming at most one story each way. "5.1–5.3 unlock 5.5 and 5.6" is a failure.
- The analogy is everyday, at most 2 sentences, and maps **one** thing. If none fits naturally, leave it out.

## Steps

1. **Pick the level and the language.** An explicit level after `dumb` wins; otherwise use the adaptive default in step 2. The language is the one the user writes in this conversation; when the invocation is too short to tell (`/dumb terms`), take it from the surrounding conversation and the project's docs. Every word of the answer is in that language, headers included.

   | Level | Aliases | Shape |
   |---|---|---|
   | `dev` (default) | — | one short block, then one optional offer line |
   | `zero` | `eli5`, `beginner`, `junior` | short explanation, then a check block, then stop |
   | `senior` | `pro`, `expert` | why and trade-offs only, no analogy, no questions |
   | `terms` | `termos`, `jargon`, `glossary` | glossary of this step |

2. **Adaptive default.** With no level given, read the user's message.
   - It uses the step's technical terms correctly, or asks a precise trade-off question → `senior`.
   - "não entendi", "I'm lost", "o que é isso", or a bare "why?" → `dev`.

   Never offer to define a term the user just used correctly.

3. **Locate the bigger picture.** Read at most 3 files; stop as soon as every slot can be filled with something specific.
   - The conversation: what task is in flight and what was just done.
   - If `docs/stories/` exists (BMAD): the current story file, then its epic file (`docs/epics/`, `docs/epic-*.md`, `docs/prd*.md`).
   - Otherwise: `README*`, `docs/`, `ROADMAP*`, `docs/adr/`, `PLAN*.md`, `TODO*.md`, `AGENTS.md`, `.claude/`.
   - The code: what calls or depends on the thing being changed.

   What to pull out of each source is in [references/context.md](references/context.md).
   Nothing found? The answer opens with one line saying so, before the first section header ("No planning docs found; explaining from the code", in the user's language), then reasons from the code.

4. **Fill the template for the level.** All four are in [references/levels.md](references/levels.md), with a worked example and a `zero` dialogue.

## The `dev` template — about 150 words

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

That offer line is the entire follow-up. If the user says continue, say nothing more and continue the task. If the user picks a term, answer it the way `zero` answers a term.

## Dialogue at `zero`

The first reply is short and **ends the turn**. Do not explain the terms you just offered; wait for the user.

When the user answers:

- **Terms they picked** — one sentence of meaning, then how it works in this project naming a real file or function, then one tiny example. About 80 words per term, no more.
- **A wrong answer to the question** — do not repeat the same explanation. Explain it a different, simpler way, then ask one new question.
- **"entendi" / "ok" / "got it"** — close with `➡️ Next step` and nothing else.

Never offer a term the user already knows or already had explained. Keep going while the user engages; stop asking the moment they turn back to the task.

## When the task is a BMAD story

The "why" says which epic the story serves and what that epic delivers, in one plain sentence; what the most relevant earlier story already built; and the one later story that needs this one. Name an acceptance criterion only when it carries the motivation. Plain words, never ID arithmetic.

## Honesty

If the motivation is weak, unclear, or the step looks unnecessary, say so. Learning to judge work is part of becoming a better developer.

## Common mistakes

| Mistake | Fix |
|---|---|
| Stacked definitions, three `term (meaning)` pairs in one paragraph | Name the term and move on; offer to explain it at the end |
| A chain of story IDs | One story back, one story forward, in plain words |
| An analogy with several moving parts | Everyday, 2 sentences, one thing mapped, or no analogy at all |
| Explaining the offered terms at `zero` before the user asks | The first reply ends at the check block; wait |
| Quizzing a user who already said they get it, or who asked to continue | Stop asking the moment they turn back to the task |
| Offering to define a term the user just used correctly | That user is `senior`; give trade-offs instead |
| Generic lecture ("migrations let you evolve the schema") | Name the table, the story, what depends on it |
| Replying in English to a user who wrote in another language | Language comes from the conversation and the project's docs |
