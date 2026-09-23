<p align="center">
  <img src="https://raw.githubusercontent.com/OyakSaile/dumb/main/assets/banner.png" alt="total-dumb — the /dumb agent skill explains what your AI is doing right now and why" width="860">
</p>

<p align="center">
  <img src="https://img.shields.io/badge/npm-total--dumb-CB3837?logo=npm&logoColor=white" alt="npm package total-dumb">
  <img src="https://img.shields.io/badge/node-%E2%89%A5%2018-5FA04E?logo=node.js&logoColor=white" alt="Node 18 or newer">
  <img src="https://img.shields.io/badge/dependencies-0-4FD1C5" alt="zero dependencies">
  <img src="https://img.shields.io/badge/license-MIT-A78BFA" alt="MIT license">
</p>

<p align="center">
  <b>Your agent is three files deep into a story you never asked about. Type <code>/dumb</code>.</b>
</p>

---

Coding agents are very good at doing the work and very bad at telling you why they are doing it. You watch a migration appear, a job get scheduled, a column get indexed, and the honest answer to "why this, now?" is somewhere in a story file you have not opened.

`/dumb` is an [Agent Skill](https://agentskills.io) that answers that question from where you actually are. It reads the story, its epic and the code around the change, then gives you the step, the bigger picture, an analogy that maps, what a senior would watch for, and where the task resumes. In your language.

It works in **Claude Code, Cursor, Codex and OpenCode**, installs with one command, and has zero runtime dependencies.

## What it looks like

You are mid-story. The migration just landed. You type `/dumb`:

```
🧠 What we're doing
We wrote the `webhook_retries` migration for story 5.6: the table holding every
failed payment webhook and when to retry it.

🎯 Why (the bigger picture)
5.6 belongs to Epic 5 (Payments): "a confirmed payment becomes a paid order,
always". 5.3 (webhook) and 5.4 (idempotency) guarantee the confirmation arrives
and is not processed twice, but not that it arrives at all if the order processor
is down that second. Without retry a real payment vanishes, which is why 5.7
(status screen) is blocked: you cannot show "paid" for something that can
disappear. AC 2 fixes the shape: 1m → 5m → 25m → 2h, 5 attempts.

🪄 Analogy
A tracked parcel: if nobody answers, the carrier does not bin it; they leave a
notice and come back at longer and longer intervals. After 5 attempts it goes to
the depot (dead letter) and someone collects it.

👀 Senior's eye
- `next_attempt_at` needs an index: the job asks "what is due?" every minute.
- Retry without 5.4's idempotency = double payment; reprocessing goes down the
  same path.

🤔 One question
Why growing intervals instead of retrying every minute?

➡️ Next step: the job that reads `next_attempt_at <= now()`.
```

Note what is *not* there: no lecture on what a migration is. Every line names something real from your task. That is the whole design constraint.

## Install

```bash
npx total-dumb
```

It detects the agents you have, asks global or project, and copies the skill.

```bash
npx total-dumb -y                         # all detected agents, global
npx total-dumb --project                  # into the current repo
npx total-dumb --agents claude,codex -g   # pick agents
npx total-dumb --uninstall                # remove it again
npx total-dumb --dry-run                  # show what would happen, write nothing
```

Also available through the `skills` CLI:

```bash
npx skills add OyakSaile/dumb
```

## Three levels

| You type | You get |
|---|---|
| `/dumb` | the six slots above, for a developer who wants the why (~250 words) |
| `/dumb zero` | for someone who has never seen this before: the analogy carries it, every technical word glossed on first use, no senior section (~300 words) |
| `/dumb terms` | just the vocabulary: 3 to 8 terms from this step, each with a concrete example from your task |

Aliases: `eli5` and `beginner` for `zero`; `termos`, `jargon` and `glossary` for `terms`.

You do not have to use the slash command. "why are we doing this?", "what is this for?", "I don't get it", "explain this step" all trigger it mid-task. Ask in any language and the answer comes back in it, headers included.

## Where the "why" comes from

It reads at most three files and stops as soon as it can be specific.

- **BMAD projects** (`docs/stories/` exists): the story file, then its epic, then the PRD. That order fills the dependency chain first, which is why the example above knows that 5.7 is blocked.
- **Everything else**: `README`, `docs/`, `ROADMAP`, ADRs, `PLAN`/`TODO`, `AGENTS.md`, then the code around the change.
- **No planning docs at all**: it says so in one line, then reasons from the callers, the tests and the git history instead of inventing a rationale.

If the motivation is weak or the step looks unnecessary, it says that too. Learning to judge the work is part of the point.

## Where it gets installed

| Agent | Project (`--project`) | Global (default) |
|---|---|---|
| Claude Code | `.claude/skills/dumb` | `~/.claude/skills/dumb` |
| Cursor | `.agents/skills/dumb` | `~/.cursor/skills/dumb` |
| Codex | `.agents/skills/dumb` | `~/.codex/skills/dumb` |
| OpenCode | `.agents/skills/dumb` | `~/.config/opencode/skills/dumb` |

`CLAUDE_CONFIG_DIR`, `CODEX_HOME` and `XDG_CONFIG_HOME` are honored.

## How it was built

Test-first, the same way you would build a feature. The scenario was run against a fixture repo by fresh subagents **without** the skill to establish a baseline, then again with it.

The baseline answers were not wrong, they were shapeless: five of five runs produced a correct 322 to 382 word essay with no analogy, no pitfalls, no reflection question and no distinct next step. Every element the skill enforces exists because a real run dropped it, and three rounds of fixes each closed a failure that was actually observed rather than imagined.

## License

MIT © Kayo Elias
