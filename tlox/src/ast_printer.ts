import type * as E from "./expr";
import type * as S from "./stmt";
import type { Token } from "./token";

export class AstPrinter implements E.Visitor<string>, S.Visitor<string> {
  print(expr: E.Expr): string;
  print(stmt: S.Stmt): string;
  print(node: E.Expr | S.Stmt): string {
    return node.accept(this);
  }

  visitBlockStmt(stmt: S.Block): string {
    const builder: string[] = [];
    builder.push("(block ");

    for (const statement of stmt.statements) {
      builder.push(statement.accept(this));
    }

    builder.push(")");
    return builder.join("");
  }

  visitClassStmt(stmt: S.Class): string {
    const builder: string[] = [];
    builder.push(`(class ${stmt.name.lexeme}`);

    if (stmt.superclass !== null) {
      builder.push(` < ${this.print(stmt.superclass)}`);
    }

    for (const method of stmt.methods) {
      builder.push(` ${this.print(method)}`);
    }

    builder.push(")");
    return builder.join("");
  }

  visitExpressionStmt(stmt: S.Expression): string {
    return this.parenthesize(";", stmt.expression);
  }

  visitFuncStmt(stmt: S.Func): string {
    const builder: string[] = [];
    builder.push(`(func ${stmt.name.lexeme}(`);

    for (const param of stmt.params) {
      if (param !== stmt.params[0]) builder.push(" ");
      builder.push(param.lexeme);
    }

    builder.push(") ");

    for (const body of stmt.body) {
      builder.push(body.accept(this));
    }

    builder.push(")");
    return builder.join("");
  }

  visitIfStmt(stmt: S.If): string {
    if (stmt.elseBranch === null) {
      return this.parenthesize2("if", stmt.condition, stmt.thenBranch);
    }

    return this.parenthesize2(
      "if-else",
      stmt.condition,
      stmt.thenBranch,
      stmt.elseBranch,
    );
  }

  visitPrintStmt(stmt: S.Print): string {
    return this.parenthesize("print", stmt.expression);
  }

  visitReturnStmt(stmt: S.Return): string {
    if (stmt.value === null) return "(return)";
    return this.parenthesize("return", stmt.value);
  }

  visitVarStmt(stmt: S.Var): string {
    if (stmt.initializer === null) {
      return this.parenthesize2("var", stmt.name);
    }

    return this.parenthesize2("var", stmt.name, "=", stmt.initializer);
  }

  visitWhileStmt(stmt: S.While): string {
    return this.parenthesize2("while", stmt.condition, stmt.body);
  }

  visitAssignExpr(expr: E.Assign): string {
    return this.parenthesize2("=", expr.name.lexeme, expr.value);
  }

  visitBinaryExpr(expr: E.Binary): string {
    return this.parenthesize(expr.operator.lexeme, expr.left, expr.right);
  }

  visitCallExpr(expr: E.Call): string {
    return this.parenthesize2("call", expr.callee, expr.args);
  }

  visitGetterExpr(expr: E.Getter): string {
    return this.parenthesize2(".", expr.object, expr.name.lexeme);
  }

  visitGroupingExpr(expr: E.Grouping): string {
    return this.parenthesize("group", expr.expression);
  }

  visitLiteralExpr(expr: E.Literal): string {
    if (!expr.value) return "nil";
    return expr.value.toString();
  }

  visitLogicalExpr(expr: E.Logical): string {
    return this.parenthesize(expr.operator.lexeme, expr.left, expr.right);
  }

  visitSetterExpr(expr: E.Setter): string {
    return this.parenthesize2("=", expr.object, expr.name.lexeme, expr.value);
  }

  visitSuperExpr(expr: E.Super): string {
    return this.parenthesize2("super", expr.method);
  }

  visitThisExpr(_expr: E.This): string {
    return "this";
  }

  visitUnaryExpr(expr: E.Unary): string {
    return this.parenthesize(expr.operator.lexeme, expr.right);
  }

  visitVariableExpr(expr: E.Variable): string {
    return expr.name.lexeme;
  }

  private parenthesize(name: string, ...exprs: E.Expr[]): string {
    const builder: string[] = [];

    builder.push(`(${name}`);
    for (const expr of exprs) {
      builder.push(" ", expr.accept(this));
    }
    builder.push(")");

    return builder.join("");
  }

  private parenthesize2(name: string, ...parts: unknown[]): string {
    const builder: string[] = [];

    builder.push(`(${name}`);
    this.transform(builder, ...parts);
    builder.push(")");

    return builder.join("");
  }

  private transform(builder: string[], ...parts: unknown[]): void {
    for (const part of parts) {
      builder.push(" ");

      if (this.isExpr(part)) {
        builder.push(part.accept(this));
      } else if (this.isStmt(part)) {
        builder.push(part.accept(this));
      } else if (this.isToken(part)) {
        builder.push(part.lexeme);
      } else if (Array.isArray(part)) {
        this.transform(builder, ...part);
      } else {
        builder.push(String(part));
      }
    }
  }

  private isExpr(obj: unknown): obj is E.Expr {
    return obj !== null && typeof obj === "object" && "accept" in obj;
  }

  private isStmt(obj: unknown): obj is S.Stmt {
    return obj !== null && typeof obj === "object" && "accept" in obj;
  }

  private isToken(obj: unknown): obj is Token {
    return obj !== null && typeof obj === "object" && "lexeme" in obj;
  }
}
