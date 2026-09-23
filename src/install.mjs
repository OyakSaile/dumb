import { existsSync } from "node:fs";
import { cp, mkdir, rm } from "node:fs/promises";
import { homedir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
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
