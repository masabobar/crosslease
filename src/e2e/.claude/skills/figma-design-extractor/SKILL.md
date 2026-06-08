---
name: figma-design-extractor
description: "Use this skill to extract structured design data from Figma files. Invoke when the qa-lead pipeline reaches Stage 2 and needs design data for comparison against story requirementS and when given a Figma URL to extract UI elements, screen names, component hierarchy, interactive states (default, hover, error, empty, loading, disabled), copy and labels, form fields, and navigation flows for each linked Figma frame. Detects design gaps such as missing error states or unlabelled form fields. Returns a normalized design object with extraction_status SUCCESS, PARTIAL, or FAILED."
allowed-tools: mcp__plugin_figma_figma__get_design_context, mcp__plugin_figma_figma__get_screenshot, mcp__plugin_figma_figma__get_metadata, mcp__plugin_figma_figma__get_variable_defs, mcp__plugin_figma_figma__get_libraries, mcp__plugin_figma_figma__whoami, TaskCreate, TaskUpdate, Read
model: sonnet
---

## Invocation

Use Figma REST API approach as the primary extraction method. Use `mcp__plugin_figma_figma__get_screenshot` only as supplementary.

## Extraction steps

1. Parse `figma_urls` → extract `fileKey` and `node-id` from each URL (convert `-` to `:` in node-id)
2. Call `get_design_context` for each linked frame
3. For each frame extract: screen name, component list, visible copy/labels, form fields with labels and placeholders, prototype navigation flows
4. For each interactive component, check presence of: default, hover, error, empty, loading, disabled states
5. Detect and log design gaps (see below)

## How to fetch Figma data

### Step 1 — Get the API key

```bash
cat /Users/admin/Desktop/PLAYWRIGHT-FIGMA/.mcp.json | python3 -c "import json,sys; print(json.load(sys.stdin)['mcpServers']['figma']['env']['FIGMA_API_KEY'])"
```

### Step 2 — Fetch the node tree

```bash
TOKEN="<API_KEY_FROM_STEP_1>"
curl -s -H "X-Figma-Token: $TOKEN" \
  "https://api.figma.com/v1/files/<fileKey>/nodes?ids=<nodeId>&depth=8" \
  | python3 -c "
import json, sys
data = json.load(sys.stdin)
if 'err' in data:
    print('ERROR:', data['err'])
    sys.exit(1)
nodes = data.get('nodes', {})
for node_id, node_data in nodes.items():
    doc = node_data.get('document', {})
    def print_tree(n, indent=0):
        name = n.get('name', '')
        ntype = n.get('type', '')
        chars = n.get('characters', '')
        fills = n.get('fills', [])
        color_info = ''
        if fills and fills[0].get('type') == 'SOLID':
            c = fills[0].get('color', {})
            r,g,b = int(c.get('r',0)*255), int(c.get('g',0)*255), int(c.get('b',0)*255)
            color_info = f' [#{r:02x}{g:02x}{b:02x}]'
        line = '  '*indent + f'[{ntype}] {name}{color_info}'
        if chars:
            line += f' -> \"{chars[:120]}\"'
        print(line)
        for child in n.get('children', []):
            print_tree(child, indent+1)
    print_tree(doc)
"
```

If you need to drill into a specific child node, call the API again with that child's `id` as the `ids` parameter.

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
