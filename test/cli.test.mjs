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
