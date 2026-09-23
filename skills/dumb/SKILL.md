---
name: dumb
description: Use when the user invokes /dumb or, in the middle of any task (a BMAD story, a refactor, a bug fix, a migration, a config change), asks why the current step exists or what it is for — "why are we doing this?", "what is this for?", "I don't get it", "explain this step", "não entendi", "por que isso?", "explica". Optional level after the name — dev (default), zero, senior, terms.
---

# dumb — explain the current step and its why

## Overview

An agent is shipping features faster than anyone can read them, and the system design disappears into the diff. This skill exists so the person actually learns it. Write a structured Markdown explainer into the project, then keep the chat short and let the user ask for more.

**Everything has a why.** Every rule, number, acceptance criterion, pattern and design choice you mention carries its reason, in the same sentence or the next. Never "AC 2 defines 1m → 5m → 25m → 2h, 5 attempts". Instead: "AC 2 spaces the retries as 1m → 5m → 25m → 2h because the first one catches a short blip cheaply, the later ones stop hammering a service that is genuinely down, and 5 attempts cap the wait near three hours before a human has to look." If the real reason is not written down anywhere, say so and give the most likely one, labelled as a guess.

**Specific beats correct-but-generic.** Every sentence names something real: the story, the file, the table, the queue.

**One idea at a time.** A reply the user has to decode has failed, however accurate it is.

## Simplicity rules — everywhere

- Short sentences, one idea each.
- At most one new technical term per sentence.
- No `term (meaning)` stacks. Definitions belong in the Glossary.
- No chains of story IDs. One story back, one story forward, in plain words.
- Analogies only where they help: everyday, 2 sentences at most, mapping one thing.

## Steps

1. **Pick the level and the language.** An explicit level after `dumb` wins; otherwise use step 2. The language is the one the user writes in this conversation; when the invocation is too short to tell (`/dumb terms`), take it from the surrounding conversation and the project's docs. Every word of the document and the reply is in that language, headers included.

   | Level | Aliases | Document | Chat ends with |
   |---|---|---|---|
   | `dev` (default) | — | full | one offer line |
   | `zero` | `eli5`, `beginner`, `junior` | full, bigger Glossary, an analogy per part | the check block, then stop |
   | `senior` | `pro`, `expert` | no Glossary, no analogies, trade-offs in the why | nothing |
   | `terms` | `termos`, `jargon`, `glossary` | none, chat only | nothing |

2. **Adaptive default.** With no level given, read the user's message. It uses the step's technical terms correctly, or asks a precise trade-off question → `senior`. "não entendi", "I'm lost", "o que é isso", or a bare "why?" → `dev`. Never offer to define a term the user just used correctly.

3. **Find the context, then the parts.** Search order and what to extract are in [references/context.md](references/context.md). Then list the parts this feature touches, by their real names: components, services, queues, workers, agents, tables, endpoints, jobs. Take them from the story or spec and from the code, never from imagination.

4. **Write the document.** If `docs/dumb/*-<feature-slug>.md` already exists, overwrite that file and keep its name, so re-running `/dumb` on the same feature updates one document instead of adding another; otherwise create `docs/dumb/<yyyy-mm-dd>-<feature-slug>.md`, creating the folder if needed. The template, the diagram rules and a worked excerpt are in [references/document.md](references/document.md). Skip this step at `terms`.

5. **Reply in chat**, at most 100 words plus the path. Shapes and dialogue rules are in [references/levels.md](references/levels.md).

## The chat reply

```
<3–5 short lines: what we're doing and why it matters, plain words.>

📄 <path to the file that was written>

<the level's ending, or nothing at `senior`>
```

The document carries the depth. The chat carries the invitation. Never paste the document into the chat.

## Dialogue

When the user picks a term, answer in chat, about 80 words: one sentence of meaning, then how it works in this project naming a real file or function, then one tiny example. A wrong answer to the check question gets a different and simpler explanation, then one new question. "entendi" / "got it" closes with `➡️ Next step` and nothing else. Never offer a term the user already knows or already had explained, and stop asking the moment they turn back to the task.

## When the task is a BMAD story

The "why" says which epic the story serves and what that epic delivers, what the most relevant earlier story already built, and the one later story that needs this one. Plain words, never ID arithmetic, and every one of them carries its reason.

## Honesty

If the motivation is weak, unclear, or the step looks unnecessary, say so. Learning to judge work is part of becoming a better developer.

## Common mistakes

| Mistake | Fix |
|---|---|
| Stating a rule, number or acceptance criterion with no reason | Every one carries its why in the same sentence or the next |
| Inventing a why that is not in the docs or the code | Say the reason is not recorded, then give the likely one and label it a guess |
| Pasting the document into the chat | The chat is 3–5 lines plus the path |
| A part described only as it exists here | Three layers: in general with the usual alternative, in this project, how it connects |
| Stacked definitions, three `term (meaning)` pairs in a row | Name the term and move on; the Glossary defines it |
| A chain of story IDs | One story back, one story forward, in plain words |
| Explaining the offered terms at `zero` before the user asks | The first reply ends at the check block; wait |
| Quizzing a user who already said they get it, or who asked to continue | Stop asking the moment they turn back to the task |
| Offering to define a term the user just used correctly | That user is `senior`; give trade-offs instead |
| Replying in English to a user who wrote in another language | Language comes from the conversation and the project's docs |
