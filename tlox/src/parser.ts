import { ParserError } from "./errors";
import * as E from "./expr";
import * as S from "./stmt";
import { type Token, TokenType } from "./token";

export class Parser {
  public readonly statements: S.Stmt[] = [];
  public readonly errors: ParserError[] = [];

  private readonly tokens: Token[];

  private current: number = 0;

  constructor(tokens: Token[]) {
    this.tokens = tokens;
    this.parseStatements();
  }

  parseStatements() {
    while (!this.isAtEnd()) {
      const stmt = this.declaration();
      if (stmt) this.statements.push(stmt);
    }
  }

  private expression(): E.Expr {
    return this.assignment();
  }

  private declaration(): S.Stmt | null {
    try {
      if (this.match(TokenType.CLASS)) return this.classDeclaration();
      if (this.match(TokenType.FUN)) return this.func("function");
      if (this.match(TokenType.VAR)) return this.varDeclaration();

      return this.statement();
    } catch (error) {
      if (error instanceof ParserError) {
        this.synchronize();
        return null;
      }
      throw error;
    }
  }

  private classDeclaration(): S.Stmt {
    const name = this.consume(TokenType.IDENTIFIER, "Expect class name.");

    let superclass: E.Variable | null = null;
    if (this.match(TokenType.LESS)) {
      this.consume(TokenType.IDENTIFIER, "Expect superclass name.");
      superclass = new E.Variable(this.previous());
    }
    this.consume(TokenType.LEFT_BRACE, "Expect '{' before class body.");

    const methods: S.Func[] = [];
    while (!this.check(TokenType.RIGHT_BRACE) && !this.isAtEnd()) {
      methods.push(this.func("method"));
    }

    this.consume(TokenType.RIGHT_BRACE, "Expect '}' after class body.");
    return new S.Class(name, superclass, methods);
  }

  private statement(): S.Stmt {
    if (this.match(TokenType.FOR)) return this.forStatement();
    if (this.match(TokenType.IF)) return this.ifStatement();
    if (this.match(TokenType.PRINT)) return this.printStatement();
    if (this.match(TokenType.RETURN)) return this.returnStatement();
    if (this.match(TokenType.WHILE)) return this.whileStatement();
    if (this.match(TokenType.LEFT_BRACE)) return new S.Block(this.block());

    return this.expressionStatement();
  }

  private forStatement(): S.Stmt {
    this.consume(TokenType.LEFT_PAREN, "Expect '(' after 'for'.");
    let initializer: S.Stmt | null;
    if (this.match(TokenType.SEMICOLON)) {
      initializer = null;
    } else if (this.match(TokenType.VAR)) {
      initializer = this.varDeclaration();
    } else {
      initializer = this.expressionStatement();
    }

    let condition: E.Expr | null = null;
    if (!this.check(TokenType.SEMICOLON)) {
      condition = this.expression();
    }
    this.consume(TokenType.SEMICOLON, "Expect ';' after loop condition.");

    let increment: E.Expr | null = null;
    if (!this.check(TokenType.RIGHT_PAREN)) {
      increment = this.expression();
    }
    this.consume(TokenType.RIGHT_PAREN, "Expect ')' after for clauses.");
    let body = this.statement();
    if (increment !== null) {
      body = new S.Block([body, new S.Expression(increment)]);
    }
    if (condition === null) condition = new E.Literal(true);
    body = new S.While(condition, body);
    if (initializer !== null) {
      body = new S.Block([initializer, body]);
    }
    return body;
  }

  private ifStatement(): S.Stmt {
    this.consume(TokenType.LEFT_PAREN, "Expect '(' after 'if'.");
    const condition = this.expression();
    this.consume(TokenType.RIGHT_PAREN, "Expect ')' after if condition.");

    const thenBranch = this.statement();
    let elseBranch: S.Stmt | null = null;
    if (this.match(TokenType.ELSE)) {
      elseBranch = this.statement();
    }

    return new S.If(condition, thenBranch, elseBranch);
  }

  private printStatement(): S.Stmt {
    const value = this.expression();
    this.consume(TokenType.SEMICOLON, "Expect ';' after value.");
    return new S.Print(value);
  }

  private returnStatement(): S.Stmt {
    const keyword = this.previous();
    let value: E.Expr | null = null;
    if (!this.check(TokenType.SEMICOLON)) {
      value = this.expression();
    }

    this.consume(TokenType.SEMICOLON, "Expect ';' after return value.");
    return new S.Return(keyword, value);
  }

  private varDeclaration(): S.Stmt {
    const name = this.consume(TokenType.IDENTIFIER, "Expect variable name.");

    let initializer: E.Expr | null = null;
    if (this.match(TokenType.EQUAL)) {
      initializer = this.expression();
    }

    this.consume(TokenType.SEMICOLON, "Expect ';' after variable declaration.");
    return new S.Var(name, initializer);
  }

  private whileStatement(): S.Stmt {
    this.consume(TokenType.LEFT_PAREN, "Expect '(' after 'while'.");
    const condition = this.expression();
    this.consume(TokenType.RIGHT_PAREN, "Expect ')' after condition.");
    const body = this.statement();

    return new S.While(condition, body);
  }

  private expressionStatement(): S.Stmt {
    const expr = this.expression();
    this.consume(TokenType.SEMICOLON, "Expect ';' after expression.");
    return new S.Expression(expr);
  }

  private func(kind: string): S.Func {
    const name = this.consume(TokenType.IDENTIFIER, `Expect ${kind} name.`);
    this.consume(TokenType.LEFT_PAREN, `Expect '(' after ${kind} name.`);
    const parameters: Token[] = [];
    if (!this.check(TokenType.RIGHT_PAREN)) {
      do {
        if (parameters.length >= 255) {
          this.errors.push(
            this.error(this.peek(), "Can't have more than 255 parameters."),
          );
        }

        parameters.push(
          this.consume(TokenType.IDENTIFIER, "Expect parameter name."),
        );
      } while (this.match(TokenType.COMMA));
    }
    this.consume(TokenType.RIGHT_PAREN, "Expect ')' after parameters.");

    this.consume(TokenType.LEFT_BRACE, `Expect '{' before ${kind} body.`);
    const body = this.block();
    return new S.Func(name, parameters, body);
  }

  private block(): S.Stmt[] {
    const statements: S.Stmt[] = [];

    while (!this.check(TokenType.RIGHT_BRACE) && !this.isAtEnd()) {
      const stmt = this.declaration();
      if (stmt) statements.push(stmt);
    }

    this.consume(TokenType.RIGHT_BRACE, "Expect '}' after block.");
    return statements;
  }

  private assignment(): E.Expr {
    const expr = this.or();

    if (this.match(TokenType.EQUAL)) {
      const equals = this.previous();
      const value = this.assignment();

      if (expr instanceof E.Variable) {
        const name = expr.name;
        return new E.Assign(name, value);
      } else if (expr instanceof E.Getter) {
        return new E.Setter(expr.object, expr.name, value);
      }

      this.errors.push(this.error(equals, "Invalid assignment target."));
    }

    return expr;
  }

  private or(): E.Expr {
    let expr = this.and();

    while (this.match(TokenType.OR)) {
      const operator = this.previous();
      const right = this.and();
      expr = new E.Logical(expr, operator, right);
    }

    return expr;
  }

  private and(): E.Expr {
    let expr = this.equality();

    while (this.match(TokenType.AND)) {
      const operator = this.previous();
      const right = this.equality();
      expr = new E.Logical(expr, operator, right);
    }

    return expr;
  }

  private equality(): E.Expr {
    let expr = this.comparison();

    while (this.match(TokenType.BANG_EQUAL, TokenType.EQUAL_EQUAL)) {
      const operator = this.previous();
      const right = this.comparison();
      expr = new E.Binary(expr, operator, right);
    }

    return expr;
  }

  private comparison(): E.Expr {
    let expr = this.term();

    while (
      this.match(
        TokenType.GREATER,
        TokenType.GREATER_EQUAL,
        TokenType.LESS,
        TokenType.LESS_EQUAL,
      )
    ) {
      const operator = this.previous();
      const right = this.term();
      expr = new E.Binary(expr, operator, right);
    }

    return expr;
  }

  private term(): E.Expr {
    let expr = this.factor();

    while (this.match(TokenType.MINUS, TokenType.PLUS)) {
      const operator = this.previous();
      const right = this.factor();
      expr = new E.Binary(expr, operator, right);
    }

    return expr;
  }

  private factor(): E.Expr {
    let expr = this.unary();

    while (this.match(TokenType.SLASH, TokenType.STAR)) {
      const operator = this.previous();
      const right = this.unary();
      expr = new E.Binary(expr, operator, right);
    }

    return expr;
  }

  private unary(): E.Expr {
    if (this.match(TokenType.BANG, TokenType.MINUS)) {
      const operator = this.previous();
      const right = this.unary();
      return new E.Unary(operator, right);
    }
    return this.call();
  }

  private finishCall(callee: E.Expr): E.Expr {
    const args: E.Expr[] = [];
    if (!this.check(TokenType.RIGHT_PAREN)) {
      do {
        if (args.length >= 255) {
          this.errors.push(
            this.error(this.peek(), "Can't have more than 255 arguments."),
          );
        }
        args.push(this.expression());
      } while (this.match(TokenType.COMMA));
    }

    const paren = this.consume(
      TokenType.RIGHT_PAREN,
      "Expect ')' after arguments.",
    );

    return new E.Call(callee, paren, args);
  }

  private call(): E.Expr {
    let expr = this.primary();

    while (true) {
      if (this.match(TokenType.LEFT_PAREN)) {
        expr = this.finishCall(expr);
      } else if (this.match(TokenType.DOT)) {
        const name = this.consume(
          TokenType.IDENTIFIER,
          "Expect property name after '.'.",
        );
        expr = new E.Getter(expr, name);
      } else {
        break;
      }
    }

    return expr;
  }

  private primary(): E.Expr {
    if (this.match(TokenType.FALSE)) return new E.Literal(false);
    if (this.match(TokenType.TRUE)) return new E.Literal(true);
    if (this.match(TokenType.NIL)) return new E.Literal(null);

    if (this.match(TokenType.NUMBER, TokenType.STRING)) {
      return new E.Literal(this.previous().literal);
    }

    if (this.match(TokenType.SUPER)) {
      const keyword = this.previous();
      this.consume(TokenType.DOT, "Expect '.' after 'super'.");
      const method = this.consume(
        TokenType.IDENTIFIER,
        "Expect superclass method name.",
      );
      return new E.Super(keyword, method);
    }

    if (this.match(TokenType.THIS)) return new E.This(this.previous());

    if (this.match(TokenType.IDENTIFIER)) {
      return new E.Variable(this.previous());
    }

    if (this.match(TokenType.LEFT_PAREN)) {
      const expr = this.expression();
      this.consume(TokenType.RIGHT_PAREN, "Expect ')' after expression.");
      return new E.Grouping(expr);
    }

    const err = this.error(this.peek(), "Expect expression.");
    this.errors.push(err);
    throw err;
  }

  private match(...types: TokenType[]): boolean {
    for (const type of types) {
      if (this.check(type)) {
        this.advance();
        return true;
      }
    }

    return false;
  }

  private consume(type: TokenType, message: string): Token {
    if (this.check(type)) return this.advance();

    const err = this.error(this.peek(), message);
    this.errors.push(err);
    throw err;
  }

  private check(type: TokenType): boolean {
    if (this.isAtEnd()) return false;
    return this.peek().type === type;
  }

  private advance(): Token {
    if (!this.isAtEnd()) this.current++;
    return this.previous();
  }

  private isAtEnd(): boolean {
    return this.peek().type === TokenType.EOF;
  }

  private peek(): Token {
    const token = this.tokens[this.current];
    if (!token) throw new Error("Unexpected end of token stream.");
    return token;
  }

  private previous(): Token {
    const token = this.tokens[this.current - 1];
    if (!token) throw new Error("Unexpected end of token stream.");
    return token;
  }

  private error(token: Token, message: string): ParserError {
    return new ParserError(token, message);
  }

  private synchronize(): void {
    this.advance();

    while (!this.isAtEnd()) {
      if (this.previous().type === TokenType.SEMICOLON) return;

      switch (this.peek().type) {
        case TokenType.CLASS:
        case TokenType.FUN:
        case TokenType.VAR:
        case TokenType.FOR:
        case TokenType.IF:
        case TokenType.WHILE:
        case TokenType.PRINT:
        case TokenType.RETURN:
          return;
      }

      this.advance();
    }
  }
}
