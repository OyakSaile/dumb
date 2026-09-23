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
