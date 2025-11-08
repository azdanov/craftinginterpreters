import { type Token, TokenType } from "./token";

export class ScannerError extends Error {
  line: number;

  constructor(line: number, message: string) {
    super(`[line ${line}] Error: ${message}`);
    this.line = line;
    this.name = "ScannerError";
  }
}

export class ParserError extends Error {
  token: Token;

  constructor(token: Token, message: string) {
    if (token.type === TokenType.EOF) {
      super(`[line ${token.line}] at end: ${message}`);
    } else {
      super(`[line ${token.line}] at '${token.lexeme}': ${message}`);
    }
    this.token = token;
    this.name = "ParserError";
  }
}
