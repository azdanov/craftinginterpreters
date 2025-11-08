#!/usr/bin/env bun

import fs from "node:fs";
import readline from "node:readline";
import { run } from "./src";

async function main(args: string[] = process.argv.slice(2)): Promise<void> {
  if (args.length > 1) {
    console.log("Usage: tlox [script]");
    process.exit(64);
  } else if (args[0]) {
    console.log(`Running file: ${args[0]}`);
    await runFile(args[0]);
  } else {
    console.log("Starting interactive prompt...");
    await runPrompt();
  }
}

async function runFile(filePath: string): Promise<void> {
  const contents = await fs.promises.readFile(filePath, { encoding: "utf-8" });
  try {
    run(contents);
  } catch (e) {
    console.error(e);
    process.exit(65);
  }
}

async function runPrompt(): Promise<void> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: "> ",
  });

  rl.prompt();

  rl.on("line", (line: string) => {
    try {
      run(line);
    } catch {
      // Continue.
    }
    rl.prompt();
  });

  rl.on("close", () => {
    process.exit(0);
  });
}

await main();
