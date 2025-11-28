import { Parser } from "./parser";
import { Scanner } from "./scanner";

/**
 * Runs the scanner on the given source code and prints the resulting tokens.
 *
 * Throws {@link Error} if an error occurs.
 */
export function run(source: string) {
  const scanner = new Scanner(source);
  if (scanner.errors.length > 0) {
    for (const error of scanner.errors) {
      console.log(error.message);
    }
    throw new Error("Failed scanning");
  }
  for (const token of scanner.tokens) {
    console.log(token);
  }

  const parser = new Parser(scanner.tokens);
  if (parser.errors.length > 0) {
    for (const error of parser.errors) {
      console.log(error.message);
    }
    throw new Error("Failed parsing");
  }
  for (const statement of parser.statements) {
    console.log(statement);
  }
}
