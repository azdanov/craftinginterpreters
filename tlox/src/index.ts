import { Scanner } from "./scanner";

/**
 * Runs the scanner on the given source code and prints the resulting tokens.
 *
 * Throws {@link Error} if an error occurs.
 */
export function run(source: string) {
  const scanner = new Scanner(source);
  const tokens = scanner.tokens;
  const errors = scanner.errors;

  if (errors.length > 0) {
    for (const error of errors) {
      console.log(error.message);
    }
    throw new Error("Failed scanning");
  }

  for (const token of tokens) {
    console.log(token);
  }
}
