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
