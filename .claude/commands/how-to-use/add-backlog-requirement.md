# Add Future Backlog Requirement - Quick Guide

**Use when:** Planning features for future versions (not current phases 1-4)
**Command:** `/add-backlog-requirement story|epic` or `--from file.md`
**Time:** 2-3 minutes
**Files affected:** `backlog-future.md` only (NOT active backlog or phases)

**All requirements must be in English only.**

---

## 🎯 Most Common Use Cases

### 1. Add Story for Version 2.0

```bash
/add-backlog-requirement story
```

**What it does:** Adds story to future backlog for post-launch (Version 2.0)
**Example:** Dark mode theme, advanced analytics, social sharing
**When:** Client says "add this for version 2" or "nice to have later"

### 2. Add Epic for Version 3.0

```bash
/add-backlog-requirement epic
```

**What it does:** Adds epic (group of stories) for major future version
**Example:** Mobile app, API v2, internationalization
**When:** Planning major features for distant future

### 3. Add Idea (Unversioned)

```bash
/add-backlog-requirement story
# Then choose: Unversioned
```

**What it does:** Captures idea without committing to specific version
**Example:** Experimental features, research items, maybes
**When:** Collecting ideas during brainstorming

### 4. Import from File

```bash
/add-backlog-requirement story --from future-feature.md
```

**What it does:** Reads requirement from file, adds to future backlog
**Example:** Client sends future requirements document
**When:** Batch importing multiple future requirements

---

## 📝 Quick Steps

### STEP 0: ENTER PLAN MODE

**🎯 MANDATORY: Claude enters plan mode before adding**

1. Claude reads both backlog files (active + future)
2. Determines next US-XXX ID (sequential across both)
3. Shows plan with target version
4. Waits for your approval [Yes/No/Revise]

**Only proceeds after you approve.**

### STEP 1: Provide Information

**Required:**

- Title (short, descriptive)
- Target version (2.0, 3.0, Unversioned)
- Priority (High, Medium, Low)
- Description (user story format)
- Acceptance criteria

**Optional:**

- Story points (1-13, or Claude estimates)
- Epic association
- Notes/dependencies

### STEP 2: Gets US-XXX ID

Claude auto-assigns next sequential ID:

- Checks BOTH backlog.md AND backlog-future.md
- Uses higher max + 1
- Example: If active has US-050, future gets US-051

### STEP 3: Added to Future Backlog

Requirement added to `backlog-future.md`:

- Under correct version section (2.0, 3.0, or Unversioned)
- Status: "Future"
- NOT added to active backlog
- NOT added to any phase

### STEP 4: Done

Requirement tracked in future backlog, can promote later with:

```bash
/promote-requirement US-XXX --to-phase N
```

---

## 🔍 Examples

### Example 1: Version 2.0 Feature

```
You: /add-backlog-requirement story

Claude: [Plan Mode]
        Next ID: US-051
        Proceed? [Yes/No]

You: Yes

Claude: Story title?

You: Dark mode theme support

Claude: Target version?
        [1] 2.0 - Post-launch
        [2] 3.0 - Future
        [3] Unversioned

You: 1

Claude: Priority?
        [1] High  [2] Medium  [3] Low

You: 2

Claude: Description?

You: As a user, I want dark mode so I can reduce eye strain

Claude: Acceptance criteria?

You:
- Theme toggle in settings
- Persist preference
- All pages support dark mode

Claude: Story points: 5 (estimated)
        Accept? [Yes]

You: Yes

Claude: ✅ US-051 ADDED
        - Version 2.0 section
        - Priority: Medium
        - 5 story points
        - Status: Future

        Promote later with:
        /promote-requirement US-051 --to-phase N
```

### Example 2: Version 3.0 Epic

```
You: /add-backlog-requirement epic

Claude: Epic name?

You: Mobile App Launch

Claude: Target version?

You: 3.0

Claude: Priority?

You: High

Claude: Epic goal?

You: Launch native mobile apps for iOS and Android with core features

Claude: Estimated total story points?

You: 80

Claude: ✅ Epic ADDED to Version 3.0
        - Mobile App Launch
        - 80 points estimated
        - High priority
        - Status: Future planning

        Add stories to this epic later
```

---

## ⚠️ Common Issues

| Issue                        | Solution                                                               | Reference                   |
| ---------------------------- | ---------------------------------------------------------------------- | --------------------------- |
| "Which command to use?"      | `/add-scope` for current phases, `/add-backlog-requirement` for future | Quick reference table below |
| "ID collision"               | Command auto-checks both backlog files                                 | Full docs "STEP 2"          |
| Unclear version              | 2.0=post-launch, 3.0=major future, Unversioned=ideas                   | Full docs "STEP 1"          |
| Can't find requirement later | Check `backlog-future.md` not `backlog.md`                             | Different files!            |

---

## 📊 Quick Reference: Which Command?

| Situation                          | Use This Command                                  |
| ---------------------------------- | ------------------------------------------------- |
| Feature needed in Phase 1-4        | `/add-scope add story`                            |
| Bug to fix now or soon             | `/add-bug`                                        |
| Feature for "version 2" or "later" | `/add-backlog-requirement story` ✅               |
| Idea, not ready to commit          | `/add-backlog-requirement story` (Unversioned) ✅ |
| Major future initiative            | `/add-backlog-requirement epic` ✅                |

---

## 🔄 Lifecycle

```
Add to Future → Track in backlog-future.md → Review periodically →
When ready → Promote to active → Add to phase → Develop
```

**Commands:**

1. `/add-backlog-requirement` - Add to future
2. `/promote-requirement US-XXX --to-phase N` - Move to active
3. `/execute-work story US-XXX` - Implement

---

## 💡 Version Guidelines

**Version 2.0 (Post-Launch):**

- Enhancements to existing features
- Quick wins and polish
- User-requested improvements
- Timeline: 1-3 months after launch

**Version 3.0 (Future):**

- Major new features
- Significant architectural changes
- New platforms (mobile, API v2)
- Timeline: 6-12+ months after launch

**Unversioned:**

- Ideas and experiments
- Research needed before committing
- "Maybe someday" features
- No timeline

---

## 📚 Full Documentation

**This is a quick guide (120 lines).**

For complete details, see: [`.claude/commands/add-backlog-requirement.md`](../add-backlog-requirement.md) (~200 lines)

Includes:

- Detailed field descriptions
- Plan mode workflow
- US-XXX ID assignment logic
- File format specifications
- Complete examples
- Promote workflow
