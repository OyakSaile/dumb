#!/usr/bin/env node
import { readFile } from "node:fs/promises";
import { homedir } from "node:os";
import { sep } from "node:path";
import { stdin, stdout, stderr, exit } from "node:process";
import * as p from "@clack/prompts";
import { AGENTS, AGENT_IDS } from "../src/agents.mjs";
import { parseArgs, USAGE } from "../src/args.mjs";
import { detectAgents, install, normalizeAgents, resolveTargets, uninstall } from "../src/install.mjs";

// Abbreviates a path under the user's home directory to "~", without mangling
// paths that merely share a prefix with it (e.g. home /Users/kay, path /Users/kayoelias).
function abbreviateHome(path, home = homedir()) {
  if (path === home) return "~";
  if (path.startsWith(home + sep)) return `~${path.slice(home.length)}`;
  return path;
}

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
  p.intro(`total-dumb ${pkg.version} — /dumb explains what we're doing and why`);
  if (detected.length) {
    p.log.info(`Detected: ${detected.map((id) => AGENTS[id].displayName).join(", ")}`);
  } else {
    p.log.warn("No agents detected on this machine. Pick where to install anyway.");
  }

  if (!opts.agents) {
    const picked = await p.multiselect({
      message: "Which agents?",
      options: AGENT_IDS.map((id) => ({
        value: id,
        label: AGENTS[id].displayName,
        hint: detected.includes(id) ? "detected" : undefined,
      })),
      initialValues: detected.length ? detected : AGENT_IDS,
      required: true,
    });
    if (p.isCancel(picked)) { p.cancel("Nothing installed."); exit(0); }
    agents = AGENT_IDS.filter((id) => picked.includes(id));
  }

  if (!opts.scope) {
    const where = await p.select({
      message: opts.uninstall ? "Remove from where?" : "Where?",
      options: [
        { value: "global", label: "Global — this machine", hint: "~/.claude/skills, ~/.cursor/skills, ~/.codex/skills, ~/.config/opencode/skills" },
        { value: "project", label: "Project — this repo", hint: ".claude/skills, .agents/skills" },
      ],
    });
    if (p.isCancel(where)) { p.cancel("Nothing installed."); exit(0); }
    scope = where;
  }
}

if (agents.length === 0) {
  const looked = AGENT_IDS.map((id) => abbreviateHome(AGENTS[id].configDir(process.env, homedir()))).join(", ");
  stderr.write(
    `No agents found (looked for ${looked}).\n` +
    "Choose explicitly: npx total-dumb --agents claude,cursor,codex,opencode\n",
  );
  exit(1);
}

const targets = resolveTargets({ agents, scope });
const spinner = interactive ? p.spinner() : null;
spinner?.start(opts.uninstall ? "Removing…" : "Installing…");
let results;
try {
  results = opts.uninstall
    ? await uninstall(targets, { dryRun: opts.dryRun })
    : await install(targets, { dryRun: opts.dryRun });
} catch (error) {
  spinner?.stop("Failed", 1);
  stderr.write(`${error.message}\n`);
  exit(1);
}
spinner?.stop(opts.uninstall ? "Removed" : "Installed");

printSummary(results);
if (interactive) p.outro(results.some((r) => r.status === "failed") ? "Some targets failed." : "Done.");
exit(results.some((r) => r.status === "failed") ? 1 : 0);

function printSummary(results) {
  const verb = opts.uninstall ? "Removed" : "Installed";
  stdout.write(`\n${opts.dryRun ? "[dry-run] " : ""}${verb} the "dumb" skill:\n`);
  for (const r of results) {
    const names = r.agents.map((id) => AGENTS[id].displayName).join(", ");
    const icon = r.status === "failed" ? "✖" : r.status === "skipped" ? "–" : "✔";
    const where = abbreviateHome(r.path);
    stdout.write(`  ${icon} ${names.padEnd(26)} ${where}  ${r.status}${r.error ? ` (${r.error})` : ""}\n`);
  }
  const didWrite = results.some((r) => r.status === "installed" || r.status === "updated");
  if (!opts.uninstall && !opts.dryRun && didWrite) stdout.write("\nMid-task, type:  /dumb   /dumb zero   /dumb senior\n");
}
