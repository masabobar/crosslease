# Run Tests — Report Formats

Companion to `run-tests-reporting.md`. Holds the concrete report blocks emitted by `/run-tests` — success, failure, missing required tests, missing error-code i18n keys, quality-gate summary.

---

## Success Report (all checks passing)

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🧪 TEST RESULTS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 SUMMARY:
✅ Unit Tests:   45/45 passed
✅ Type Check:   clean
✅ Lint:         clean
⏱  Duration:    4.2s

✅ ALL CHECKS PASSED

✅ QUALITY GATES:
- Required Tests:   ✅ new schemas / stores / utils covered
- Error-Code Keys:  ✅ all consumed codes have errors.<CODE> (en + de)

🎯 READY TO COMMIT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## Failure Report (some tests failing)

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🧪 TEST RESULTS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 SUMMARY:
⚠️  Unit Tests:   43/45 passed (2 failed)
✅ Type Check:   clean
✅ Lint:         clean
⏱  Duration:    4.2s

❌ FAILED TESTS (2):

1. PartnerSchema — rejects unknown partner_type
   File:  src/__tests__/features/partners/api/schema.test.ts:45
   Error: expected parse to throw, but it succeeded

2. authStore — clears tokens on logout
   File:  src/__tests__/store/authStore.test.ts:78
   Error: AssertionError: expected "acc" to be null

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

💡 RECOMMENDATIONS:

1. PartnerSchema (line 45)
   → Schema likely widened to z.string() — restore the enum

2. authStore.clearTokens (line 78)
   → Check the action resets accessToken, not just refreshToken

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🔧 NEXT STEPS:
1. Fix failed tests above
2. Re-run: /run-tests all
3. Verify all pass before committing
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## Missing Required Tests

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚠️  REQUIRED TESTS MISSING
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Checked the diff against src/__tests__/ (per .claude/rules/testing.md):

❌ src/features/partners/api/schema.ts
   New PartnerSchema — no rejection tests (wrong types, bad enum values)
   Impact: HIGH — API contract unguarded

❌ src/lib/formatIban.ts
   New utility — no unit tests
   Impact: MEDIUM

✅ src/store/partnerFilterStore.ts
   Covered by src/__tests__/store/partnerFilterStore.test.ts

🔧 REQUIRED ACTIONS:
1. Add schema rejection tests (priority: HIGH)
2. Add formatIban edge-case tests (priority: MEDIUM)

❌ CANNOT MARK STORY COMPLETE UNTIL REQUIRED TESTS EXIST
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## Error-Code i18n Keys Missing

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚠️  ERROR-CODE I18N KEYS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Endpoints consumed by this change (from openapi.json):

✅ GET /api/v1/partners
   All documented codes have errors.<CODE> keys (en + de)

❌ POST /api/v1/partners
   ✅ VALIDATION_ERROR, FORBIDDEN
   ❌ CONFLICT_PARTNER_EXISTS — missing in en/partners.json and de/partners.json

💡 ADD THESE KEYS (both locales):
- errors.CONFLICT_PARTNER_EXISTS

The dynamic lookup (t(`errors.${err.code}`, { defaultValue })) handles display —
no code change needed, only the keys. See .claude/rules/api-error-display.md.

❌ CANNOT MARK STORY COMPLETE UNTIL ALL CONSUMED CODES HAVE KEYS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## Quality-Gate Summary (final block)

### Ready to commit

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ QUALITY GATES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

All Tests:        ✅ 45/45 passing
Required Tests:   ✅ new schemas / stores / utils covered
Error-Code Keys:  ✅ complete (en + de)
Type Check:       ✅ clean
Lint:             ✅ clean

🎯 READY TO COMMIT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### Not ready

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚠️ QUALITY GATES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

All Tests:        ❌ 43/45 passing (2 failed)
Required Tests:   ⚠️ PartnerSchema rejection tests missing
Error-Code Keys:  ❌ 1 missing (CONFLICT_PARTNER_EXISTS)
Type Check:       ✅ clean
Lint:             ✅ clean

❌ NOT READY — fix above before committing
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

**Version:** 3.4.0
**Last Updated:** 2026-07-05 (FE adaptation — coverage/integration/E2E blocks replaced with required-tests + error-code-key blocks)
**Parent:** `run-tests-reporting.md`
