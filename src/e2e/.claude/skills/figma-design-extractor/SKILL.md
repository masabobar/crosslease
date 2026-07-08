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
  - `Retry-After > 300s` → **plan quota exhausted** — the helper returns exit code 2 immediately instead of sleeping for hours. New unique fetches will fail until the Figma Professional plan's rolling budget window resets (can be several hours to several days).
- When the plan quota is exhausted, the disk cache is the only source of design data. Design all Stage 2 runs to be cache-friendly from the start.

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

  local URL="https://api.figma.com/v1/files/${FILE_KEY}?ids=${IDS_SORTED}&depth=${DEPTH}"
  local HDR=/tmp/figma-hdr.$$
  local ATTEMPT=0 MAX=3
  while [ "$ATTEMPT" -lt "$MAX" ]; do
    local BODY=$(curl -sD "$HDR" -H "X-Figma-Token: $TOKEN" "$URL")
    local STATUS=$(head -1 "$HDR" | awk '{print $2}')
    if [ "$STATUS" = "200" ]; then
      echo "$BODY" > "$CACHE_FILE"
      cat > "$META_FILE" <<EOF
kind=nodes
fileKey=$FILE_KEY
ids=$IDS_SORTED
depth=$DEPTH
EOF
      echo "$BODY"
      rm -f "$HDR"
      return 0
    fi
    if [ "$STATUS" = "429" ]; then
      local WAIT=$(grep -i '^retry-after:' "$HDR" | awk '{print $2}' | tr -d '\r')
      WAIT="${WAIT:-10}"
      local TIER=$(grep -i '^x-figma-rate-limit-type:' "$HDR" | awk '{print $2}' | tr -d '\r')
      # If Retry-After exceeds 5 minutes, the token has hit its rolling plan quota (not a
      # short-term rate limit). Do NOT sleep for hours/days — surface the failure now.
      if [ "$WAIT" -gt 300 ]; then
        echo "figma_fetch: PLAN QUOTA EXHAUSTED (tier=${TIER:-unknown}, Retry-After=${WAIT}s ≈ $((WAIT/3600))h). Token is out of budget on the Professional plan — new unique fetches will fail until the rolling window resets. Rely on the disk cache for previously-fetched nodes." >&2
        rm -f "$HDR"
        return 2
      fi
      echo "figma_fetch: rate limited (attempt $((ATTEMPT+1))/$MAX), waiting ${WAIT}s" >&2
      sleep "$WAIT"
      ATTEMPT=$((ATTEMPT+1))
      continue
    fi
    echo "figma_fetch: HTTP $STATUS on $URL" >&2
    echo "$BODY" >&2
    rm -f "$HDR"
    return 1
  done
  echo "figma_fetch: giving up after $MAX attempts" >&2
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

  local URL="https://api.figma.com/v1/images/${FILE_KEY}?ids=${IDS_SORTED}&scale=${SCALE}&format=${FORMAT}"
  local HDR=/tmp/figma-hdr.$$
  local ATTEMPT=0 MAX=3
  while [ "$ATTEMPT" -lt "$MAX" ]; do
    local BODY=$(curl -sD "$HDR" -H "X-Figma-Token: $TOKEN" "$URL")
    local STATUS=$(head -1 "$HDR" | awk '{print $2}')
    if [ "$STATUS" = "200" ]; then
      echo "$BODY" > "$CACHE_FILE"
      cat > "$META_FILE" <<EOF
kind=images
fileKey=$FILE_KEY
ids=$IDS_SORTED
scale=$SCALE
format=$FORMAT
EOF
      echo "$BODY"
      rm -f "$HDR"
      return 0
    fi
    if [ "$STATUS" = "429" ]; then
      local WAIT=$(grep -i '^retry-after:' "$HDR" | awk '{print $2}' | tr -d '\r')
      WAIT="${WAIT:-10}"
      if [ "$WAIT" -gt 300 ]; then
        echo "figma_images: PLAN QUOTA EXHAUSTED (Retry-After=${WAIT}s). Fall back to cached URLs or defer visual checks." >&2
        rm -f "$HDR"
        return 2
      fi
      echo "figma_images: rate limited (attempt $((ATTEMPT+1))/$MAX), waiting ${WAIT}s" >&2
      sleep "$WAIT"
      ATTEMPT=$((ATTEMPT+1))
      continue
    fi
    echo "figma_images: HTTP $STATUS on $URL" >&2
    echo "$BODY" >&2
    rm -f "$HDR"
    return 1
  done
  echo "figma_images: giving up after $MAX attempts" >&2
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

### Fallback endpoint

If `/v1/files/{key}?ids=...&depth=...` returns an unrecoverable error, fall back to `/v1/files/{key}/nodes?ids=<nodeId>&depth=8`. Same response shape under a `nodes[<nodeId>].document` key. Strict per-token rate limit — use sparingly.

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
