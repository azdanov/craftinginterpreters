#!/usr/bin/env bun

import fs from "node:fs";
import path from "node:path";

const EXIT_CODE_USAGE_ERROR = 64;

const TYPE_SEPARATOR = ":";
const FIELD_SEPARATOR = ", ";

interface FieldDefinition {
  type: string;
  name: string;
}

/**
 * Generates boilerplate code for syntax tree classes.
 */
function main(args: string[]): void {
  if (args.length !== 1) {
    console.error("Usage: generate_ast <output directory>");
    process.exit(EXIT_CODE_USAGE_ERROR);
  }

  const outputDir = args[0];
  if (!outputDir) {
    console.error("Output directory cannot be empty.");
    process.exit(EXIT_CODE_USAGE_ERROR);
  }

  defineAst(outputDir, "Expr", { "./token.ts": ["Token"] }, [
    "Assign   : Token name, Expr value",
    "Binary   : Expr left, Token operator, Expr right",
    "Call     : Expr callee, Token paren, Expr[] args",
    "Getter   : Expr object, Token name",
    "Grouping : Expr expression",
    "Literal  : unknown value",
    "Logical  : Expr left, Token operator, Expr right",
    "Setter   : Expr object, Token name, Expr value",
    "Super    : Token keyword, Token method",
    "This     : Token keyword",
    "Unary    : Token operator, Expr right",
    "Variable : Token name",
  ]);

  defineAst(
    outputDir,
    "Stmt",
    {
      "./expr.ts": ["Expr", "Variable"],
      "./token.ts": ["Token"],
    },
    [
      "Block      : Stmt[] statements",
      "Class      : Token name, Variable | null superclass, Func[] methods",
      "Expression : Expr expression",
      "Func       : Token name, Token[] params, Stmt[] body",
      "If         : Expr condition, Stmt thenBranch, Stmt | null elseBranch",
      "Print      : Expr expression",
      "Return     : Token keyword, Expr | null value",
      "Var        : Token name, Expr | null initializer",
      "While      : Expr condition, Stmt body",
    ],
  );
}

function defineAst(
  outputDir: string,
  baseName: string,
  typeImports: Record<string, string[]>,
  types: string[],
): void {
  const filePath = path.join(outputDir, `${baseName.toLowerCase()}.ts`);
  const parts: string[] = [];

  parts.push(`// Auto-generated AST classes for ${baseName}`);

  for (const [importPath, importTypes] of Object.entries(typeImports)) {
    parts.push(
      `import type { ${importTypes.join(", ")} } from "${importPath}";`,
    );
  }

  parts.push(
    "",
    defineVisitor(baseName, types),
    "",
    `export abstract class ${baseName} {`,
    `  abstract accept<T>(visitor: Visitor<T>): T;`,
    `}`,
    "",
  );

  for (const type of types) {
    const [className, fieldList] = parseTypeDefinition(type);
    const fields = parseFields(fieldList);
    parts.push(defineType(baseName, className, fields), "");
  }

  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(filePath, parts.join("\n"), "utf-8");

  console.log(`Generated ${filePath}`);
}

function parseTypeDefinition(type: string): [string, string] {
  const parts = type.split(TYPE_SEPARATOR);
  const className = parts[0]?.trim();
  const fields = parts[1]?.trim();

  if (!className || !fields) {
    throw new Error(`Invalid type definition: ${type}`);
  }

  return [className, fields];
}

function parseFields(fieldList: string): FieldDefinition[] {
  return fieldList.split(FIELD_SEPARATOR).map((field) => {
    const parts = field.trim().split(" ");
    const name = parts.at(-1);
    const type = parts.slice(0, -1).join(" ");

    if (!name || !type) {
      throw new Error(`Invalid field definition: ${field}`);
    }

    return { type, name };
  });
}

function defineVisitor(baseName: string, types: string[]): string {
  const parts: string[] = ["export interface Visitor<T> {"];

  for (const type of types) {
    const [typeName] = parseTypeDefinition(type);
    const lowerBaseName = baseName.toLowerCase();
    parts.push(
      `  visit${typeName}${baseName}(${lowerBaseName}: ${typeName}): T;`,
    );
  }

  parts.push("}");
  return parts.join("\n");
}

function defineType(
  baseName: string,
  className: string,
  fields: FieldDefinition[],
): string {
  const parts: string[] = [];

  parts.push(
    `export class ${className} extends ${baseName} {`,
    "  constructor(",
  );

  for (const field of fields) {
    parts.push(`    public readonly ${field.name}: ${field.type},`);
  }

  parts.push(
    "  ) {",
    "    super();",
    "  }",
    "",
    "  accept<T>(visitor: Visitor<T>): T {",
    `    return visitor.visit${className}${baseName}(this);`,
    "  }",
    "}",
  );

  return parts.join("\n");
}

main(process.argv.slice(2));
