# Where the bigger picture lives

Read at most 3 files. Stop when every template slot can be filled with something specific.

## Sources and what to extract

| Source | Extract |
|---|---|
| The conversation | the task in flight; the file / command just touched; what the user already knows |
| BMAD story file (`docs/stories/<n>.<m>.story.md`, `docs/stories/*<n>.<m>*`) | the "so that" clause; `Depende de` / `Bloqueia` (or `depends on` / `blocks`); the acceptance criterion behind the current task; which task is checked and which is next |
| BMAD epic (`docs/epics/epic-<n>*.md`, `docs/epic-<n>*.md`, `docs/prd*.md` section) | the epic's goal in one sentence; the story list and its order (what comes before and after) |
| PRD (`docs/prd*.md`) | the product goal the epic serves |
| Architecture doc (`docs/architecture*.md`) | the technical design or constraint this step has to respect |
| README | what the project is, in one sentence |
| `docs/adr/*` | the decision and the reason that constrains this step |
| ROADMAP / PLAN / TODO / `CHANGELOG*` files | where this item sits in the sequence |
| `AGENTS.md`, `.claude/`, `CLAUDE.md` | project conventions the step follows |
| The code | who calls the thing being changed; what breaks if it is wrong |

## Layouts

**BMAD** (`docs/stories/` exists): story file → its epic → PRD → architecture doc. That order fills the dependency chain first.

**Generic**: README → `docs/` (ROADMAP, ADRs, PLAN, CHANGELOG) → the code around the change.

**Nothing found**: say "No planning docs found; explaining from the code" (in the user's language) and derive the why from callers, tests, and the commit history (`git log --oneline -10 -- <path>`).
