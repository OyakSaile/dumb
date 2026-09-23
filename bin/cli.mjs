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
