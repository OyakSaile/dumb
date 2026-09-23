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
