# `dumb` — design spec

**Date:** 2026-09-22
**Status:** approved in chat, pending spec review

## 1. Goal

An on-demand agent skill called `dumb` that, when invoked mid-task, explains **what the agent is doing right now and why**, in plain language, with a real-world analogy, so the user becomes a better developer instead of just watching code appear. It must work in Claude Code, Cursor, Codex and OpenCode, and be installable with `npx total-dumb`.

Typical moment: the user is executing BMAD story 5.6 and has no idea why that story exists or where it fits. They type `/dumb` and get: what we're doing, why (epic, dependencies, what breaks without it), an analogy, what a senior would watch for, and one reflection question.

## 2. Non-goals (v1)

- Always-on mode (explaining at every step automatically). On-demand only.
- Agents beyond Claude Code, Cursor, Codex, OpenCode.
- Persisted configuration (default level, language). Level is passed per invocation; default is `dev`.
- A GitHub Action, VS Code extension, or web UI.

## 3. Naming

| Thing | Name | Note |
|---|---|---|
| Skill (folder + frontmatter `name`) | `dumb` | invoked as `/dumb` in Claude Code, `$dumb` in Codex, by name elsewhere |
| npm package + bin | `total-dumb` | `dumb` and `im-dumb` are taken on npm; `total-dumb` is free |
| Repo folder | `dumb` | current folder `im-dump-skill` is renamed by the user after this session |

## 4. The skill

### 4.1 Layout (Agent Skills standard)

```
skills/dumb/
  SKILL.md                 # frontmatter + core instructions (target < 150 lines)
  references/levels.md     # output template + example per level
  references/context.md    # where to look for the "bigger picture" (BMAD + generic repos)
```

`SKILL.md` frontmatter uses only standard fields so all four agents accept it:

```yaml
---
name: dumb
description: Use when the user invokes /dumb or, in the middle of any task (a BMAD story, a refactor, a bug fix, a migration, a config change), asks why the current step exists or what it is for — "why are we doing this?", "what is this for?", "I don't get it", "explain this step", "não entendi", "por que isso?", "explica". Optional level after the name — dev (default), zero, terms.
---
```

### 4.2 Levels

The level is the first word after the skill name (`/dumb zero`), or inferred from the user's message. Unknown or missing level means `dev`.

| Level | Aliases | Audience | Shape |
|---|---|---|---|
| `dev` (default) | — | a developer who knows the basics but not the why | 5 short sections, ~250 words |
| `zero` | `eli5`, `beginner` | someone who has never seen anything like this | analogy is the backbone, zero jargon, every technical word defined inline, ~300 words |
| `terms` | `termos`, `jargon`, `glossary` | wants the vocabulary of this step | list of 3–8 terms, each one sentence + one example from this task |

### 4.3 Output templates (rendered in the user's language)

**dev**

```
🧠 O que estamos fazendo
<1–2 sentences, concrete: name the story / file / function / step>

🎯 Por quê (o quadro maior)
<the goal this serves; where it sits (epic, roadmap, dependency chain);
 what breaks or gets harder without it; why now and not later>

🪄 Analogia
<one real-world analogy whose parts map 1:1 onto the parts of this step>

👀 Olho de sênior
<1–2 trade-offs or pitfalls a senior would watch for right here>

🤔 Pra pensar
<one question the user can answer to check they got it; omit if it would be forced>

➡️ Próximo passo: <one line: where the task resumes>
```

Each slot carries a sentence budget: 🧠 1–2 sentences · 🎯 at most 4 sentences · 🪄 2–3 sentences · 👀 2 bullets, one sentence each · 🤔 one question · ➡️ one line.

**zero** — same content, reordered: `🪄 Analogia` first (it carries the explanation), then `🧠 O que`, `🎯 Por quê`, `🤔 Pra pensar`, `➡️ Próximo passo`. No `👀 Olho de sênior`. Every technical term appears as `term (plain-words meaning)` the first time. Slot budgets at this level: 🪄 3–4 sentences · 🧠 2–3 sentences · 🎯 2–3 sentences · 🤔 one question · ➡️ one line.

**terms**

```
📚 Termos deste passo
- **<term>** — <one-sentence meaning>. Aqui: <one concrete example from this task>.
- ...

➡️ Próximo passo: <one line>
```

Section headers are translated to the user's language (the Portuguese above is the example; English users get English headers).

### 4.4 Behavioral rules

1. **Ground everything in the actual task.** Name the real story, file, function, command. A generic explanation of "what a migration is" is a failure; "why *this* migration adds `orders.status` before story 5.7 can ship the checkout" is the target.
2. **Find the bigger picture before answering.** Order of search, stop as soon as enough context is found (read at most ~3 files):
   - the conversation so far (what task is in flight);
   - BMAD layout: `docs/stories/*.md` (current story and its neighbours), `docs/prd*.md`, `docs/epics*.md` or `docs/epic-*.md`, `docs/architecture*.md`;
   - generic layout: `README*`, `docs/`, `ROADMAP*`, `docs/adr/`, `CHANGELOG*`, any `PLAN*.md` / `TODO*.md`, `.claude/`, `AGENTS.md`;
   - the code itself: what calls / depends on the thing being changed.
   If nothing is found, say so in one line and reason from the code.
3. **For BMAD stories specifically**, the "why" must state: which epic the story belongs to, which earlier stories it builds on, which later stories depend on it, and which acceptance criterion explains the motivation.
4. **Language:** reply in the language the user writes in.
5. **Length:** dev ≈ 250 words, zero ≈ 300 words, terms ≤ 8 items, with per-section sentence budgets in the templates. Prefer cutting over compressing. (Amended 2026-09-22 during implementation: nine measured `dev` runs carrying all six sections plus the epic, both upstream stories, the blocked story and an acceptance criterion landed at 246–269 words regardless of the stated target; the original 150 made the shipped example contradict the rule.)
6. **Do not redo work.** After explaining, do not re-run or re-implement anything. End with `➡️ Próximo passo` so the user knows where the task resumes. Continue the task only if it was already in progress and the user has not asked to pause.
7. **Be honest.** If the step's motivation is weak, unclear, or the step looks unnecessary, say that; it is part of learning to judge work, not a failure of the skill.
8. **No filler.** No "great question", no moralizing, no restating the user's message.

### 4.5 Triggering

The description covers the explicit invocation and natural-language cues (`why are we doing this`, `what is this for`, `I don't get it`, `explain this step`, `não entendi`, `por que isso`, `explica`). The skill does not fire on its own during normal work.

## 5. The installer (`npx total-dumb`)

### 5.1 Behaviour

```
npx total-dumb                      # interactive: detect agents → pick → global|project → install
npx total-dumb -y                   # non-interactive: all detected agents, global
npx total-dumb --project            # install into the current repo
npx total-dumb --agents claude,codex --global
npx total-dumb --uninstall [--project] [--agents ...]
npx total-dumb --dry-run            # print what would happen
npx total-dumb --help | --version
```

- Non-TTY stdin (CI, piped) behaves as `--yes`.
- `--agents` accepts `claude` / `claude-code`, `cursor`, `codex`, `opencode`, `all`.
- With `--yes` and no detected agents and no `--agents`: exit 1 with a hint to pass `--agents`.
- Installing is a recursive copy of `skills/dumb/` into `<target>/dumb/`, overwriting (idempotent; re-running updates).
- Uninstalling removes `<target>/dumb/` only, never the parent.
- Ends with a summary table: agent → path → `installed | updated | removed | skipped`, plus a one-line usage hint (`/dumb`, `/dumb zero`, `/dumb terms`).

### 5.2 Target paths

| Agent | Detected by | Project scope (cwd) | Global scope |
|---|---|---|---|
| Claude Code | `$CLAUDE_CONFIG_DIR` or `~/.claude` exists | `.claude/skills/dumb` | `$CLAUDE_CONFIG_DIR/skills/dumb` or `~/.claude/skills/dumb` |
| Cursor | `~/.cursor` exists | `.agents/skills/dumb` | `~/.cursor/skills/dumb` |
| Codex | `$CODEX_HOME` or `~/.codex` exists | `.agents/skills/dumb` | `$CODEX_HOME/skills/dumb` or `~/.codex/skills/dumb` |
| OpenCode | `$XDG_CONFIG_HOME/opencode` or `~/.config/opencode` exists | `.agents/skills/dumb` | `$XDG_CONFIG_HOME/opencode/skills/dumb` or `~/.config/opencode/skills/dumb` |

Project scope for Cursor, Codex and OpenCode resolves to the same `.agents/skills/dumb`; the installer deduplicates the copy and reports all three agents.

(Paths verified against the `skills` CLI v1.7.0 agent registry.)

### 5.3 Code layout

```
bin/cli.mjs        # arg parsing, prompts (node:readline/promises), summary output
src/install.mjs    # pure functions: detectAgents, resolveTargets, install, uninstall
src/agents.mjs     # the agent table above
skills/dumb/       # the skill (section 4)
test/              # node --test
package.json       # name total-dumb, type module, bin, files: [bin, src, skills, README.md], engines node>=18, no dependencies
README.md          # English, with a short Portuguese section
LICENSE            # MIT
```

Zero runtime dependencies. Node ≥ 18. ESM.

## 6. Error handling

- Unknown flag → usage + exit 1.
- Target parent not writable → report that agent as failed, continue with the others, exit 1 at the end.
- Uninstall of a path that does not exist → `skipped (not found)`, exit 0.
- Skill folder missing from the package (broken publish) → clear error, exit 1.

## 7. Testing

**Installer (`node --test`, temp `HOME`/cwd, no network):**
1. `resolveTargets` global for all four agents → four distinct paths under the fake home; env overrides (`CLAUDE_CONFIG_DIR`, `CODEX_HOME`, `XDG_CONFIG_HOME`) are respected.
2. `resolveTargets` project → two distinct paths (`.claude/skills/dumb`, `.agents/skills/dumb`) covering four agents.
3. `detectAgents` returns only agents whose config dir exists.
4. `install` copies `SKILL.md` and `references/` into each target; second run is idempotent and reports `updated`.
5. `uninstall` removes `dumb/` and leaves sibling skills untouched.
6. CLI end-to-end via `child_process`: `--yes --global --agents claude` installs; `--help` exits 0; unknown flag exits 1; `--dry-run` writes nothing.
7. `SKILL.md` sanity: frontmatter parses, `name === "dumb"`, description ≤ 1024 chars, both reference files exist.

**Skill (manual, per the writing-skills process):** run a subagent in a fixture repo with `docs/stories/5.6.story.md` + an epic file and check the output has the five `dev` sections, names the epic and dependent stories, contains an analogy, and is in Portuguese when the user writes Portuguese. Repeat for `zero` and `terms`, and once in a repo with no docs (must say so and reason from code).

## 8. Publishing

`npm publish` from the repo root (`files` whitelist keeps the package small). The repo layout `skills/dumb/SKILL.md` is also what `npx skills add <github-user>/dumb` expects, so that install path works for free once the repo is on GitHub.
