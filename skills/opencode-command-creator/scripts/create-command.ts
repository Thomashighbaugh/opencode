/**
 * Create OpenCode custom command files (markdown or JSON config).
 *
 * Replaces create-command.py. Run with pnpm's TypeScript runner:
 *   pnpx tsx create-command.ts <command-name> [options]
 *
 * Examples:
 *   pnpx tsx create-command.ts test --description "Run tests" --global
 *   pnpx tsx create-command.ts component --agent code --template "Create component $ARGUMENTS"
 *   pnpx tsx create-command.ts review --subtask
 *   pnpx tsx create-command.ts deploy --json
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join, resolve } from "node:path";
import { parseArgs } from "node:util";

const DEFAULT_TEMPLATE = "TODO: Add command template here.\n\nUse $ARGUMENTS for user input.";

interface Options {
  name: string;
  template: string;
  description?: string;
  agent?: string;
  subtask: boolean;
  globalCmd: boolean;
  output?: string;
  json: boolean;
}

function createCommandFile(o: Options): string {
  const baseDir = o.output
    ? resolve(o.output)
    : o.globalCmd
      ? join(homedir(), ".config", "opencode", "commands")
      : join(process.cwd(), ".opencode", "commands");

  mkdirSync(baseDir, { recursive: true });

  const fmLines: string[] = [];
  if (o.description) fmLines.push(`description: ${o.description}`);
  if (o.agent) fmLines.push(`agent: ${o.agent}`);
  if (o.subtask) fmLines.push("subtask: true");

  const content = ["---", ...fmLines, "---", "", o.template, ""].join("\n");
  const filePath = join(baseDir, `${o.name}.md`);
  writeFileSync(filePath, content, "utf8");
  return filePath;
}

function usage(): void {
  console.log("Usage: pnpx tsx create-command.ts <command-name> [options]");
  console.log("");
  console.log("Options:");
  console.log("  -t, --template <text>     Command template (default: placeholder)");
  console.log("  -d, --description <text>  Brief description shown in TUI");
  console.log("  -a, --agent <name>        Agent to execute the command");
  console.log("  -s, --subtask             Force subagent invocation");
  console.log("  -g, --global              Create in ~/.config/opencode/commands/");
  console.log("  -o, --output <dir>        Custom output directory");
  console.log("      --json                Emit opencode.jsonc JSON config instead of a file");
  console.log("  -h, --help                Show this help");
  console.log("");
  console.log("Note: no --model flag. This configuration pins no models.");
}

function main(): number {
  let parsed;
  try {
    parsed = parseArgs({
      allowPositionals: true,
      options: {
        template: { type: "string", short: "t" },
        description: { type: "string", short: "d" },
        agent: { type: "string", short: "a" },
        subtask: { type: "boolean", short: "s" },
        global: { type: "boolean", short: "g" },
        output: { type: "string", short: "o" },
        json: { type: "boolean" },
        help: { type: "boolean", short: "h" },
      },
    });
  } catch (e) {
    console.error(JSON.stringify({ status: "error", error: String(e), type: "ArgumentError" }));
    return 1;
  }

  const { values, positionals } = parsed;
  const name = positionals[0];

  if (values.help || !name) {
    usage();
    return name ? 0 : 1;
  }

  const template = (values.template as string | undefined) ?? DEFAULT_TEMPLATE;

  try {
    if (values.json) {
      const entry: Record<string, unknown> = { template };
      if (values.description) entry.description = values.description;
      if (values.agent) entry.agent = values.agent;
      if (values.subtask) entry.subtask = true;
      console.log(JSON.stringify({ command: { [name]: entry } }, null, 2));
      return 0;
    }

    const filePath = createCommandFile({
      name,
      template,
      description: values.description as string | undefined,
      agent: values.agent as string | undefined,
      subtask: Boolean(values.subtask),
      globalCmd: Boolean(values.global),
      output: values.output as string | undefined,
      json: false,
    });

    console.log(
      JSON.stringify({
        status: "success",
        file: filePath,
        command: `/${name}`,
        message: `Created command file: ${filePath}`,
      }),
    );
    return 0;
  } catch (e) {
    console.error(
      JSON.stringify({
        status: "error",
        error: e instanceof Error ? e.message : String(e),
        type: e instanceof Error ? e.constructor.name : "Error",
      }),
    );
    return 1;
  }
}

process.exit(main());
