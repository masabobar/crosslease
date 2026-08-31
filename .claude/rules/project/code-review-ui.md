# Code Review — UI Components (shadcn/ui First)

**Version:** 1.0
**Last Updated:** 2026-07-05
**Status:** Active

Companion to `.claude/rules/project/code-review.md` — holds the full §12 shadcn-first checklist. The main file keeps the per-commit review flow; this file is the component-catalogue reference.

**Principle: shadcn/ui is the default choice for every UI element. Any deviation requires an explicit inline note.**

---

## Checklist

- [ ] **Use a shadcn/ui component whenever one exists** — never reach for a raw HTML element when a `src/components/ui/` primitive is available. Mandatory preference list:
      `<Button>` over `<button>`, `<Input>` over `<input>`, `<Select>` over `<select>`, `<Textarea>` over `<textarea>`, `<Checkbox>`, `<Switch>`, `<RadioGroup>`, `<Label>`, `<Dialog>`, `<AlertDialog>`, `<Sheet>`, `<Drawer>`, `<DropdownMenu>`, `<ContextMenu>`, `<Menubar>`, `<NavigationMenu>`, `<Popover>`, `<Tooltip>`, `<HoverCard>`, `<Accordion>`, `<Collapsible>`, `<Tabs>`, `<Badge>`, `<Card>`, `<Separator>`, `<Avatar>`, `<Table>` / `<TableHeader>` / `<TableBody>` / `<TableRow>` / `<TableCell>`, `<Skeleton>`, `<Progress>`, `<Slider>`, `<ScrollArea>`, `<Calendar>`, `<DatePicker>`, `<Command>`, `<Combobox>`, `<Toast>`, `<Alert>`, `<Form>` / `<FormField>` / `<FormItem>` / `<FormLabel>` / `<FormMessage>`, etc.
- [ ] **When a shadcn component does NOT exist yet** for a needed element: install it via `npx shadcn@latest add <component>` before falling back to a raw element or third-party lib. Do not skip this step.
- [ ] **When a raw HTML element is used instead** of a shadcn primitive — add a mandatory inline comment explaining why:
  ```tsx
  {
    /* NOTE: raw <button> — shadcn Button does not support X because Y */
  }
  ```
  Acceptable reasons: the shadcn component cannot be composed into a parent component's DOM structure (e.g. it renders its own trigger), or a very specific accessibility pattern requires a bare element. "I didn't know shadcn had one" is not a valid reason.
- [ ] **When a third-party UI library component is used** instead of a shadcn equivalent — add a note:
  ```tsx
  {
    /* NOTE: using <ThirdPartyX> — no shadcn equivalent; shadcn/ui does not cover Z pattern */
  }
  ```
- [ ] **When a shadcn component is partially customized** (e.g. via `className` variants) — prefer extending via `cva()` inside the existing `src/components/ui/` file over wrapping it in a new component.
- [ ] Same `<Table>/<tr>/<td>` → `<Table>/<TableRow>/<TableCell>` rule applies; same `<select>` → `<Select>` rule, etc.
- [ ] New interactive elements not yet in shadcn's catalogue are fine as raw HTML — but always leave a comment: `{/* NOTE: no shadcn component for <element type> — consider adding one if reused */}`

---

## Related

- `.claude/rules/project/code-review.md` §12 — entry point; PR checklist row "UI components"
- CLAUDE.md §UI components — the shadcn-first mandate

---

**Status:** ✅ Active
