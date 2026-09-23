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

`/dumb` is an [Agent Skill](https://agentskills.io) that answers that question from where you actually are. It reads the story, its epic and the code around the change, then explains in short sentences, one idea at a time, and offers to go deeper only if you want it. In your language.

It works in **Claude Code, Cursor, Codex and OpenCode**, installs with one command, and has zero runtime dependencies.

## What it looks like

You are mid-story. The migration just landed. You type `/dumb`:

```
🧠 What we're doing
We wrote the `webhook_retries` migration for story 5.6. It stores each payment
confirmation we failed to process.

🎯 Why (the bigger picture)
Epic 5 promises that a confirmed payment always becomes a paid order. Story 5.4
already made reprocessing safe to repeat. Today, if our order service is down for
a second, that confirmation is lost and the customer paid for nothing. The 5.7
status screen cannot be trusted until this exists.

🪄 Analogy
A courier who finds nobody home leaves a notice and comes back later, instead of
binning the parcel.

👀 Senior's eye
- `next_attempt_at` will need an index, because the retry job scans it every minute.
- Five attempts over about three hours is the ceiling; a longer outage still ends
  in the dead-letter pile.

➡️ Next step: the job that reads `next_attempt_at <= now()`.

Want me to explain webhook, idempotency or dead letter, or shall we continue?
```

Note what is *not* there: no lecture on what a migration is, no wall of inline definitions, no chain of story numbers. One story back, one story forward, and an offer at the end. Say "continue" and you get nothing more; name a term and it gets explained against your actual code.

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

## Four levels

| You type | You get |
|---|---|
| `/dumb` | one short block: what, why, analogy, a senior's eye, next step. Then one line offering to explain a term or move on (~150 words) |
| `/dumb zero` | a short, jargon-free explanation, then it stops and asks: which of these terms shall I explain, and one question to check you followed. Answer and it keeps going at your pace (~120 words to start) |
| `/dumb senior` | no analogy, no questions: the why, the trade-offs being weighed, the next step (~120 words) |
| `/dumb terms` | just the vocabulary: 3 to 8 terms from this step, each with a concrete example from your task |

Aliases: `eli5`, `beginner` and `junior` for `zero`; `pro` and `expert` for `senior`; `termos`, `jargon` and `glossary` for `terms`.

With no level given it reads your message. Use the step's terms correctly, or ask a sharp trade-off question, and you get the `senior` answer with no hand-holding. Say "I'm lost" and you get `dev`. It will not offer to define a word you just used correctly.

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
