---
name: feedback-figma-nodes-fallback
description: When /v1/files quota-exhausts, immediately fall back to /v1/files/{key}/nodes — separate rate-limit bucket; do NOT declare Stage 2 FAILED without trying it
metadata:
  type: feedback
---

When Figma REST returns HTTP 429 on `GET /v1/files/{fileKey}?ids=X&depth=N` with a large `Retry-After` (hours), **immediately try the fallback endpoint** `GET /v1/files/{fileKey}/nodes?ids=X&depth=N` before marking Stage 2 as FAILED. Figma tracks separate rate-limit buckets per endpoint — the primary `/files` endpoint can be exhausted while `/nodes` remains available on the same token.

**Why:** Confirmed on 2026-07-23 during Epic 11 batch (PRD1042-799/800/801/807). Primary `/files?ids=1:2,10:15285&depth=2` returned 429 with `Retry-After: 217209` (~60h) and `X-Figma-Rate-Limit-Type: low` — token appeared plan-exhausted. Fallback `/files/{key}/nodes?ids=1:2&depth=8` returned HTTP 200 immediately. Same token, same file, same node — different bucket. Stage 2 went from FAILED (design-blind test files) to COMPLETE (verbatim design copy anchored into every scenario).

**How to apply:**

- The `figma_fetch` helper in `.claude/skills/figma-design-extractor/SKILL.md` already documents `/nodes` as a fallback. Do not skip it. When the primary endpoint 429s with `Retry-After > 300s`, immediately re-issue against `/nodes` before returning quota-exhausted.
- The MCP Figma tools share the primary `/files` bucket — they will fail whenever the primary REST call fails. `/nodes` is the ONLY escape hatch on a quota-exhausted token.
- The `/nodes` response shape differs slightly: content lives under `nodes["<id>"].document` instead of `document.children[i]` — parse accordingly.
- Figma text nodes can contain control characters. Parse cached JSON with `json.loads(text, strict=False)` in Python; otherwise you get `JSONDecodeError` on multi-MB frame dumps.
- Cache both responses (primary AND `/nodes`) locally. `/tmp/figma-cache-e11/page-1-2-d8.json` and `page-10-15285-d8.json` remained valid for the whole Epic 11 batch.
- If the token has separate identity/plan questions, verify via `GET /v1/me` (lightweight, does not count against `low` tier). A valid identity + `/nodes` success confirms the token itself is fine — only the primary endpoint bucket is throttled.

Related: [[project-prd1042-22-framework-agreement]], [[feedback-figma-design-convention]], [[feedback-figma-link-not-bubbled]].
