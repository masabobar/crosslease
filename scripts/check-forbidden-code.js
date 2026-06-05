#!/usr/bin/env node

import { execSync } from "child_process"
import { readFileSync } from "fs"

const TEST_FILES = [".test.", ".spec."]

const FORBIDDEN_PATTERNS = [
  {
    pattern: /console\.(log|warn|debug)/g,
    message: "console.log/warn/debug found (use console.error or remove)",
    exclude: TEST_FILES,
  },
  {
    pattern: /\bdebugger\b/g,
    message: "debugger statement found",
    exclude: [],
  },
  {
    // Covers Vitest (test.only, it.only, describe.only) and Playwright (test.only)
    pattern: /\b(test|it|describe)\.only\(/g,
    message: "Focused test (.only) found — remove before committing",
    exclude: [],
  },
]

let hasErrors = false

try {
  const stagedFiles = execSync(
    "git diff --cached --name-only --diff-filter=ACM"
  )
    .toString()
    .trim()
    .split("\n")
    .filter(file => file.endsWith(".ts") || file.endsWith(".tsx"))

  if (stagedFiles.length === 0) process.exit(0)

  for (const file of stagedFiles) {
    if (!file) continue

    try {
      const content = readFileSync(file, "utf-8")
      const lines = content.split("\n")

      for (const { pattern, message, exclude } of FORBIDDEN_PATTERNS) {
        if (exclude.some(exc => file.includes(exc))) continue

        lines.forEach((line, index) => {
          if (pattern.test(line)) {
            console.error(
              `\n❌ ${message}:\n   ${file}:${index + 1}\n   ${line.trim()}\n`
            )
            hasErrors = true
          }
        })

        pattern.lastIndex = 0
      }
    } catch {
      continue
    }
  }

  if (hasErrors) {
    console.error(
      "💡 Fix the issues above or use --no-verify to skip (not recommended)\n"
    )
    process.exit(1)
  }
} catch (err) {
  console.error("Error checking for forbidden code:", err.message)
  process.exit(1)
}
