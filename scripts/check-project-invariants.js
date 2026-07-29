#!/usr/bin/env node

/**
 * Deterministic project-invariant checks — the subset of .claude/rules/code-review.md
 * that needs no judgment and therefore should not wait for an agent to be invoked.
 *
 * Runs from .husky/pre-commit. Complements scripts/check-forbidden-code.js
 * (console/debugger/.only) rather than overlapping it.
 *
 *   1. i18n locale parity  — en/<ns>.json and de/<ns>.json must hold identical key sets
 *   2. Required-test parity — a NEW Zod schema / store / lib util must arrive with its test
 *   3. Enum wire values     — no hardcoded role/status/type literals in comparisons
 *
 * Each check is deliberately narrow so it can never block a commit over pre-existing
 * debt: parity runs only when locale files are staged, test-parity only on added files,
 * and the enum scan only on lines this commit adds. Broader sweeps are /review-codebase.
 *
 * Run manually: node scripts/check-project-invariants.js
 */

import { execSync } from "child_process"
import { existsSync, readFileSync, readdirSync } from "fs"

const EN_DIR = "src/i18n/locales/en"
const DE_DIR = "src/i18n/locales/de"

/**
 * Wire values owned by ../refinext-api/ and mirrored in each feature's api/schema.ts.
 * Source of truth: CLAUDE.md §Known data shapes + .project-management/rules/project-rules.md.
 * Kept in sync manually — this is a lint rule list, not a second definition of the enums.
 */
const WIRE_VALUES = [
  // UserRole
  "system_admin",
  "support_user",
  "auditor",
  "front_office",
  "back_office",
  "leasing_company_user",
  // UserType
  "platform",
  "bank_tenant",
  "leasing_company",
  // UserStatus
  "active",
  "invited",
  "suspended",
  "expired",
  "deactivated",
]

const ENUM_LITERAL = new RegExp(
  `(===|!==|\\bcase)\\s*"(${WIRE_VALUES.join("|")})"`
)

/**
 * Not hand-authored, or legitimately hardcodes wire values:
 * - components/ui + generated → vendored / codegen (matches ESLint globalIgnores)
 * - __tests__ + e2e → assertions SHOULD pin the literal contract, not follow a
 *   refactor of it; e2e is QA-owned per CLAUDE.md §Testing
 */
const NOT_PRODUCTION = [
  "src/components/ui/",
  "src/generated/",
  "src/__tests__/",
  "src/e2e/",
]

/** Nothing behavioral to assert on, so testing.md's required-test gate does not apply. */
const TEST_EXEMPT_BASENAMES = ["constants.ts", "types.ts"]

const findings = []
const fail = (message, location, detail) =>
  findings.push({ message, location, detail })

const git = args => execSync(`git ${args}`).toString().trim()
const stagedFiles = filter =>
  git(`diff --cached --name-only --diff-filter=${filter}`)
    .split("\n")
    .filter(Boolean)

// ---------------------------------------------------------------- 1. i18n parity

function leafKeys(value, prefix = "", out = []) {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    for (const [key, child] of Object.entries(value)) {
      leafKeys(child, prefix ? `${prefix}.${key}` : key, out)
    }
  } else {
    out.push(prefix)
  }
  return out
}

function checkLocaleParity(staged) {
  // Drift can only be introduced by staging a locale file. Skipping otherwise keeps
  // a teammate's drift on develop from blocking an unrelated commit here.
  if (!staged.some(file => file.startsWith("src/i18n/locales/"))) return

  for (const namespace of readdirSync(EN_DIR).filter(f =>
    f.endsWith(".json")
  )) {
    const en = `${EN_DIR}/${namespace}`
    const de = `${DE_DIR}/${namespace}`

    if (!existsSync(de)) {
      fail("i18n namespace has no German counterpart", de, `expected for ${en}`)
      continue
    }

    const enKeys = leafKeys(JSON.parse(readFileSync(en, "utf-8")))
    const deKeys = new Set(leafKeys(JSON.parse(readFileSync(de, "utf-8"))))
    const enSet = new Set(enKeys)

    const missingInDe = enKeys.filter(key => !deKeys.has(key))
    const missingInEn = [...deKeys].filter(key => !enSet.has(key))

    if (missingInDe.length) {
      fail(
        `i18n key(s) missing from de/${namespace}`,
        de,
        missingInDe.join(", ")
      )
    }
    if (missingInEn.length) {
      fail(
        `i18n key(s) missing from en/${namespace}`,
        en,
        missingInEn.join(", ")
      )
    }
  }
}

// ---------------------------------------------------------- 2. Required-test parity

/** Mirror path in src/__tests__/, per .claude/rules/testing.md. */
function expectedTestPath(file) {
  const schema = file.match(/^src\/features\/([^/]+)\/api\/schema\.ts$/)
  if (schema) return `src/__tests__/features/${schema[1]}/api/schema.test.ts`

  const store = file.match(/^src\/store\/(.+)\.ts$/)
  if (store) return `src/__tests__/store/${store[1]}.test.ts`

  const lib = file.match(/^src\/lib\/(.+)\.ts$/)
  if (lib) return `src/__tests__/lib/${lib[1]}.test.ts`

  return null
}

/** A file exporting no callable has no behavior to cover — only values or types. */
function exportsBehavior(file) {
  const source = readFileSync(file, "utf-8")
  return (
    /export\s+(async\s+)?function\s/.test(source) ||
    /export\s+class\s/.test(source) ||
    /export\s+const\s+\w+\s*[:=][^=]*=>/.test(source)
  )
}

function checkRequiredTests(addedTsFiles) {
  for (const file of addedTsFiles) {
    if (file.endsWith(".d.ts")) continue
    if (TEST_EXEMPT_BASENAMES.includes(file.split("/").pop())) continue

    const expected = expectedTestPath(file)
    if (!expected || existsSync(expected)) continue
    if (!exportsBehavior(file)) continue

    fail("new file has no unit test", file, `expected ${expected}`)
  }
}

// ------------------------------------------------------------ 3. Enum wire values

/** Added lines from the staged diff, as {file, line, text}. */
function addedLines() {
  const diff = execSync(
    "git diff --cached -U0 --diff-filter=ACMR -- src"
  ).toString()

  const added = []
  let file = null
  let lineNo = 0

  for (const line of diff.split("\n")) {
    if (line.startsWith("+++ ")) {
      file = line.startsWith("+++ b/") ? line.slice(6) : null
      continue
    }
    if (line.startsWith("@@")) {
      const match = line.match(/\+(\d+)/)
      lineNo = match ? Number(match[1]) : 0
      continue
    }
    if (file && line.startsWith("+")) {
      added.push({ file, line: lineNo, text: line.slice(1) })
      lineNo++
    }
  }
  return added
}

function checkEnumLiterals(added) {
  for (const { file, line, text } of added) {
    if (!/\.(ts|tsx)$/.test(file)) continue
    if (NOT_PRODUCTION.some(prefix => file.startsWith(prefix))) continue
    if (!ENUM_LITERAL.test(text)) continue

    fail(
      "hardcoded enum wire value in a comparison — reference the schema enum",
      `${file}:${line}`,
      text.trim()
    )
  }
}

// ------------------------------------------------------------------------ runner

try {
  const staged = stagedFiles("ACMR")
  if (staged.length === 0) process.exit(0)

  checkLocaleParity(staged)
  checkRequiredTests(
    stagedFiles("A").filter(f => f.endsWith(".ts") && !f.endsWith(".test.ts"))
  )
  checkEnumLiterals(addedLines())

  if (findings.length > 0) {
    for (const { message, location, detail } of findings) {
      console.error(`\n❌ ${message}:\n   ${location}\n   ${detail}\n`)
    }
    console.error(
      `💡 ${findings.length} project-invariant violation(s). See .claude/rules/code-review.md ` +
        `(i18n §6, testing §9, enums §10).\n   Fix the issues above or use --no-verify to skip (not recommended)\n`
    )
    process.exit(1)
  }
} catch (err) {
  console.error("Error checking project invariants:", err.message)
  process.exit(1)
}
