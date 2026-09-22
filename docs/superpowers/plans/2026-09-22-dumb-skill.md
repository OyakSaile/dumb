# `dumb` skill + `total-dumb` installer — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship an Agent Skill named `dumb` that explains, on demand, what the agent is doing right now and why (with an analogy), plus a zero-dependency `npx total-dumb` installer for Claude Code, Cursor, Codex and OpenCode.

**Architecture:** The skill is a standard `skills/dumb/SKILL.md` (+ two reference files) that every target agent already understands. The installer is a small ESM Node CLI: `src/agents.mjs` (the per-agent path table), `src/install.mjs` (pure functions: detect, resolve, install, uninstall), `src/args.mjs` (flag parsing), and `bin/cli.mjs` (prompts + summary output). Tests use `node --test` against temp directories; the skill itself is tested with subagents (baseline without the skill, then with it).

**Tech Stack:** Node ≥ 18 (ESM, `node:fs/promises`, `node:readline/promises`, `node:test`), npm. No runtime dependencies.

**Spec:** `docs/superpowers/specs/2026-09-22-dumb-skill-design.md`

## Global Constraints

- Skill name is exactly `dumb`; npm package and bin are exactly `total-dumb`.
- `SKILL.md` frontmatter uses only `name` and `description`; description starts with "Use when", is third person, describes triggering conditions only (no workflow summary), ≤ 1024 chars.
- Zero runtime dependencies. `"engines": { "node": ">=18" }`. ESM (`"type": "module"`, `.mjs` files).
- Agent paths (project scope / global scope):
  - Claude Code: `.claude/skills/dumb` / `$CLAUDE_CONFIG_DIR/skills/dumb` or `~/.claude/skills/dumb`
  - Cursor: `.agents/skills/dumb` / `~/.cursor/skills/dumb`
  - Codex: `.agents/skills/dumb` / `$CODEX_HOME/skills/dumb` or `~/.codex/skills/dumb`
  - OpenCode: `.agents/skills/dumb` / `$XDG_CONFIG_HOME/opencode/skills/dumb` or `~/.config/opencode/skills/dumb`
- Detection: an agent is "detected" when its config dir exists (`~/.claude`, `~/.cursor`, `~/.codex`, `~/.config/opencode`, honoring the env overrides above).
- Install = recursive copy of `skills/dumb/` to `<target>/dumb/`, removing the old copy first (idempotent, reports `installed` vs `updated`). Uninstall removes `<target>/dumb/` only.
- Statuses: `installed | updated | removed | skipped | failed`. Exit 1 if any target `failed`, if no agents could be chosen, or on unknown flags.
- Skill output levels: `dev` (default), `zero` (aliases `eli5`, `beginner`), `terms` (aliases `termos`, `jargon`, `glossary`). Output in the user's language. Ends with `➡️ Próximo passo`.
- Commits end with `Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>`.

---

## File structure

| File | Responsibility |
|---|---|
| `package.json` | name `total-dumb`, bin, `files` whitelist, engines, test script |
| `LICENSE`, `.gitignore` | MIT; ignore `node_modules`, `*.tgz`, `.DS_Store` |
| `skills/dumb/SKILL.md` | the skill: when it applies, the 4 steps, the default template, BMAD rule, honesty rule, common mistakes |
| `skills/dumb/references/levels.md` | full template per level + one worked example |
| `skills/dumb/references/context.md` | where to find the bigger picture and what to extract from each source |
| `src/agents.mjs` | `SKILL_NAME`, `AGENTS` table, `AGENT_IDS`, `globalSkillsDir()` |
| `src/install.mjs` | `SKILL_SOURCE`, `normalizeAgents`, `detectAgents`, `resolveTargets`, `install`, `uninstall` |
| `src/args.mjs` | `USAGE`, `parseArgs(argv)` |
| `bin/cli.mjs` | entry point: parse → detect → prompt → resolve → install/uninstall → summary → exit code |
| `test/skill.test.mjs` | frontmatter and reference-file sanity |
| `test/install.test.mjs` | agents table, resolve, detect, install, uninstall |
| `test/cli.test.mjs` | `parseArgs` + end-to-end via `child_process` with a temp `HOME` |
| `README.md` | usage, levels, flags, agent paths, short Portuguese section |

---

### Task 1: The skill (`skills/dumb/`) — RED / GREEN / REFACTOR with subagents, plus package scaffold

**REQUIRED SUB-SKILL:** superpowers:writing-skills (the skill is written test-first: baseline subagent run without the skill, then with it).

**Files:**
- Create: `package.json`, `LICENSE`, `.gitignore`
- Create: `skills/dumb/SKILL.md`, `skills/dumb/references/levels.md`, `skills/dumb/references/context.md`
- Create: `test/skill.test.mjs`
- Scratch (not committed): a fixture repo under the session scratchpad, e.g. `<scratchpad>/fixture-bmad/`

**Interfaces:**
- Produces: `skills/dumb/` — the directory later tasks copy (`SKILL_SOURCE` in Task 3 points at it). Files inside: `SKILL.md`, `references/levels.md`, `references/context.md`.

- [ ] **Step 1: Scaffold the package**

`package.json`:

```json
{
  "name": "total-dumb",
  "version": "0.1.0",
  "description": "Agent skill that explains what your AI is doing right now and why, with an analogy. One npx install for Claude Code, Cursor, Codex and OpenCode.",
  "type": "module",
  "bin": { "total-dumb": "bin/cli.mjs" },
  "files": ["bin", "src", "skills", "README.md"],
  "engines": { "node": ">=18" },
  "scripts": { "test": "node --test test/" },
  "keywords": ["agent-skills", "skill", "claude-code", "cursor", "codex", "opencode", "bmad", "mentor", "learn"],
  "author": "Kayo Elias",
  "license": "MIT"
}
```

`.gitignore`:

```
node_modules/
*.tgz
.DS_Store
```

`LICENSE`: standard MIT text with `Copyright (c) 2026 Kayo Elias`.

- [ ] **Step 2: Build the fixture repo (RED setup)**

Create `<scratchpad>/fixture-bmad/` with these files (content is what a BMAD project looks like mid-epic):

`docs/prd.md`:
```markdown
# Mercadinho — PRD
Objetivo: vender no app com pagamento Pix, sem caixa manual.
Épicos: 1 Catálogo · 2 Carrinho · 3 Usuários · 4 Pedidos · 5 Pagamentos · 6 Notificações
```

`docs/epics/epic-5-pagamentos.md`:
```markdown
# Épico 5 — Pagamentos
Meta: um Pix confirmado no PSP vira um pedido pago no sistema, sempre, mesmo com falhas.
Stories:
- 5.1 Modelo Payment
- 5.2 Integração PSP (sandbox)
- 5.3 Webhook de confirmação
- 5.4 Idempotência do webhook
- 5.5 Estados do pedido (pending → paid → fulfilled)
- 5.6 Retry com backoff para webhooks que falharam (depende de 5.3, 5.4; bloqueia 5.7)
- 5.7 Tela de status do pagamento (depende de 5.6)
- 5.8 Reconciliação diária com o PSP
```

`docs/stories/5.6.story.md`:
```markdown
# Story 5.6 — Retry com backoff para entrega de webhook
Status: In Progress
Como sistema, quero reprocessar webhooks de pagamento que falharam usando backoff exponencial,
para que um Pix confirmado nunca se perca quando o processador de pedidos estiver fora do ar.
Depende de: 5.3, 5.4. Bloqueia: 5.7.
## Acceptance criteria
1. Webhook que falha é gravado em `webhook_retries` com `payload`, `attempts`, `next_attempt_at`.
2. Backoff: 1m, 5m, 25m, 2h; máximo 5 tentativas.
3. Após 5 falhas: `status = dead_letter` e log de erro.
4. Reprocessar é idempotente (reusa a chave de 5.4).
## Tasks
- [x] Migration `webhook_retries`
- [ ] Job que lê `next_attempt_at <= now()` a cada minuto
- [ ] Dead-letter + log
```

`src/payments/webhook.ts`:
```ts
export async function handlePaymentWebhook(payload: unknown) {
  // TODO: enqueue into webhook_retries on failure (story 5.6)
  await processOrder(payload);
}
async function processOrder(_p: unknown) {}
```

`migrations/20260922_webhook_retries.sql`:
```sql
create table webhook_retries (
  id bigserial primary key,
  payload jsonb not null,
  attempts int not null default 0,
  next_attempt_at timestamptz not null,
  status text not null default 'pending'
);
```

- [ ] **Step 3: Run the baseline WITHOUT the skill (RED)**

Dispatch 3 fresh `general-purpose` subagents (model `sonnet`), one at a time, with this prompt (replace `<FIXTURE>`):

```
You are the coding assistant inside the repository at <FIXTURE>. You are working
through BMAD story 5.6 with the developer and you have just written the migration
migrations/20260922_webhook_retries.sql. The developer now says:

"para, não entendi. por que a gente tá fazendo essa story 5.6? explica"

Respond to the developer exactly as you would in the session. Do not modify files.
```

For each run, record verbatim in `<scratchpad>/baseline.md`: whether it read `docs/stories/5.6.story.md` or the epic; whether it named the epic, the 5.3/5.4 dependencies and that 5.7 is blocked; whether it gave an analogy; whether it gave senior pitfalls; whether it asked a reflection question; whether it said where the task resumes; language; word count; whether it started doing more work.

Expected failure shapes (this is the "test fails" observation): generic explanation of retries/backoff without the epic/dependency chain, no analogy or a decorative one, no next-step line, sometimes English, sometimes continues implementing.

- [ ] **Step 4: Write the skill (GREEN) — addressing the recorded failures**

`skills/dumb/SKILL.md`:

````markdown
---
name: dumb
description: Use when the user invokes /dumb or, in the middle of any task (a BMAD story, a refactor, a bug fix, a migration, a config change), asks why the current step exists or what it is for — "why are we doing this?", "what is this for?", "I don't get it", "explain this step", "não entendi", "por que isso?", "explica". Optional level after the name — dev (default), zero, terms.
---

# dumb — explain the current step and its why

## Overview

The user is watching work happen and wants to understand it, not just get it done. Reply with a short explanation of what is being done right now and why it matters in the bigger picture, in the user's language, then say where the task resumes.

Core principle: **specific beats correct-but-generic.** Every sentence names something real from this task (the story, the file, the table, the command). "What a migration is" fails; "why this migration must land before story 5.7" passes.

## Steps

1. **Pick the level.** The first word after `dumb` in the invocation, else a cue in the message, else `dev`.

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
   Nothing found? Say so in one line and reason from the code.

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

Length: about 150 words. Cut, do not compress.

## When the task is a BMAD story, the "why" slot states

- which epic the story belongs to and what the epic delivers;
- which earlier stories it builds on;
- which later stories are blocked by it;
- the acceptance criterion that carries the motivation.

## Honesty

If the motivation is weak, unclear, or the step looks unnecessary, the "why" slot says so. Learning to judge work is part of becoming a better developer.

## Common mistakes

| Mistake | Fix |
|---|---|
| Generic lecture ("migrations let you evolve the schema") | Name the table, the story, the story that depends on it |
| Analogy that decorates instead of maps | Each part of the analogy = one part of the step; if it does not map, choose another |
| Answering from the conversation alone when `docs/stories/` or a PRD exists | Read the story + its epic first |
| Replying in English to a user who writes Portuguese | Reply in the user's language, headers included |
| Continuing to implement inside the explanation | The explanation ends at `➡️ Próximo passo`; work resumes after it |
| 400 words | Cut to ~150 for `dev`, ~200 for `zero` |
````

`skills/dumb/references/levels.md`:

````markdown
# Levels — templates and a worked example

Headers below are in Portuguese as an example; render them in the user's language.

## `dev` (default) — about 150 words

```
🧠 O que estamos fazendo
<1–2 sentences naming the story / file / function / command>

🎯 Por quê (o quadro maior)
<goal served · where it sits (epic, roadmap, dependency chain) ·
 what breaks without it · why now>

🪄 Analogia
<one real-world analogy, parts mapped 1:1>

👀 Olho de sênior
<1–2 trade-offs or pitfalls right here>

🤔 Pra pensar
<one check-your-understanding question; omit if forced>

➡️ Próximo passo: <one line>
```

## `zero` — about 200 words, the analogy carries the explanation

```
🪄 Analogia
<the real-world analogy first; the rest of the answer refers back to it>

🧠 O que estamos fazendo
<the step, told through the analogy; every technical word appears as
 "term (plain-words meaning)" the first time>

🎯 Por quê
<what goes wrong without it, in the analogy's terms, then in the project's terms>

🤔 Pra pensar
<one question answerable from the analogy>

➡️ Próximo passo: <one line>
```

No `👀 Olho de sênior` section at this level.

## `terms` — 3 to 8 items, no analogy

```
📚 Termos deste passo
- **<term>** — <one-sentence meaning>. Aqui: <one concrete example from this task>.
- ...

➡️ Próximo passo: <one line>
```

## Worked example (`dev`, Portuguese user, BMAD story)

Situation: story 5.6 "Retry com backoff para entrega de webhook", the migration `webhook_retries` was just written, user asks "por que a gente tá fazendo essa story?".

```
🧠 O que estamos fazendo
Criamos a migration `webhook_retries` da story 5.6: uma tabela que guarda cada webhook de pagamento que falhou e quando tentar de novo.

🎯 Por quê (o quadro maior)
5.6 é do Épico 5 (Pagamentos), cuja meta é "um Pix confirmado vira pedido pago, sempre". 5.3 (webhook) e 5.4 (idempotência) garantem que a confirmação chega e não é processada duas vezes, mas nada garante que ela chega se o processador de pedidos estiver fora naquele segundo. Sem retry, um pagamento real some. 5.7 (tela de status) está bloqueada por isso: não dá pra mostrar "pago" se a confirmação pode se perder. O AC 2 define o formato: 1m → 5m → 25m → 2h, 5 tentativas.

🪄 Analogia
Carteiro com encomenda registrada: se ninguém atende, ele não joga fora; deixa aviso e volta em intervalos cada vez maiores. Depois de 5 tentativas a encomenda vai pra agência (dead letter) e alguém precisa buscar.

👀 Olho de sênior
- `next_attempt_at` precisa de índice: o job vai perguntar "o que já venceu?" a cada minuto.
- Retry sem a idempotência de 5.4 = pagamento duplicado; o reprocessamento tem que passar pelo mesmo caminho.

🤔 Pra pensar
Por que intervalos crescentes em vez de tentar a cada minuto?

➡️ Próximo passo: o job que lê `next_attempt_at <= now()`.
```
````

`skills/dumb/references/context.md`:

````markdown
# Where the bigger picture lives

Read at most 3 files. Stop when every template slot can be filled with something specific.

## Sources and what to extract

| Source | Extract |
|---|---|
| The conversation | the task in flight; the file / command just touched; what the user already knows |
| BMAD story file (`docs/stories/<n>.<m>.story.md`, `docs/stories/*<n>.<m>*`) | the "so that" clause; `Depende de` / `Bloqueia` (or `depends on` / `blocks`); the acceptance criterion behind the current task; which task is checked and which is next |
| BMAD epic (`docs/epics/epic-<n>*.md`, `docs/epic-<n>*.md`, `docs/prd*.md` section) | the epic's goal in one sentence; the story list and its order (what comes before and after) |
| PRD (`docs/prd*.md`) | the product goal the epic serves |
| README | what the project is, in one sentence |
| `docs/adr/*` | the decision and the reason that constrains this step |
| ROADMAP / PLAN / TODO files | where this item sits in the sequence |
| `AGENTS.md`, `.claude/`, `CLAUDE.md` | project conventions the step follows |
| The code | who calls the thing being changed; what breaks if it is wrong |

## Layouts

**BMAD** (`docs/stories/` exists): story file → its epic → PRD. That order fills the dependency chain first.

**Generic**: README → `docs/` (ROADMAP, ADRs, PLAN) → the code around the change.

**Nothing found**: say "não achei docs de planejamento; explicando pelo código" (in the user's language) and derive the why from callers, tests, and the commit history (`git log --oneline -10 -- <path>`).
````

- [ ] **Step 5: Run the same scenario WITH the skill (GREEN check)**

Dispatch 3 fresh `general-purpose` subagents (model `sonnet`) with the baseline prompt plus this line at the top:

```
The user has installed a skill. Before answering, read <REPO>/skills/dumb/SKILL.md
and follow it (the user typed "/dumb" implicitly by asking why).
```

Also run once each:
- level `zero`: developer says `"/dumb zero — o que é isso que a gente tá fazendo?"`
- level `terms`: developer says `"/dumb terms"`
- no-docs repo: copy the fixture to `<scratchpad>/fixture-nodocs/` without `docs/`; developer says `"por que essa tabela webhook_retries?"`. Expected: one line saying no planning docs were found, then reasons from `webhook.ts` and the migration.

Score every run manually against: names the epic and 5.3/5.4/5.7 (dev, zero); analogy that maps; senior section present only for `dev`; reflection question; `➡️ Próximo passo` line; Portuguese; ≈150 words for dev / ≈200 for zero / ≤8 items for terms; no implementation work inside the answer. Record in `<scratchpad>/with-skill.md`.

- [ ] **Step 6: REFACTOR — close the gaps found in Step 5**

For every failed criterion, change the form, not the volume: a missing element becomes a required slot in the template; wrong shape becomes a tighter recipe; a rule skipped under pressure gets a row in Common mistakes. Re-run the failing scenario until 3 consecutive `dev` runs pass. Do not add content for hypothetical cases that never failed.

- [ ] **Step 7: Write the sanity test**

`test/skill.test.mjs`:

```js
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join } from "node:path";

const dir = new URL("../skills/dumb/", import.meta.url).pathname;

function frontmatter(md) {
  const match = md.match(/^---\n([\s\S]*?)\n---\n/);
  assert.ok(match, "SKILL.md must start with a --- frontmatter block");
  const fields = {};
  for (const line of match[1].split("\n")) {
    const [key, ...rest] = line.split(":");
    fields[key.trim()] = rest.join(":").trim();
  }
  return fields;
}

test("SKILL.md frontmatter follows the Agent Skills spec", async () => {
  const md = await readFile(join(dir, "SKILL.md"), "utf8");
  const fm = frontmatter(md);
  assert.equal(fm.name, "dumb");
  assert.ok(fm.description.startsWith("Use when"), "description starts with 'Use when'");
  assert.ok(fm.description.length <= 1024, "description ≤ 1024 chars");
  assert.deepEqual(Object.keys(fm).sort(), ["description", "name"]);
});

test("SKILL.md references files that exist and stays short", async () => {
  const md = await readFile(join(dir, "SKILL.md"), "utf8");
  for (const ref of ["references/levels.md", "references/context.md"]) {
    assert.ok(md.includes(ref), `SKILL.md links ${ref}`);
    assert.ok(existsSync(join(dir, ref)), `${ref} exists`);
  }
  assert.ok(md.split("\n").length < 150, "SKILL.md under 150 lines");
});
```

- [ ] **Step 8: Run the sanity test**

Run: `node --test test/skill.test.mjs`
Expected: 2 passing.

- [ ] **Step 9: Commit**

```bash
git add package.json LICENSE .gitignore skills test/skill.test.mjs
git commit -m "feat: add the dumb skill (dev, zero, terms levels) and package scaffold

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 2: Agent table and target resolution (`src/agents.mjs`, resolve/detect/normalize in `src/install.mjs`)

**Files:**
- Create: `src/agents.mjs`
- Create: `src/install.mjs` (only `normalizeAgents`, `detectAgents`, `resolveTargets` in this task)
- Test: `test/install.test.mjs`

**Interfaces:**
- Produces `src/agents.mjs`: `SKILL_NAME = "dumb"`, `AGENTS: Record<id, { displayName, aliases: string[], projectDir: string, configDir(env, home): string }>`, `AGENT_IDS = ["claude","cursor","codex","opencode"]`, `globalSkillsDir(id, env, home): string`.
- Produces `src/install.mjs`: `normalizeAgents(names: string[]): id[]` (throws on unknown), `detectAgents({ env?, home? }): id[]`, `resolveTargets({ agents: id[], scope: "global"|"project", env?, home?, cwd? }): Array<{ path: string, agents: id[] }>` where `path` is the final `.../skills/dumb` directory and entries are deduplicated by path in `AGENT_IDS` order.

- [ ] **Step 1: Write the failing tests**

`test/install.test.mjs`:

```js
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { detectAgents, normalizeAgents, resolveTargets } from "../src/install.mjs";

const ALL = ["claude", "cursor", "codex", "opencode"];
const tmp = () => mkdtemp(join(tmpdir(), "total-dumb-"));

test("resolveTargets global: four distinct dirs under home; env overrides respected", async () => {
  const home = await tmp();
  const targets = resolveTargets({ agents: ALL, scope: "global", env: {}, home, cwd: home });
  assert.deepEqual(targets.map((t) => t.path), [
    join(home, ".claude/skills/dumb"),
    join(home, ".cursor/skills/dumb"),
    join(home, ".codex/skills/dumb"),
    join(home, ".config/opencode/skills/dumb"),
  ]);
  const env = { CLAUDE_CONFIG_DIR: "/x/claude", CODEX_HOME: "/x/codex", XDG_CONFIG_HOME: "/x/cfg" };
  const overridden = resolveTargets({ agents: ALL, scope: "global", env, home, cwd: home });
  assert.deepEqual(overridden.map((t) => t.path), [
    "/x/claude/skills/dumb",
    join(home, ".cursor/skills/dumb"),
    "/x/codex/skills/dumb",
    "/x/cfg/opencode/skills/dumb",
  ]);
});

test("resolveTargets project: two dirs cover four agents", async () => {
  const cwd = await tmp();
  const targets = resolveTargets({ agents: ALL, scope: "project", env: {}, home: cwd, cwd });
  assert.deepEqual(targets, [
    { path: join(cwd, ".claude/skills/dumb"), agents: ["claude"] },
    { path: join(cwd, ".agents/skills/dumb"), agents: ["cursor", "codex", "opencode"] },
  ]);
});

test("normalizeAgents: aliases, all, stable order, unknown throws", () => {
  assert.deepEqual(normalizeAgents(["codex", "claude-code"]), ["claude", "codex"]);
  assert.deepEqual(normalizeAgents(["all"]), ALL);
  assert.deepEqual(normalizeAgents([" Cursor ", ""]), ["cursor"]);
  assert.throws(() => normalizeAgents(["copilot"]), /Unknown agent "copilot"/);
});

test("detectAgents: only agents whose config dir exists", async () => {
  const home = await tmp();
  await mkdir(join(home, ".claude"), { recursive: true });
  await mkdir(join(home, ".config/opencode"), { recursive: true });
  assert.deepEqual(detectAgents({ env: {}, home }), ["claude", "opencode"]);
  const env = { CODEX_HOME: join(home, "custom-codex") };
  await mkdir(env.CODEX_HOME, { recursive: true });
  assert.deepEqual(detectAgents({ env, home }), ["claude", "codex", "opencode"]);
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `node --test test/install.test.mjs`
Expected: FAIL — `Cannot find module '../src/install.mjs'`.

- [ ] **Step 3: Implement `src/agents.mjs`**

```js
import { join } from "node:path";

export const SKILL_NAME = "dumb";

// Where each agent looks for skills (verified against the `skills` CLI v1.7.0 registry).
// Global scope is <configDir>/skills for all four; project scope is relative to the repo root.
export const AGENTS = {
  claude: {
    displayName: "Claude Code",
    aliases: ["claude-code"],
    projectDir: ".claude/skills",
    configDir: (env, home) => env.CLAUDE_CONFIG_DIR?.trim() || join(home, ".claude"),
  },
  cursor: {
    displayName: "Cursor",
    aliases: [],
    projectDir: ".agents/skills",
    configDir: (_env, home) => join(home, ".cursor"),
  },
  codex: {
    displayName: "Codex",
    aliases: [],
    projectDir: ".agents/skills",
    configDir: (env, home) => env.CODEX_HOME?.trim() || join(home, ".codex"),
  },
  opencode: {
    displayName: "OpenCode",
    aliases: [],
    projectDir: ".agents/skills",
    configDir: (env, home) => join(env.XDG_CONFIG_HOME?.trim() || join(home, ".config"), "opencode"),
  },
};

export const AGENT_IDS = Object.keys(AGENTS);

export function globalSkillsDir(id, env, home) {
  return join(AGENTS[id].configDir(env, home), "skills");
}
```

- [ ] **Step 4: Implement the three functions in `src/install.mjs`**

```js
import { existsSync } from "node:fs";
import { homedir } from "node:os";
import { join, resolve } from "node:path";
import { AGENTS, AGENT_IDS, SKILL_NAME, globalSkillsDir } from "./agents.mjs";

/** ["codex", "claude-code", "all"] → ["claude", "cursor", ...] in AGENT_IDS order. Throws on unknown names. */
export function normalizeAgents(names) {
  const picked = new Set();
  for (const raw of names) {
    const name = raw.trim().toLowerCase();
    if (!name) continue;
    if (name === "all") {
      AGENT_IDS.forEach((id) => picked.add(id));
      continue;
    }
    const id = AGENT_IDS.find((id) => id === name || AGENTS[id].aliases.includes(name));
    if (!id) throw new Error(`Unknown agent "${raw}". Known: ${AGENT_IDS.join(", ")}, all`);
    picked.add(id);
  }
  return AGENT_IDS.filter((id) => picked.has(id));
}

/** Agents whose config directory exists on this machine. */
export function detectAgents({ env = process.env, home = homedir() } = {}) {
  return AGENT_IDS.filter((id) => existsSync(AGENTS[id].configDir(env, home)));
}

/** One entry per distinct destination directory (Cursor, Codex and OpenCode share .agents/skills in a repo). */
export function resolveTargets({ agents, scope, env = process.env, home = homedir(), cwd = process.cwd() }) {
  const byPath = new Map();
  for (const id of agents) {
    const base = scope === "project" ? resolve(cwd, AGENTS[id].projectDir) : globalSkillsDir(id, env, home);
    const path = join(base, SKILL_NAME);
    if (!byPath.has(path)) byPath.set(path, { path, agents: [] });
    byPath.get(path).agents.push(id);
  }
  return [...byPath.values()];
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `node --test test/install.test.mjs`
Expected: 4 passing.

- [ ] **Step 6: Commit**

```bash
git add src/agents.mjs src/install.mjs test/install.test.mjs
git commit -m "feat: agent path table, detection and target resolution

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 3: `install` and `uninstall` (`src/install.mjs`)

**Files:**
- Modify: `src/install.mjs` (add `SKILL_SOURCE`, `install`, `uninstall`)
- Test: `test/install.test.mjs` (append)

**Interfaces:**
- Consumes: `resolveTargets` output shape `{ path, agents }` from Task 2; `skills/dumb/` from Task 1.
- Produces: `SKILL_SOURCE: string` (absolute path to `skills/dumb` inside the package), `install(targets, { source?, dryRun? }): Promise<Array<{ path, agents, status: "installed"|"updated"|"failed", error? }>>`, `uninstall(targets, { dryRun? }): Promise<Array<{ path, agents, status: "removed"|"skipped"|"failed", error? }>>`.

- [ ] **Step 1: Append the failing tests to `test/install.test.mjs`**

Add to the imports: `import { existsSync } from "node:fs";`, `import { writeFile } from "node:fs/promises";` and extend the `../src/install.mjs` import with `install, uninstall, SKILL_SOURCE`. Then append:

```js
test("SKILL_SOURCE points at the packaged skill", () => {
  assert.ok(SKILL_SOURCE.endsWith(join("skills", "dumb")));
  assert.ok(existsSync(join(SKILL_SOURCE, "SKILL.md")));
});

test("install copies the skill; second run reports updated and drops stale files", async () => {
  const home = await tmp();
  const targets = resolveTargets({ agents: ["claude"], scope: "global", env: {}, home, cwd: home });
  const first = await install(targets);
  assert.equal(first[0].status, "installed");
  const dest = targets[0].path;
  assert.ok(existsSync(join(dest, "SKILL.md")));
  assert.ok(existsSync(join(dest, "references", "levels.md")));
  assert.ok(existsSync(join(dest, "references", "context.md")));

  await writeFile(join(dest, "stale.md"), "old");
  const second = await install(targets);
  assert.equal(second[0].status, "updated");
  assert.ok(!existsSync(join(dest, "stale.md")));
});

test("install dryRun writes nothing but reports the status it would have", async () => {
  const home = await tmp();
  const targets = resolveTargets({ agents: ["cursor"], scope: "global", env: {}, home, cwd: home });
  const result = await install(targets, { dryRun: true });
  assert.equal(result[0].status, "installed");
  assert.ok(!existsSync(targets[0].path));
});

test("install with a missing source rejects clearly", async () => {
  await assert.rejects(install([], { source: "/definitely/not/here" }), /Skill files missing/);
});

test("uninstall removes dumb/ only, leaves siblings, skips when absent", async () => {
  const home = await tmp();
  const targets = resolveTargets({ agents: ["claude"], scope: "global", env: {}, home, cwd: home });
  await install(targets);
  await mkdir(join(home, ".claude/skills/other-skill"), { recursive: true });

  const removed = await uninstall(targets);
  assert.equal(removed[0].status, "removed");
  assert.ok(!existsSync(targets[0].path));
  assert.ok(existsSync(join(home, ".claude/skills/other-skill")));

  const again = await uninstall(targets);
  assert.equal(again[0].status, "skipped");
});
```

- [ ] **Step 2: Run tests to verify the new ones fail**

Run: `node --test test/install.test.mjs`
Expected: 4 passing, 5 failing (`install is not a function`, etc.).

- [ ] **Step 3: Implement**

Add to the imports in `src/install.mjs`: `import { cp, mkdir, rm } from "node:fs/promises";`, `import { dirname } from "node:path";` (merge with the existing path import), `import { fileURLToPath } from "node:url";`. Then append:

```js
export const SKILL_SOURCE = resolve(dirname(fileURLToPath(import.meta.url)), "..", "skills", SKILL_NAME);

/** Copy the skill into each target. Existing copies are replaced (status "updated"). */
export async function install(targets, { source = SKILL_SOURCE, dryRun = false } = {}) {
  if (!existsSync(join(source, "SKILL.md"))) {
    throw new Error(`Skill files missing at ${source} (broken package?)`);
  }
  const results = [];
  for (const target of targets) {
    const status = existsSync(target.path) ? "updated" : "installed";
    try {
      if (!dryRun) {
        await mkdir(dirname(target.path), { recursive: true });
        await rm(target.path, { recursive: true, force: true });
        await cp(source, target.path, { recursive: true });
      }
      results.push({ ...target, status });
    } catch (error) {
      results.push({ ...target, status: "failed", error: error.message });
    }
  }
  return results;
}

/** Remove the skill directory from each target; never touches the parent. */
export async function uninstall(targets, { dryRun = false } = {}) {
  const results = [];
  for (const target of targets) {
    if (!existsSync(target.path)) {
      results.push({ ...target, status: "skipped" });
      continue;
    }
    try {
      if (!dryRun) await rm(target.path, { recursive: true, force: true });
      results.push({ ...target, status: "removed" });
    } catch (error) {
      results.push({ ...target, status: "failed", error: error.message });
    }
  }
  return results;
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `node --test test/install.test.mjs`
Expected: 9 passing.

- [ ] **Step 5: Commit**

```bash
git add src/install.mjs test/install.test.mjs
git commit -m "feat: install and uninstall the skill into resolved targets

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 4: Flag parsing and the CLI (`src/args.mjs`, `bin/cli.mjs`)

**Files:**
- Create: `src/args.mjs`, `bin/cli.mjs`
- Test: `test/cli.test.mjs`

**Interfaces:**
- Consumes: everything exported by `src/agents.mjs` and `src/install.mjs` (Tasks 2–3).
- Produces: `parseArgs(argv: string[]): { help, version, yes, scope: "global"|"project"|null, agents: string[]|null, uninstall, dryRun }` (throws `Error` on unknown option or missing `--agents` value); `USAGE: string`; executable `bin/cli.mjs`.

- [ ] **Step 1: Write the failing tests**

`test/cli.test.mjs`:

```js
import { test } from "node:test";
import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { mkdtemp } from "node:fs/promises";
import { existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { parseArgs } from "../src/args.mjs";

const run = promisify(execFile);
const CLI = new URL("../bin/cli.mjs", import.meta.url).pathname;
const tmp = () => mkdtemp(join(tmpdir(), "total-dumb-cli-"));

// A clean env: fake HOME, no agent overrides leaking from the developer's shell.
function envFor(home) {
  const { CLAUDE_CONFIG_DIR, CODEX_HOME, XDG_CONFIG_HOME, ...rest } = process.env;
  return { ...rest, HOME: home, USERPROFILE: home };
}

async function cli(args, { home, cwd = home } = {}) {
  try {
    const { stdout, stderr } = await run("node", [CLI, ...args], { cwd, env: envFor(home) });
    return { code: 0, stdout, stderr };
  } catch (error) {
    return { code: error.code, stdout: error.stdout, stderr: error.stderr };
  }
}

test("parseArgs: flags, aliases, --agents forms", () => {
  assert.deepEqual(parseArgs([]), { help: false, version: false, yes: false, scope: null, agents: null, uninstall: false, dryRun: false });
  assert.equal(parseArgs(["-g"]).scope, "global");
  assert.equal(parseArgs(["--project"]).scope, "project");
  assert.deepEqual(parseArgs(["--agents", "claude,codex"]).agents, ["claude", "codex"]);
  assert.deepEqual(parseArgs(["--agents=cursor"]).agents, ["cursor"]);
  assert.equal(parseArgs(["-y", "--uninstall", "--dry-run"]).dryRun, true);
  assert.throws(() => parseArgs(["--bogus"]), /Unknown option "--bogus"/);
  assert.throws(() => parseArgs(["--agents"]), /--agents needs a value/);
});

test("cli --help exits 0 with usage; unknown flag exits 1", async () => {
  const home = await tmp();
  const help = await cli(["--help"], { home });
  assert.equal(help.code, 0);
  assert.match(help.stdout, /Usage: npx total-dumb/);
  const bad = await cli(["--bogus"], { home });
  assert.equal(bad.code, 1);
  assert.match(bad.stderr, /Unknown option/);
});

test("cli --yes --global --agents claude installs into the fake home", async () => {
  const home = await tmp();
  const result = await cli(["--yes", "--global", "--agents", "claude"], { home });
  assert.equal(result.code, 0, result.stderr);
  assert.ok(existsSync(join(home, ".claude/skills/dumb/SKILL.md")));
  assert.match(result.stdout, /Claude Code/);
  assert.match(result.stdout, /installed/);
});

test("cli --project installs into the current repo and dedupes .agents/skills", async () => {
  const home = await tmp();
  const cwd = await tmp();
  const result = await cli(["-y", "-p", "--agents", "all"], { home, cwd });
  assert.equal(result.code, 0, result.stderr);
  assert.ok(existsSync(join(cwd, ".claude/skills/dumb/SKILL.md")));
  assert.ok(existsSync(join(cwd, ".agents/skills/dumb/SKILL.md")));
  assert.match(result.stdout, /Cursor, Codex, OpenCode/);
});

test("cli --dry-run writes nothing; --uninstall removes", async () => {
  const home = await tmp();
  const dry = await cli(["-y", "-g", "--agents", "codex", "--dry-run"], { home });
  assert.equal(dry.code, 0, dry.stderr);
  assert.match(dry.stdout, /dry-run/);
  assert.ok(!existsSync(join(home, ".codex/skills/dumb")));

  await cli(["-y", "-g", "--agents", "codex"], { home });
  assert.ok(existsSync(join(home, ".codex/skills/dumb/SKILL.md")));
  const gone = await cli(["-y", "-g", "--agents", "codex", "--uninstall"], { home });
  assert.equal(gone.code, 0, gone.stderr);
  assert.match(gone.stdout, /removed/);
  assert.ok(!existsSync(join(home, ".codex/skills/dumb")));
});

test("cli --yes with nothing detected and no --agents exits 1 with a hint", async () => {
  const home = await tmp();
  const result = await cli(["--yes"], { home });
  assert.equal(result.code, 1);
  assert.match(result.stderr, /--agents/);
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `node --test test/cli.test.mjs`
Expected: FAIL — `Cannot find module '../src/args.mjs'`.

- [ ] **Step 3: Implement `src/args.mjs`**

```js
export const USAGE = `Usage: npx total-dumb [options]

Installs the "dumb" agent skill: /dumb explains what we're doing and why.

Options:
  -g, --global          install for the whole machine (default)
  -p, --project         install into the current repository
  -a, --agents <list>   comma-separated: claude, cursor, codex, opencode, all
  -y, --yes             no prompts (all detected agents, global scope)
      --uninstall       remove the skill instead of installing it
      --dry-run         show what would happen, write nothing
  -h, --help            show this help
  -v, --version         show the version
`;

export function parseArgs(argv) {
  const opts = { help: false, version: false, yes: false, scope: null, agents: null, uninstall: false, dryRun: false };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    switch (arg) {
      case "-h": case "--help": opts.help = true; break;
      case "-v": case "--version": opts.version = true; break;
      case "-y": case "--yes": opts.yes = true; break;
      case "-g": case "--global": opts.scope = "global"; break;
      case "-p": case "--project": opts.scope = "project"; break;
      case "--uninstall": opts.uninstall = true; break;
      case "--dry-run": opts.dryRun = true; break;
      case "-a": case "--agents": {
        const value = argv[++i];
        if (!value || value.startsWith("-")) throw new Error("--agents needs a value, e.g. --agents claude,codex");
        opts.agents = value.split(",");
        break;
      }
      default:
        if (arg.startsWith("--agents=")) {
          opts.agents = arg.slice("--agents=".length).split(",");
          break;
        }
        throw new Error(`Unknown option "${arg}"`);
    }
  }
  return opts;
}
```

- [ ] **Step 4: Implement `bin/cli.mjs`**

```js
#!/usr/bin/env node
import { readFile } from "node:fs/promises";
import { homedir } from "node:os";
import { stdin, stdout, stderr, exit } from "node:process";
import { createInterface } from "node:readline/promises";
import { AGENTS, AGENT_IDS } from "../src/agents.mjs";
import { parseArgs, USAGE } from "../src/args.mjs";
import { detectAgents, install, normalizeAgents, resolveTargets, uninstall } from "../src/install.mjs";

const pkg = JSON.parse(await readFile(new URL("../package.json", import.meta.url), "utf8"));

let opts;
try {
  opts = parseArgs(process.argv.slice(2));
} catch (error) {
  stderr.write(`${error.message}\n\n${USAGE}`);
  exit(1);
}

if (opts.help) { stdout.write(USAGE); exit(0); }
if (opts.version) { stdout.write(`${pkg.version}\n`); exit(0); }

const detected = detectAgents();
let agents = detected;
if (opts.agents) {
  try {
    agents = normalizeAgents(opts.agents);
  } catch (error) {
    stderr.write(`${error.message}\n`);
    exit(1);
  }
}
let scope = opts.scope ?? "global";

const interactive = Boolean(stdin.isTTY) && !opts.yes;
if (interactive) {
  const rl = createInterface({ input: stdin, output: stdout });
  try {
    if (!opts.agents) agents = await askAgents(rl, detected);
    if (!opts.scope) scope = await askScope(rl);
  } finally {
    rl.close();
  }
}

if (agents.length === 0) {
  stderr.write(
    "No agents found (looked for ~/.claude, ~/.cursor, ~/.codex, ~/.config/opencode).\n" +
    "Choose explicitly: npx total-dumb --agents claude,cursor,codex,opencode\n",
  );
  exit(1);
}

const targets = resolveTargets({ agents, scope });
let results;
try {
  results = opts.uninstall
    ? await uninstall(targets, { dryRun: opts.dryRun })
    : await install(targets, { dryRun: opts.dryRun });
} catch (error) {
  stderr.write(`${error.message}\n`);
  exit(1);
}

printSummary(results);
exit(results.some((r) => r.status === "failed") ? 1 : 0);

async function askAgents(rl, detected) {
  stdout.write("\nWhich agents?\n");
  AGENT_IDS.forEach((id, i) => {
    stdout.write(`  ${i + 1}) ${AGENTS[id].displayName}${detected.includes(id) ? "  (detected)" : ""}\n`);
  });
  const fallback = detected.length ? detected : AGENT_IDS;
  const suggested = fallback.map((id) => AGENT_IDS.indexOf(id) + 1).join(",");
  const answer = await rl.question(`Numbers separated by commas [${suggested}]: `);
  const picked = answer.split(",").map((n) => AGENT_IDS[Number(n.trim()) - 1]).filter(Boolean);
  return picked.length ? AGENT_IDS.filter((id) => picked.includes(id)) : fallback;
}

async function askScope(rl) {
  const answer = await rl.question("Where? (g)lobal for this machine, (p)roject for this repo [g]: ");
  return answer.trim().toLowerCase().startsWith("p") ? "project" : "global";
}

function printSummary(results) {
  const verb = opts.uninstall ? "Removed" : "Installed";
  stdout.write(`\n${opts.dryRun ? "[dry-run] " : ""}${verb} the "dumb" skill:\n`);
  for (const r of results) {
    const names = r.agents.map((id) => AGENTS[id].displayName).join(", ");
    const icon = r.status === "failed" ? "✖" : r.status === "skipped" ? "–" : "✔";
    const where = r.path.startsWith(homedir()) ? `~${r.path.slice(homedir().length)}` : r.path;
    stdout.write(`  ${icon} ${names.padEnd(26)} ${where}  ${r.status}${r.error ? ` (${r.error})` : ""}\n`);
  }
  if (!opts.uninstall && !opts.dryRun) stdout.write("\nMid-task, type:  /dumb   /dumb zero   /dumb terms\n");
}
```

Then make it executable: `chmod +x bin/cli.mjs`.

- [ ] **Step 5: Run tests to verify they pass**

Run: `node --test test/cli.test.mjs`
Expected: 6 passing.

- [ ] **Step 6: Smoke the interactive path by hand**

Run: `HOME=$(mktemp -d) node bin/cli.mjs --dry-run` and answer the two prompts (Enter, Enter). Expected: the agent list with no "(detected)" marks, the scope prompt, then a `[dry-run] Installed` summary for all four agents (they are the fallback when none is detected). Nothing is written because of `--dry-run`.

- [ ] **Step 7: Commit**

```bash
git add src/args.mjs bin/cli.mjs test/cli.test.mjs
git commit -m "feat: npx total-dumb CLI with prompts, flags and summary

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 5: README, package verification, real install

**Files:**
- Create: `README.md`
- Verify: `package.json` `files` whitelist via `npm pack --dry-run`

**Interfaces:**
- Consumes: the CLI from Task 4 and the skill from Task 1.

- [ ] **Step 1: Write `README.md`**

````markdown
# total-dumb

**`/dumb` — explain what we're doing right now, and why.**

An [Agent Skill](https://agentskills.io) for Claude Code, Cursor, Codex and OpenCode. Mid-task — a BMAD story, a refactor, a bug fix — ask why, and get a short, grounded answer: what this step is, where it sits in the bigger picture (epic, dependencies, what breaks without it), a real-world analogy, what a senior would watch for, and where the task resumes. In your language.

## Install

```bash
npx total-dumb
```

Detects your agents, asks global or project, copies the skill. Non-interactive:

```bash
npx total-dumb -y                         # all detected agents, global
npx total-dumb --project                  # into the current repo
npx total-dumb --agents claude,codex -g   # pick agents
npx total-dumb --uninstall                # remove
npx total-dumb --dry-run                  # show, don't write
```

Also installable with the `skills` CLI: `npx skills add <your-github-user>/dumb`.

## Use

| You type | You get |
|---|---|
| `/dumb` | what · why (bigger picture) · analogy · senior's eye · one question · next step (~150 words) |
| `/dumb zero` | for someone who has never seen this: the analogy carries it, zero jargon (~200 words) |
| `/dumb terms` | the 3–8 technical terms of this step, each with an example from your task |

Natural language works too: "why are we doing this?", "não entendi", "explica".

## Where it goes

| Agent | Project (`--project`) | Global (default) |
|---|---|---|
| Claude Code | `.claude/skills/dumb` | `~/.claude/skills/dumb` |
| Cursor | `.agents/skills/dumb` | `~/.cursor/skills/dumb` |
| Codex | `.agents/skills/dumb` | `~/.codex/skills/dumb` |
| OpenCode | `.agents/skills/dumb` | `~/.config/opencode/skills/dumb` |

`CLAUDE_CONFIG_DIR`, `CODEX_HOME` and `XDG_CONFIG_HOME` are honored.

## Em português

`/dumb` explica o que a IA está fazendo agora e por quê, com analogia, no meio de qualquer tarefa (story do BMAD, refactor, bug). `/dumb zero` é pra quem nunca viu nada daquilo; `/dumb termos` lista os termos técnicos do passo. Instale com `npx total-dumb`.

## License

MIT
````

- [ ] **Step 2: Run the whole suite**

Run: `npm test`
Expected: all tests in `test/` passing (2 + 9 + 6 = 17).

- [ ] **Step 3: Verify the published package contents**

Run: `npm pack --dry-run`
Expected: the file list contains `bin/cli.mjs`, `src/agents.mjs`, `src/install.mjs`, `src/args.mjs`, `skills/dumb/SKILL.md`, `skills/dumb/references/levels.md`, `skills/dumb/references/context.md`, `README.md`, `LICENSE`, `package.json` — and nothing from `test/` or `docs/`.

- [ ] **Step 4: Run the real npx path from a tarball**

```bash
npm pack
HOME=$(mktemp -d) npx -y ./total-dumb-0.1.0.tgz -y -g --agents all --dry-run
rm total-dumb-0.1.0.tgz
```

Expected: `[dry-run] Installed the "dumb" skill:` followed by four `✔` lines.

- [ ] **Step 5: Install for real on this machine (Claude Code) so the user can try it**

Run: `node bin/cli.mjs -y -g --agents claude`
Expected: `✔ Claude Code  ~/.claude/skills/dumb  installed`. Verify with `ls ~/.claude/skills/dumb`.

- [ ] **Step 6: Commit**

```bash
git add README.md
git commit -m "docs: README with install, levels and agent paths

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

## Not in this plan (user decides later)

- `npm publish` (needs the user's npm login). Command when ready: `npm publish --access public`.
- Adding `"repository"` to `package.json` once the GitHub repo exists.
- Renaming the folder `im-dump-skill` → `dumb` (`mv` after this session).
