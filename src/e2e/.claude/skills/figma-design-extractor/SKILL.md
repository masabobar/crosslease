---
name: figma-design-extractor
description: "Use this skill to extract structured design data from Figma files. Invoke when the qa-lead pipeline reaches Stage 2 and needs design data for comparison against story requirementS and when given a Figma URL to extract UI elements, screen names, component hierarchy, interactive states (default, hover, error, empty, loading, disabled), copy and labels, form fields, and navigation flows for each linked Figma frame. Detects design gaps such as missing error states or unlabelled form fields. Returns a normalized design object with extraction_status SUCCESS, PARTIAL, or FAILED."
allowed-tools: Bash, mcp__plugin_figma_figma__get_design_context, mcp__plugin_figma_figma__get_screenshot, mcp__plugin_figma_figma__get_metadata, mcp__plugin_figma_figma__get_variable_defs, mcp__plugin_figma_figma__get_libraries, mcp__plugin_figma_figma__whoami, TaskCreate, TaskUpdate, Read
model: sonnet
---

## Invocation

**Primary method: Bash + curl** using the token from `.env`. The Figma MCP tools (`get_design_context`, `get_screenshot`, etc.) are rate-limited on the Professional View seat and must NOT be used as the primary approach. Use them only as a last resort if the REST API is unavailable.

## Extraction steps

1. Parse `figma_urls` → extract `fileKey` and `node-id` from each URL (convert `-` to `:` in node-id)
2. **Fetch the parent canvas once** at `depth=2` via `figma_fetch` to discover its sections/children — do NOT call the API once per section
3. If step 2 reveals multiple sections you need, **batch them in a single call** using a comma-separated `ids` list at `depth=8`
4. Parse the returned JSON locally with Python to walk each section — no additional API calls
5. For each frame extract: screen name, component list, visible copy/labels, form fields with labels and placeholders, prototype navigation flows
6. For each interactive component, check presence of: default, hover, error, empty, loading, disabled states
7. Detect and log design gaps (see below)

**Rules of thumb to stay under the rate limit:**

- One canvas → one call. Batch sibling section IDs into the same `ids=A,B,C` parameter instead of N separate calls.
- Use `depth=2` for structure discovery; `depth=8` only when you actually need the copy/components.
- All requests are cached to `/tmp/figma-cache/` with a 1-hour TTL. Cache lookups are order-insensitive and superset-aware: `ids=A,B` and `ids=B,A` share a cache entry, and a cached `ids=A,B,C` at `depth=8` also serves a later `ids=A` or `depth=2` request without a new fetch.
- Screenshots go through `figma_images` (batched via `/v1/images`), never per-frame `get_screenshot` calls. One HTTP call returns signed S3 URLs for every requested node; download the images from S3 in parallel — S3 does not count against the Figma quota.
- On HTTP 429, the helper reads the `X-Figma-Rate-Limit-Type` and `Retry-After` headers:
  - `Retry-After ≤ 300s` → wait and retry (short-term throttle)
  - `Retry-After > 300s` on primary `/v1/files` → **automatically fall back to `/v1/files/{key}/nodes`** (separate rate-limit bucket on the same token). The helper does this transparently and normalizes the response shape so downstream parsers do not need to change.
  - `Retry-After > 300s` on BOTH primary and `/nodes` → **plan quota exhausted** — the helper returns exit code 2 immediately instead of sleeping for hours. New unique fetches will fail until the Figma Professional plan's rolling budget window resets (can be several hours to several days).
- When the plan quota is exhausted on both endpoints, the disk cache is the only source of design data. Design all Stage 2 runs to be cache-friendly from the start.

## How to fetch Figma data

Source the two helpers below at the start of any extraction session:

- `figma_fetch` — node structure/content (`/v1/files`)
- `figma_images` — rendered screenshots in one batched call (`/v1/images`)

Both share the same disk cache, `Retry-After` handling, and quota-exhaustion surfacing.

### The `figma_fetch` helper

```bash
figma_fetch() {
  # Usage: figma_fetch <fileKey> <ids> [depth]
  #   <ids>   single node id ("78:7403") OR comma-separated ("93:15900,93:20741")
  #   [depth] defaults to 8; use 2 for structure discovery
  local FILE_KEY="$1" IDS="$2" DEPTH="${3:-8}"
  local TOKEN=$(grep FIGMA_API_KEY "/Users/admin/Desktop/HolyCode Business Process Refinext/refinext-app/src/e2e/.env" | cut -d= -f2)
  local CACHE_DIR=/tmp/figma-cache
  mkdir -p "$CACHE_DIR"

  # Normalize: dedupe + sort so "A,B" and "B,A" share a cache entry.
  local IDS_SORTED=$(echo "$IDS" | tr ',' '\n' | sort -u | paste -sd, -)
  local IDS_HASH=$(echo -n "$IDS_SORTED" | shasum -a 256 | cut -c1-16)
  local KEY="${FILE_KEY}-${IDS_HASH}-d${DEPTH}"
  local CACHE_FILE="$CACHE_DIR/${KEY}.json"
  local META_FILE="$CACHE_DIR/${KEY}.meta"
  local MAX_AGE=3600  # 1-hour TTL — designs don't change mid-session

  # Exact hit
  if [ -f "$CACHE_FILE" ]; then
    local AGE=$(( $(date +%s) - $(stat -f %m "$CACHE_FILE" 2>/dev/null || stat -c %Y "$CACHE_FILE") ))
    if [ "$AGE" -lt "$MAX_AGE" ]; then
      cat "$CACHE_FILE"
      return 0
    fi
  fi

  # Superset hit: any fresh cache for same fileKey at depth >= DEPTH whose id-set is a
  # superset of the requested set can satisfy this request from disk with zero API cost.
  local SUPERSET_FILE
  SUPERSET_FILE=$(python3 - "$CACHE_DIR" "$FILE_KEY" "$IDS_SORTED" "$DEPTH" "$MAX_AGE" <<'PY' 2>/dev/null
import glob, os, sys, time
cache_dir, file_key, ids_wanted, depth_wanted, max_age = sys.argv[1:]
depth_wanted, max_age = int(depth_wanted), int(max_age)
wanted = set(ids_wanted.split(','))
now, best = time.time(), None
for meta_path in glob.glob(os.path.join(cache_dir, '*.meta')):
    try:
        meta = dict(l.strip().split('=', 1) for l in open(meta_path) if '=' in l)
    except Exception:
        continue
    if meta.get('fileKey') != file_key or meta.get('kind') != 'nodes': continue
    try: d = int(meta.get('depth', '0'))
    except ValueError: continue
    if d < depth_wanted: continue
    cache_path = meta_path[:-5] + '.json'
    if not os.path.exists(cache_path): continue
    if now - os.path.getmtime(cache_path) > max_age: continue
    have = set(meta.get('ids', '').split(','))
    if wanted.issubset(have):
        size = len(have)
        if best is None or size < best[0]:
            best = (size, cache_path)
if best: print(best[1])
PY
)
  if [ -n "$SUPERSET_FILE" ] && [ -f "$SUPERSET_FILE" ]; then
    cat "$SUPERSET_FILE"
    return 0
  fi

  local HDR=/tmp/figma-hdr.$$
  local BODY=""

  # _figma_try_endpoint: attempts one URL up to MAX times, respecting Retry-After ≤ 300s.
  # On success, sets $BODY and returns 0. On short-term error, returns 1. On plan-quota
  # exhaustion (Retry-After > 300s), returns 2. Called for both primary and /nodes.
  _figma_try_endpoint() {
    local URL="$1" LABEL="$2"
    local ATTEMPT=0 MAX=3
    while [ "$ATTEMPT" -lt "$MAX" ]; do
      BODY=$(curl -sD "$HDR" -H "X-Figma-Token: $TOKEN" "$URL")
      local STATUS=$(head -1 "$HDR" | awk '{print $2}')
      if [ "$STATUS" = "200" ]; then
        return 0
      fi
      if [ "$STATUS" = "429" ]; then
        local WAIT=$(grep -i '^retry-after:' "$HDR" | awk '{print $2}' | tr -d '\r')
        WAIT="${WAIT:-10}"
        local TIER=$(grep -i '^x-figma-rate-limit-type:' "$HDR" | awk '{print $2}' | tr -d '\r')
        if [ "$WAIT" -gt 300 ]; then
          echo "figma_fetch: ${LABEL} plan quota exhausted (tier=${TIER:-unknown}, Retry-After=${WAIT}s ≈ $((WAIT/3600))h)" >&2
          return 2
        fi
        echo "figma_fetch: ${LABEL} rate limited (attempt $((ATTEMPT+1))/$MAX), waiting ${WAIT}s" >&2
        sleep "$WAIT"
        ATTEMPT=$((ATTEMPT+1))
        continue
      fi
      echo "figma_fetch: ${LABEL} HTTP $STATUS on $URL" >&2
      echo "$BODY" >&2
      return 1
    done
    echo "figma_fetch: ${LABEL} giving up after $MAX attempts" >&2
    return 1
  }

  # 1. Try primary /v1/files (rich response, includes ancestor chain).
  local PRIMARY_URL="https://api.figma.com/v1/files/${FILE_KEY}?ids=${IDS_SORTED}&depth=${DEPTH}"
  _figma_try_endpoint "$PRIMARY_URL" "primary /v1/files"
  local PRIMARY_RC=$?

  if [ "$PRIMARY_RC" = "0" ]; then
    echo "$BODY" > "$CACHE_FILE"
    cat > "$META_FILE" <<EOF
kind=nodes
fileKey=$FILE_KEY
ids=$IDS_SORTED
depth=$DEPTH
endpoint=files
EOF
    echo "$BODY"
    rm -f "$HDR"
    return 0
  fi

  # 2. Only fall back to /nodes when primary is plan-quota-exhausted. Short-term errors
  #    (network glitch, malformed request) do not warrant burning /nodes budget.
  if [ "$PRIMARY_RC" = "2" ]; then
    echo "figma_fetch: falling back to /v1/files/${FILE_KEY}/nodes (separate rate-limit bucket)" >&2
    local NODES_URL="https://api.figma.com/v1/files/${FILE_KEY}/nodes?ids=${IDS_SORTED}&depth=${DEPTH}"
    _figma_try_endpoint "$NODES_URL" "fallback /nodes"
    local NODES_RC=$?

    if [ "$NODES_RC" = "0" ]; then
      # /nodes returns { "nodes": { "<id>": { "document": {...}, ... } } }.
      # Normalize into the primary shape { "document": { "children": [...] } } so downstream
      # walkers (including the Typical usage snippets below) work unchanged.
      local NORMALIZED
      NORMALIZED=$(echo "$BODY" | python3 -c "
import json, sys
raw = json.loads(sys.stdin.read(), strict=False)
docs = [n.get('document') for n in (raw.get('nodes') or {}).values() if n and n.get('document')]
out = {
    'document': {'id': 'synthetic-root', 'type': 'DOCUMENT', 'children': docs},
    '_figma_source': 'nodes-fallback',
}
print(json.dumps(out, ensure_ascii=False))
")
      if [ -z "$NORMALIZED" ]; then
        echo "figma_fetch: /nodes response could not be normalized" >&2
        rm -f "$HDR"
        return 1
      fi
      echo "$NORMALIZED" > "$CACHE_FILE"
      cat > "$META_FILE" <<EOF
kind=nodes
fileKey=$FILE_KEY
ids=$IDS_SORTED
depth=$DEPTH
endpoint=nodes-fallback
EOF
      echo "$NORMALIZED"
      rm -f "$HDR"
      return 0
    fi

    if [ "$NODES_RC" = "2" ]; then
      echo "figma_fetch: BOTH primary and /nodes are plan-quota-exhausted. Rely on the disk cache for previously-fetched nodes; new unique fetches will fail until Figma's rolling window resets." >&2
      rm -f "$HDR"
      return 2
    fi
    # /nodes returned a short-term error — surface it and give up.
    rm -f "$HDR"
    return 1
  fi

  # Primary short-term error (non-429 or 429 with Retry-After ≤ 300s that ran out of attempts).
  rm -f "$HDR"
  return 1
}
```

### The `figma_images` helper

Batches every node into one `/v1/images` call and returns a JSON map `{ "images": { "nodeId": "https://s3..." } }`. Prefer this over per-frame `get_screenshot` — one HTTP call replaces N.

```bash
figma_images() {
  # Usage: figma_images <fileKey> <ids> [scale] [format]
  #   [scale]  default 1 (1x); use 2 for retina
  #   [format] default png; also svg, jpg, pdf
  local FILE_KEY="$1" IDS="$2" SCALE="${3:-1}" FORMAT="${4:-png}"
  local TOKEN=$(grep FIGMA_API_KEY "/Users/admin/Desktop/HolyCode Business Process Refinext/refinext-app/src/e2e/.env" | cut -d= -f2)
  local CACHE_DIR=/tmp/figma-cache
  mkdir -p "$CACHE_DIR"

  local IDS_SORTED=$(echo "$IDS" | tr ',' '\n' | sort -u | paste -sd, -)
  local IDS_HASH=$(echo -n "$IDS_SORTED" | shasum -a 256 | cut -c1-16)
  local KEY="img-${FILE_KEY}-${IDS_HASH}-s${SCALE}-${FORMAT}"
  local CACHE_FILE="$CACHE_DIR/${KEY}.json"
  local META_FILE="$CACHE_DIR/${KEY}.meta"
  local MAX_AGE=3600  # Figma-issued S3 URLs are short-lived; keep TTL tight

  if [ -f "$CACHE_FILE" ]; then
    local AGE=$(( $(date +%s) - $(stat -f %m "$CACHE_FILE" 2>/dev/null || stat -c %Y "$CACHE_FILE") ))
    if [ "$AGE" -lt "$MAX_AGE" ]; then
      cat "$CACHE_FILE"
      return 0
    fi
  fi

  local HDR=/tmp/figma-hdr.$$
  local BODY=""

  # _figma_images_try_endpoint: attempts one URL up to MAX times, respecting Retry-After ≤ 300s.
  # Mirrors _figma_try_endpoint in figma_fetch for structural consistency. NOTE: /v1/images
  # has NO sibling REST endpoint to fall back to (verified: /v1/images/{key}/nodes → 404).
  # Its rate-limit bucket is independent from /v1/files, but when this bucket is exhausted,
  # the only recourse is the disk cache (short-lived S3 URLs) or waiting for the reset.
  # On success, sets $BODY and returns 0. On short-term error, returns 1. On plan-quota
  # exhaustion (Retry-After > 300s), returns 2.
  _figma_images_try_endpoint() {
    local URL="$1" LABEL="$2"
    local ATTEMPT=0 MAX=3
    while [ "$ATTEMPT" -lt "$MAX" ]; do
      BODY=$(curl -sD "$HDR" -H "X-Figma-Token: $TOKEN" "$URL")
      local STATUS=$(head -1 "$HDR" | awk '{print $2}')
      if [ "$STATUS" = "200" ]; then
        return 0
      fi
      if [ "$STATUS" = "429" ]; then
        local WAIT=$(grep -i '^retry-after:' "$HDR" | awk '{print $2}' | tr -d '\r')
        WAIT="${WAIT:-10}"
        local TIER=$(grep -i '^x-figma-rate-limit-type:' "$HDR" | awk '{print $2}' | tr -d '\r')
        if [ "$WAIT" -gt 300 ]; then
          echo "figma_images: ${LABEL} plan quota exhausted (tier=${TIER:-unknown}, Retry-After=${WAIT}s ≈ $((WAIT/3600))h)" >&2
          return 2
        fi
        echo "figma_images: ${LABEL} rate limited (attempt $((ATTEMPT+1))/$MAX), waiting ${WAIT}s" >&2
        sleep "$WAIT"
        ATTEMPT=$((ATTEMPT+1))
        continue
      fi
      echo "figma_images: ${LABEL} HTTP $STATUS on $URL" >&2
      echo "$BODY" >&2
      return 1
    done
    echo "figma_images: ${LABEL} giving up after $MAX attempts" >&2
    return 1
  }

  local PRIMARY_URL="https://api.figma.com/v1/images/${FILE_KEY}?ids=${IDS_SORTED}&scale=${SCALE}&format=${FORMAT}"
  _figma_images_try_endpoint "$PRIMARY_URL" "/v1/images"
  local RC=$?

  if [ "$RC" = "0" ]; then
    echo "$BODY" > "$CACHE_FILE"
    cat > "$META_FILE" <<EOF
kind=images
fileKey=$FILE_KEY
ids=$IDS_SORTED
scale=$SCALE
format=$FORMAT
endpoint=images
EOF
    echo "$BODY"
    rm -f "$HDR"
    return 0
  fi

  if [ "$RC" = "2" ]; then
    echo "figma_images: no REST fallback available for /v1/images. Rely on the disk cache (if fresh) or defer visual checks until the bucket resets." >&2
    rm -f "$HDR"
    return 2
  fi

  # Short-term error (non-429 or 429 with Retry-After ≤ 300s that ran out of attempts).
  rm -f "$HDR"
  return 1
}
```

### Typical usage — two calls per canvas at most

**Call 1: discover structure at `depth=2` (cheap):**

```bash
figma_fetch 7pygkopuqyeEhUTMVp9lrP 78:7403 2 | python3 -c "
import json, sys
data = json.load(sys.stdin)
def find(n, t):
    if n.get('id') == t: return n
    for c in n.get('children', []):
        r = find(c, t)
        if r: return r
    return None
node = find(data.get('document', {}), '78:7403')
if node:
    print(f'Canvas: {node.get(\"name\")}')
    for c in node.get('children', []):
        print(f'  [{c.get(\"type\")}] {c.get(\"name\")} (id: {c.get(\"id\")})')
"
```

**Call 2: batch-fetch all sections you need in ONE call at `depth=8`:**

```bash
figma_fetch 7pygkopuqyeEhUTMVp9lrP 81:2893,84:5369,84:5370 8 | python3 -c "
import json, sys
data = json.load(sys.stdin)
targets = {'81:2893','84:5369','84:5370'}
def walk(n, current_target=None):
    nid = n.get('id')
    if nid in targets: current_target = nid
    if current_target and n.get('type') == 'TEXT':
        chars = n.get('characters','')
        if chars: print(f'{current_target}: [{n.get(\"name\","")[:30]}] -> \"{chars[:120]}\"')
    for c in n.get('children', []):
        walk(c, current_target)
walk(data.get('document', {}))
"
```

### Fallback endpoint (automatic)

`figma_fetch` handles the `/v1/files/{key}/nodes` fallback transparently. When the primary `/v1/files` endpoint returns 429 with `Retry-After > 300s`, the helper automatically re-issues against `/nodes` (a separate rate-limit bucket on the same token) and normalizes the response.

The raw `/nodes` response shape is `{ "nodes": { "<id>": { "document": {...} } } }`, but the helper rewrites it into the primary-compatible shape `{ "document": { "children": [ ...node.document ] }, "_figma_source": "nodes-fallback" }` before caching and emitting. Downstream walkers (including the "Typical usage" snippets above) work unchanged — check `data.get('_figma_source') == 'nodes-fallback'` if you need to know which endpoint served the request.

Only when BOTH primary and `/nodes` are quota-exhausted does the helper return exit code 2. Do not call `/nodes` manually — the helper is the single entry point.

**`figma_images` does NOT have an equivalent fallback.** `/v1/images` has no sibling REST endpoint (`/v1/images/{key}/nodes` returns 404). Its rate-limit bucket is independent from `/v1/files`, so it will often work when `figma_fetch` is throttled — but when it exhausts, `figma_images` returns exit code 2 with no alternative REST path. Fall back to the disk cache (S3 URLs are short-lived, TTL ~1h) or wait for the bucket reset. The internal try-endpoint helper mirrors `figma_fetch`'s structure only for consistent error semantics.

## What to extract

For every Figma screen or component, extract and organize:

### 1. Text & Labels (verbatim)

All visible strings: headings, field labels, button text, placeholder text, helper text, error messages, links, tooltips.

### 2. UI Components

Every interactive or structural element: inputs, buttons, links, checkboxes, dropdowns, modals, banners, icons. Note component names from Figma where available.

### 3. All States

List every variant visible in the design: default, hover, active/focus, filled, error, disabled, loading. For each state describe what visually changes (border color, text, icons).

### 4. Layout Structure

Describe the hierarchy: page → sections → containers → elements. Note alignment, spacing, and ordering.

### 5. Colors & Typography

Extract color tokens/hex values and font details (family, weight, size) for key elements.

### 6. Playwright-relevant selectors

Based on the design, suggest the best Playwright locators for each interactive element, preferring in order:

- `getByRole` (button, textbox, link, heading, etc.)
- `locator('[data-testid="..."]')` only if explicitly present in the design
- `getByLabel` (for labeled inputs)
- `getByText` (for unique visible text)
- `getByPlaceholder` (for placeholder text)

## Gap detection

Log a `design_gap` entry for:

- Missing error/empty/loading state on a form or interactive component
- Form field with no visible label
- Navigation flow pointing outside the provided file/frame scope

## Output format

Always structure your response as:

1. **Screen summary** — one sentence describing what this screen does
2. **Text strings** — table of all verbatim strings by element type
3. **Components & states** — list each element with its states
4. **Layout** — nested structure description
5. **Colors** — token name → hex value table
6. **Suggested Playwright locators** — ready-to-use locator expressions per element

Do not invent or infer design data. Do not extract content from locked or hidden nodes.
