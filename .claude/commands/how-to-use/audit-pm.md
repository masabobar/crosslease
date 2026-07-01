# Audit PM Framework - Quick Guide

**Use when:** You want a health check of the PM framework in this repo — consistency, broken links, stale references, file-size violations.
**Command:** `/audit-pm`
**Time:** 30 seconds (script) + a minute of review
**Output:** Prioritized Markdown report with severity markers.

**All documentation is in English only.**

---

## 🎯 What It Does

Runs a two-layer audit:

1. **Mechanical layer** (shell script `.claude/hooks/audit-pm.sh`)
   - Required files exist
   - File sizes vs documentation.md §2.1 limits
   - Version consistency across docs
   - Broken internal markdown links
   - Modular vs monolithic backlog mismatches
   - Legacy command references (`/plan-sprint`, `/update-progress`)
   - How-to-use guide coverage

2. **Judgement layer** (Claude reads the script output + applies context)
   - Duplicate/overlapping docs
   - Prose drift ("new in v3.0" claims that are no longer current)
   - Auto-generated vs hand-maintained file boundary
   - Prioritization into 🔴 / 🟠 / 🟡 / 🟢

---

## 📋 Command Format

```bash
/audit-pm
```

No arguments. The command scans the current repo's `.project-management/` and `.claude/` trees.

---

## 📊 What You Get

A sectioned report like:

```markdown
# PM Framework Audit Report

**Date:** 2026-04-21
**Framework version declared:** 3.2.0

## 🔴 Critical

- 12 broken internal links in COMMANDS-REFERENCE.md

## 🟠 High

- Version mismatch: 7 docs stuck on v3.0.0
- CHANGELOG.md missing entry for v3.2.0

## 🟡 Medium

- output/sprints/ legacy dir exists
- /migrate-to-modular has no how-to-use guide

## 🟢 Low

- 2 commands slightly above 300-line soft target

## Next actions

- Batch critical findings into one fix PR
- Version bump can run after broken links resolved
```

---

## 🧭 When to Use

| Situation                                                   | Run /audit-pm?                   |
| ----------------------------------------------------------- | -------------------------------- |
| Before shipping a new framework release                     | ✅ yes                           |
| After merging a big refactor PR                             | ✅ yes                           |
| When docs feel out of sync                                  | ✅ yes                           |
| Weekly hygiene check on active framework                    | ✅ yes                           |
| Inside a downstream project that just adopted the framework | ✅ yes                           |
| Before running `/execute-work`                              | ❌ overkill                      |
| For runtime progress check                                  | ❌ use `/project-status` instead |

---

## 🚦 Severity Legend

- 🔴 **Critical** — broken links on primary user path, missing required files, anything that makes the framework fail on copy.
- 🟠 **High** — version drift, CHANGELOG gaps, stale structure references. Fix this week.
- 🟡 **Medium** — duplicate docs, oversized files (non-blocking), legacy artifacts, missing how-to-use guides. Housekeeping.
- 🟢 **Low** — cosmetic, slight threshold overages, naming inconsistency.

---

## 🎓 After the Report

The command **does not auto-fix**. It asks:

1. "Batch the 🔴 critical findings into a fix plan?"
2. "Run the same audit on a sibling project?"
3. "Just save the report — no action now?"

Auto-fix would trade judgement for speed; most findings have multiple valid remedies (merge two docs vs delete one? split a module vs reduce scope?). `/audit-pm` surfaces the problem; you choose the fix.

**Typical follow-up:** pass the report to `/execute-work bug BUG-XXX` (one per finding cluster) or run a plan-mode session to batch them.

---

## 📚 Full Documentation

**This is the quick guide (~90 lines).**

Full command docs: [`.claude/commands/audit-pm.md`](../audit-pm.md)
Audit script: [`.claude/hooks/audit-pm.sh`](../../hooks/audit-pm.sh)
Rule source: [`.claude/rules/documentation.md`](../../rules/documentation.md) §2.1

---

**Part of:** Claude Project Management System v3.3
