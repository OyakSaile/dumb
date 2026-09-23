---
name: dumb
description: Use when the user invokes /dumb or, in the middle of any task (a BMAD story, a refactor, a bug fix, a migration, a config change), asks why the current step exists or what it is for — "why are we doing this?", "what is this for?", "I don't get it", "explain this step", "não entendi", "por que isso?", "explica". Optional level after the name — dev (default), zero, terms.
---

# dumb — explain the current step and its why

## Overview

The user is watching work happen and wants to understand it, not just get it done. Reply with a short explanation of what is being done right now and why it matters in the bigger picture, in the user's language, then say where the task resumes.

Core principle: **specific beats correct-but-generic.** Every sentence names something real from this task (the story, the file, the table, the command). "What a migration is" fails; "why this migration must land before story 5.7" passes.

## Steps

1. **Pick the level and the language.** The level is the first word after `dumb` in the invocation, else a cue in the message, else `dev`. The language is the one the user writes in this conversation; when the invocation is too short to tell (`/dumb terms`), take it from the surrounding conversation and the project's docs. Every word of the answer is in that language, headers included.

   | Level | Aliases | Reader |
   |---|---|---|
   | `dev` (default) | — | a developer who knows the basics and wants the why |
   | `zero` | `eli5`, `beginner` | someone who has never seen anything like this |
   | `terms` | `termos`, `jargon`, `glossary` | wants the vocabulary of this step |

2. **Locate the bigger picture.** Read at most 3 files; stop as soon as every slot of the template can be filled with something specific.
   - The conversation: what task is in flight and what was just done.
   - If `docs/stories/` exists (BMAD): the current story file, then its epic file (`docs/epics/`, `docs/epic-*.md`, `docs/prd*.md`).
   - Otherwise: `README*`, `docs/`, `ROADMAP*`, `docs/adr/`, `PLAN*.md`, `TODO*.md`, `AGENTS.md`, `.claude/`.
   - The code: what calls or depends on the thing being changed.
   What to pull out of each source is in [references/context.md](references/context.md).
   Nothing found? The answer opens with one line saying so, above `🧠` ("não achei docs de planejamento; explicando pelo código", in the user's language), then reasons from the code.

3. **Fill the template for the level**, in the user's language (headers included). Templates and a worked example are in [references/levels.md](references/levels.md). The `dev` template is below.

4. **Close with `➡️ Próximo passo`** — one line naming where the task resumes. The explanation does not redo, re-run, or re-implement anything already done. If the task was already in progress and the user has not asked to pause, continue it after this line.

## The `dev` template

```
🧠 O que estamos fazendo
<1–2 sentences. Names the story / file / function / command being touched right now.>

🎯 Por quê (o quadro maior)
<The goal this serves. Where it sits: epic, roadmap, dependency chain.
 What breaks or gets harder without it. Why now and not later.>

🪄 Analogia
<One real-world analogy. Each part of the analogy maps to one part of this step.>

👀 Olho de sênior
<1–2 trade-offs or pitfalls a senior would watch for right here.>

🤔 Pra pensar
<One question the user can answer to check they got it. Omit if it would be forced.>

➡️ Próximo passo: <one line>
```

Length: about 200 words. Cut, do not compress.

## When the task is a BMAD story, the "why" slot states

- which epic the story belongs to and what the epic delivers;
- which earlier stories it builds on;
- which later stories are blocked by it;
- the acceptance criterion that carries the motivation.

This holds at every level. At `zero` the same four facts are told in the analogy's terms ("a tela 5.7 não pode começar enquanto isso não existir"), not dropped.

## Honesty

If the motivation is weak, unclear, or the step looks unnecessary, the "why" slot says so. Learning to judge work is part of becoming a better developer.

## Common mistakes

| Mistake | Fix |
|---|---|
| Generic lecture ("migrations let you evolve the schema") | Name the table, the story, the story that depends on it |
| Analogy that decorates instead of maps | Each part of the analogy = one part of the step; if it does not map, choose another |
| Answering from the conversation alone when `docs/stories/` or a PRD exists | Read the story + its epic first |
| Replying in English because the invocation itself (`/dumb terms`) carried no words in the user's language | Language comes from the conversation and the project's docs, not from the trigger message |
| Reasoning from the code without saying the planning docs were missing | That line opens the answer, above `🧠` |
| Continuing to implement inside the explanation | The explanation ends at `➡️ Próximo passo`; work resumes after it |
| Past ~250 words at `dev` | Cut to ~200 for `dev`, ~250 for `zero`; the `🎯` slot is where the padding is |
