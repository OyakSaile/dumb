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
