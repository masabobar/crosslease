---
layer: shared
---

# Branching Model & Pull Request Flow

**Version:** 1.0
**Status:** Active

Defines the branching strategy (GitHub Flow), branch naming, PR conventions, merge strategy, release tagging, and the branch-protection baseline. Commit-message rules live in `git.md` — this file governs everything between "commit" and "merged to main".

---

## 1. Default Branch

- The default branch is **`main`** — it is the single source of truth and must always be releasable.
- **Releasable ≠ released:** merging to `main` is not a production event — production promotion happens via release tags (§7).
- ❌ NEVER commit directly to `main`
- ❌ NEVER force-push or delete `main`
- ✅ ALL changes reach `main` through a pull request

---

## 2. Branch Naming

Format: `<type>/<kebab-case-descriptor>` — optional ticket ID after the type.

| Type | Use for | Example |
|------|---------|---------|
| `feature/` (or `feat/`) | New functionality | `feature/user-authentication` |
| `fix/` | Bug fixes | `fix/login-redirect-loop` |
| `hotfix/` | Urgent production fixes | `hotfix/payment-timeout` |
| `docs/` | Documentation-only changes | `docs/api-usage-guide` |
| `refactor/` | Code restructuring, no behavior change | `refactor/extract-auth-service` |
| `test/` | Test additions / fixes only | `test/order-service-coverage` |
| `chore/` | Tooling, deps, maintenance | `chore/upgrade-prisma` |
| `release/` | Batching a large release (optional, see §7) | `release/v4.0` |

With a ticket ID: `feature/PROJ-123-user-login`.

- ✅ Lowercase kebab-case descriptor, short but meaningful
- ❌ NO personal names (`milos-stuff`), no bare tickets (`PROJ-123`), no `wip`

---

## 3. Flow (GitHub Flow)

```
main ──●──────●──────────●──→
        \            /
         ●──●──●──●          feature/x  (PR → squash merge → branch deleted)
```

1. **Branch off fresh `main`:** `git checkout main && git pull && git checkout -b feature/<name>`
2. **Commit small and often** — follow `git.md` (conventional commits, no AI credits)
3. **Push early, open a PR** — mark as **Draft** while work is in progress
4. **Pass the PR gate** (§4): CI green + at least 1 approval + all conversations resolved
5. **Squash merge** — the branch is deleted automatically after merge
6. **Never long-lived:** target a branch lifetime of days, not weeks; rebase on `main` if it falls behind

---

## 4. Pull Request Conventions

- **Title:** conventional-commit format (`feat: add user login`) — it becomes the squash-commit subject on `main`
- **Description:** English only (see `documentation.md` §1.1); explain WHY, link the story / epic / Jira ticket
- **Size:** target ≤ ~400 changed lines; split larger work into stacked or sequential PRs
- **Gate to merge (all required):**
  - [ ] CI status checks green — green means CI ran the mandatory contents from `testing.md` → "What CI Must Run" (install → lint → typecheck → tests → coverage floors → E2E); PR and main-push runs may scope suites to AFFECTED areas (the template's `changes` job — unknown paths fail safe to run-everything); `merge_group` and tag (`v*`) runs are always full-repo; a pipeline that runs less does not satisfy this gate
  - [ ] With a merge queue, the authoritative pass is the `merge_group` run on the merge candidate (PR runs use per-ref concurrency and may be cancelled by newer pushes). Docs-only PRs (diff limited to `*.md` / `.project-management/**` / `docs/**`) satisfy the check via the passing `docs-only` status from the paths-filter job. Locally, the branch state that opens/updates the PR must carry a **Story Gate** pass (affected workspaces, dependency-aware) — the CI PR run is the authoritative gate on the final state; only repos WITHOUT a CI pipeline implementing "What CI Must Run" fall back to a local Full Gate pass. *No code merges without a green CI gate on its final state; full-repo runs are mandatory on release tags and `merge_group`.* (`testing.md` → Tiered Full-Suite Gate)
  - [ ] ≥ 1 approving review (stale approvals are dismissed on new commits)
  - [ ] All review conversations resolved
  - [ ] CHANGELOG / docs updated when the change warrants it
- ❌ NO AI credits in PR titles or descriptions (same rule as commits — `git.md`)
- ❌ NO merging your own PR without any review (exception: solo repos where protection allows it)

---

## 5. Merge Strategy

- **Default: squash merge** — one clean conventional commit per PR, linear `main` history
- Merge commits are reserved for `release/*` → `main` integration (preserves the batch)
- ❌ NEVER rebase-merge or force-push shared branches others may have pulled
- ✅ Delete the source branch after merge (enable auto-delete on the platform)

---

## 6. Hotfix Flow

1. Branch `hotfix/<name>` directly off `main`
2. Minimal, surgical change + test proving the fix
3. Expedited PR: same protection applies (CI + 1 approval), reviewed with priority
4. After merge, tag a patch release **and create the platform release** if the project versions releases (§7)

---

## 7. Releases

- **Release = annotated tag on `main` + a platform release created from it.** A tag alone is NOT a complete release — both steps are MANDATORY:
  1. **Tag:** `git tag -a vX.Y.Z -m "Release vX.Y.Z" && git push origin vX.Y.Z`
  2. **Platform release** (GitHub Releases or the platform's equivalent) created from that tag, in the same sitting:
     - **Title:** `vX.Y.Z — <one-line summary>` (mirror the release PR / CHANGELOG heading)
     - **Notes = that version's `CHANGELOG.md` section, extracted verbatim** — the CHANGELOG is the single source of truth; never rewrite or summarize it into different notes

     ```bash
     # notes come straight from CHANGELOG.md — extract the [X.Y.Z] section and publish
     awk -v ver="X.Y.Z" '$0 ~ "^## \\[" ver "\\]" {f=1; next} f && /^## \[/ {exit} f' CHANGELOG.md \
       | gh release create vX.Y.Z --verify-tag --title "vX.Y.Z — <one-line summary>" --notes-file -
     ```
- **Why both:** production deploys trigger on the tag (§ Environments), but the Releases page is the human-readable history stakeholders and teammates actually browse — tags without releases read as an unmaintained project. If tags exist without releases (legacy drift), backfill them from their CHANGELOG sections the same way
- The release PR bumps the version + updates `CHANGELOG.md` **in the same PR** (see `api-versioning.md` §5 for the same-PR propagation principle). **Never sweep the release version across other docs** — it lives in a single source of truth plus a minimal set of mirrors, never scattered. (This framework repo's exact three-file convention and the `/audit-pm` §C check that enforces it are defined once in `documentation.md` §3.2.)
- **`release/vX.Y` branch is optional** — only for batching many features into one large release; feature PRs then target the release branch, and the release branch merges to `main` via its own PR
- Semantic versioning: MAJOR (breaking) / MINOR (feature) / PATCH (fix)

### Environments & deployment

Environments follow **artifacts** (PRs, merges, tags) — never long-lived branches. Three servers ≠ three branches:

> The environment↔trigger wiring (which branch/tag each server watches) is configured **once** by the deploy-platform admin. Day-to-day, developers interact only through git — open PR / merge / tag — and need **no deploy-platform access**: preview URLs arrive as PR comments, and the production deploy token lives in CI secrets.

```
feature/x ──PR opened──▶ DEV        (ephemeral preview deploy per PR)
     │
     └──PR merged──▶ main ──auto──▶ STAGING
                       │
                       └── tag vX.Y.Z ──deploy──▶ PRODUCTION
```

- **Dev server = PR preview deploys** — each open PR gets an ephemeral deploy of its feature branch (Railway PR deploys, Vercel previews, …), torn down on merge/close. Nothing is pushed to a shared branch just to "see it on dev". If the tooling lacks preview support, dev tracks `main` alongside staging
- **Staging = every merge to `main`** — the merge gate (§4) is the quality bar, staging is the soak / demo / E2E environment
- **Production = the release tag** (`vX.Y.Z`), never a branch head — promotion is an explicit decision; rollback = redeploy the previous tag; the same build artifact travels dev → staging → production
- Hotfixes follow the same single path: `hotfix/*` → `main` → patch tag → production (§6) — no second branch to back-merge
- ❌ **NO permanent `develop` / `dev` integration branch.** It drifts from `main`, doubles hotfix work (back-merge risk), and turns integration into a big-bang merge. For batching a large release use `release/vX.Y` (above). A standing exception (strict QA soak cycles, multiple supported parallel versions) requires a documented reason in the project's `.project-management/rules/project-rules.md`

**Fallback — environment-pointer branches (ONLY when deploy tooling cannot trigger on tags):** `staging` / `production` branches promoted `main → staging → production` by **merge-only, fast-forward** updates. ❌ No direct commits, ❌ no PRs target them, ❌ never branch off them. They receive code exclusively from `main`'s history — that is what makes them safe deployment pointers, not a `develop`-style integration branch (no drift, no back-merge)

---

## 8. Branch Protection Baseline

Configure on the hosting platform (GitHub / GitLab / Bitbucket) for `main` — and for `release/*` while active:

- [ ] Require a pull request before merging
- [ ] Require ≥ 1 approving review
- [ ] Dismiss stale approvals when new commits are pushed
- [ ] **Primary: require merge queue** — the queue re-runs the full CI suite — always full-repo, never affected-scoped — on the merge candidate via the `merge_group` trigger (`ci-workflow-template.yml`); this is what makes two individually-green PRs safe to land back-to-back. With the queue active, "require branches to be up to date" is redundant and should be OFF (it serializes PRs without the queue's batching)
- [ ] **Fallback (plan/platform without merge queue): require status checks to pass (CI) AND branches to be up to date before merging** — strict up-to-date forces the second PR to rebase + re-run CI on the combined state, substituting the queue's merge-candidate re-run; note the PR re-run is affected-scoped — without a merge queue, the full-repo safety net is the release-tag (`v*`) run
- [ ] Require conversation resolution before merging
- [ ] Block force pushes and branch deletion
- [ ] Auto-delete head branches after merge (repo setting)

---

## 9. `master` → `main` Transition (existing clones)

When a repo's default branch is renamed on the platform, every local clone runs once:

```bash
git branch -m master main
git fetch origin
git branch -u origin/main main
git remote set-head origin -a
```

---

## Related

- [`git.md`](git.md) — Commit message format, NO AI credits, commit workflow
- [`api-versioning.md`](api-versioning.md) — Same-PR change-propagation gate for API changes
- [`documentation.md`](documentation.md) — English-only rule for PR descriptions
- [`testing.md`](testing.md) — What CI must run before a PR can merge