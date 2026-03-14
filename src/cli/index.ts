#!/usr/bin/env bun
import { MemoryRepo } from "../memory/repo.js";
import { dbCommand } from "./commands/db.js";
import { experimentLogCommand } from "./commands/experiment_log.js";
import { paperFetchCommand } from "./commands/paper_fetch.js";
import { paperSearchCommand } from "./commands/paper_search.js";
import { runCommand } from "./commands/run.js";
import { statusCommand } from "./commands/status.js";

async function main(): Promise<void> {
  const [, , command, ...args] = process.argv;
  const repo = new MemoryRepo();

  switch (command) {
    case "start":
    case "run":
      await runCommand(repo, args);
      break;
    case "status":
      statusCommand(repo);
      break;
    case "db":
      requireArg(args[0], "db requires a SQL string");
      dbCommand(repo, args[0]!);
      break;
    case "paper-search":
      requireArg(args[0], "paper-search requires a query");
      await paperSearchCommand(args.join(" "));
      break;
    case "paper-fetch":
      requireArg(args[0], "paper-fetch requires an arXiv URL or id");
      await paperFetchCommand(repo, args[0]!);
      break;
    case "experiment-log":
      requireArg(args[0], "experiment-log requires a JSON payload");
      experimentLogCommand(repo, args[0]!);
      break;
    default:
      printHelp();
  }
}

function requireArg(value: string | undefined, message: string): asserts value is string {
  if (!value) {
    throw new Error(message);
  }
}

function printHelp(): void {
  process.stdout.write(
    [
      "zarathustra",
      "",
      "commands:",
      "  start [goal text] [--driver <cmd>] [--cwd <path>] [--cycles <n>] [--delay-ms <ms>]",
      "  run   [same as start]",
      "  status",
      "  db \"<sql>\"",
      "  paper-search <query>",
      "  paper-fetch <url-or-id>",
      "  experiment-log '<json>'",
    ].join("\n") + "\n",
  );
}

await main();
