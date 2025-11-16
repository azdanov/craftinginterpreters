// Auto-generated AST classes for Expr
import type { Token } from "./token.ts";

export interface Visitor<T> {
  visitAssignExpr(expr: Assign): T;
  visitBinaryExpr(expr: Binary): T;
  visitCallExpr(expr: Call): T;
  visitGetterExpr(expr: Getter): T;
  visitGroupingExpr(expr: Grouping): T;
  visitLiteralExpr(expr: Literal): T;
  visitLogicalExpr(expr: Logical): T;
  visitSetterExpr(expr: Setter): T;
  visitSuperExpr(expr: Super): T;
  visitThisExpr(expr: This): T;
  visitUnaryExpr(expr: Unary): T;
  visitVariableExpr(expr: Variable): T;
}

export abstract class Expr {
  abstract accept<T>(visitor: Visitor<T>): T;
}

export class Assign extends Expr {
  constructor(
    public readonly name: Token,
    public readonly value: Expr,
  ) {
    super();
  }

  accept<T>(visitor: Visitor<T>): T {
    return visitor.visitAssignExpr(this);
  }
}

export class Binary extends Expr {
  constructor(
    public readonly left: Expr,
    public readonly operator: Token,
    public readonly right: Expr,
  ) {
    super();
  }

  accept<T>(visitor: Visitor<T>): T {
    return visitor.visitBinaryExpr(this);
  }
}

export class Call extends Expr {
  constructor(
    public readonly callee: Expr,
    public readonly paren: Token,
    public readonly args: Expr[],
  ) {
    super();
  }

  accept<T>(visitor: Visitor<T>): T {
    return visitor.visitCallExpr(this);
  }
}

export class Getter extends Expr {
  constructor(
    public readonly object: Expr,
    public readonly name: Token,
  ) {
    super();
  }

  accept<T>(visitor: Visitor<T>): T {
    return visitor.visitGetterExpr(this);
  }
}

export class Grouping extends Expr {
  constructor(public readonly expression: Expr) {
    super();
  }

  accept<T>(visitor: Visitor<T>): T {
    return visitor.visitGroupingExpr(this);
  }
}

export class Literal extends Expr {
  constructor(public readonly value: unknown) {
    super();
  }

  accept<T>(visitor: Visitor<T>): T {
    return visitor.visitLiteralExpr(this);
  }
}

export class Logical extends Expr {
  constructor(
    public readonly left: Expr,
    public readonly operator: Token,
    public readonly right: Expr,
  ) {
    super();
  }

  accept<T>(visitor: Visitor<T>): T {
    return visitor.visitLogicalExpr(this);
  }
}

export class Setter extends Expr {
  constructor(
    public readonly object: Expr,
    public readonly name: Token,
    public readonly value: Expr,
  ) {
    super();
  }

  accept<T>(visitor: Visitor<T>): T {
    return visitor.visitSetterExpr(this);
  }
}

export class Super extends Expr {
  constructor(
    public readonly keyword: Token,
    public readonly method: Token,
  ) {
    super();
  }

  accept<T>(visitor: Visitor<T>): T {
    return visitor.visitSuperExpr(this);
  }
}

export class This extends Expr {
  constructor(public readonly keyword: Token) {
    super();
  }

  accept<T>(visitor: Visitor<T>): T {
    return visitor.visitThisExpr(this);
  }
}

export class Unary extends Expr {
  constructor(
    public readonly operator: Token,
    public readonly right: Expr,
  ) {
    super();
  }

  accept<T>(visitor: Visitor<T>): T {
    return visitor.visitUnaryExpr(this);
  }
}

export class Variable extends Expr {
  constructor(public readonly name: Token) {
    super();
  }

  accept<T>(visitor: Visitor<T>): T {
    return visitor.visitVariableExpr(this);
  }
}
