#!/usr/bin/env node

/**
 * Repairs `openapi-zod-client`'s `z.record()` output in a generated client.
 *
 * The generator emits Zod v3 syntax — `z.record(valueType)` — for `Map`-shaped schema fields
 * (e.g. `product_template_version_pins`). Zod v4, which this repo installs, requires both a key
 * and a value schema, so the raw output fails `tsc` outright. The missing key is always
 * `z.string()`: JSON object keys are strings, and the OpenAPI document has no other key type to
 * express.
 *
 * This ran as a manual patch-after-every-`fetch:openapi` for a while, and that is what broke the
 * pre-push drift check: the committed file carried the patch, the generator's output did not, so
 * the two could never match and every push failed on a difference the backend had no part in.
 * Making the patch part of generation is what lets that check mean something again — both sides
 * now run `generate → fix`, so identical input produces identical output.
 *
 * Usage: node scripts/fix-generated-zod-record.js <file>
 *
 * Idempotent: a call that already has two arguments is left alone, so re-running is safe.
 */

import { readFileSync, writeFileSync } from "fs"
import ts from "typescript"

const KEY_SCHEMA = "z.string()"

const [filePath] = process.argv.slice(2)

if (!filePath) {
  console.error("Usage: node scripts/fix-generated-zod-record.js <file>")
  process.exit(1)
}

const source = readFileSync(filePath, "utf8")

// Parsed rather than pattern-matched: the value schema is itself a call chain full of parentheses
// and string literals (`z.string().regex(/.../)`), which a regex cannot bracket-match reliably.
const sourceFile = ts.createSourceFile(
  filePath,
  source,
  ts.ScriptTarget.Latest,
  /* setParentNodes */ false,
  ts.ScriptKind.TS
)

/** Insertion points for the missing key schema, collected in source order. */
const insertions = []

function visit(node) {
  if (
    ts.isCallExpression(node) &&
    ts.isPropertyAccessExpression(node.expression) &&
    node.expression.name.text === "record" &&
    node.arguments.length === 1
  ) {
    insertions.push(node.arguments[0].getStart(sourceFile))
  }
  ts.forEachChild(node, visit)
}

visit(sourceFile)

if (insertions.length === 0) {
  console.log(`✅ ${filePath}: no single-argument z.record() calls.`)
  process.exit(0)
}

// Applied back-to-front so each earlier offset stays valid.
let patched = source
for (const position of [...insertions].sort((a, b) => b - a)) {
  patched = `${patched.slice(0, position)}${KEY_SCHEMA}, ${patched.slice(position)}`
}

writeFileSync(filePath, patched)

const plural = insertions.length === 1 ? "call" : "calls"
console.log(
  `✅ ${filePath}: added the missing key schema to ${insertions.length} z.record() ${plural}.`
)
