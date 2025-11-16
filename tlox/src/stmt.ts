// Auto-generated AST classes for Stmt
import type { Expr, Variable } from "./expr.ts";
import type { Token } from "./token.ts";

export interface Visitor<T> {
  visitBlockStmt(stmt: Block): T;
  visitClassStmt(stmt: Class): T;
  visitExpressionStmt(stmt: Expression): T;
  visitFuncStmt(stmt: Func): T;
  visitIfStmt(stmt: If): T;
  visitPrintStmt(stmt: Print): T;
  visitReturnStmt(stmt: Return): T;
  visitVarStmt(stmt: Var): T;
  visitWhileStmt(stmt: While): T;
}

export abstract class Stmt {
  abstract accept<T>(visitor: Visitor<T>): T;
}

export class Block extends Stmt {
  constructor(public readonly statements: Stmt[]) {
    super();
  }

  accept<T>(visitor: Visitor<T>): T {
    return visitor.visitBlockStmt(this);
  }
}

export class Class extends Stmt {
  constructor(
    public readonly name: Token,
    public readonly superclass: Variable | null,
    public readonly methods: Func[],
  ) {
    super();
  }

  accept<T>(visitor: Visitor<T>): T {
    return visitor.visitClassStmt(this);
  }
}

export class Expression extends Stmt {
  constructor(public readonly expression: Expr) {
    super();
  }

  accept<T>(visitor: Visitor<T>): T {
    return visitor.visitExpressionStmt(this);
  }
}

export class Func extends Stmt {
  constructor(
    public readonly name: Token,
    public readonly params: Token[],
    public readonly body: Stmt[],
  ) {
    super();
  }

  accept<T>(visitor: Visitor<T>): T {
    return visitor.visitFuncStmt(this);
  }
}

export class If extends Stmt {
  constructor(
    public readonly condition: Expr,
    public readonly thenBranch: Stmt,
    public readonly elseBranch: Stmt | null,
  ) {
    super();
  }

  accept<T>(visitor: Visitor<T>): T {
    return visitor.visitIfStmt(this);
  }
}

export class Print extends Stmt {
  constructor(public readonly expression: Expr) {
    super();
  }

  accept<T>(visitor: Visitor<T>): T {
    return visitor.visitPrintStmt(this);
  }
}

export class Return extends Stmt {
  constructor(
    public readonly keyword: Token,
    public readonly value: Expr | null,
  ) {
    super();
  }

  accept<T>(visitor: Visitor<T>): T {
    return visitor.visitReturnStmt(this);
  }
}

export class Var extends Stmt {
  constructor(
    public readonly name: Token,
    public readonly initializer: Expr | null,
  ) {
    super();
  }

  accept<T>(visitor: Visitor<T>): T {
    return visitor.visitVarStmt(this);
  }
}

export class While extends Stmt {
  constructor(
    public readonly condition: Expr,
    public readonly body: Stmt,
  ) {
    super();
  }

  accept<T>(visitor: Visitor<T>): T {
    return visitor.visitWhileStmt(this);
  }
}
