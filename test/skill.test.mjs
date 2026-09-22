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
