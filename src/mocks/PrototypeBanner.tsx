import { useTranslation } from "react-i18next"

/**
 * PROTOTYPE MOCK — see .claude/rules/project/prototype-mode.md
 *
 * A permanent, unmissable marker that the data on screen is fabricated.
 *
 * ── WHY THIS EXISTS ────────────────────────────────────────────────────────────────────────
 * The mock layer used to be double-guarded, the outer guard being `import.meta.env.DEV` — which is
 * statically false in a production build, so a deployed app could not serve mocks even if the env
 * var was set. That guard was removed on request so a deployed prototype could be shared.
 *
 * With the structural guard gone, this banner IS the remaining safeguard. `api-first.md` §4's
 * objection to fake UI is that "the delta between 'looks done' and 'is done' becomes invisible" —
 * and a fully-mocked deploy behind a URL containing the word *production* is the sharpest possible
 * form of that. Making the fakeness visible on every screen is what keeps the deploy honest.
 *
 * Do not make this dismissible, and do not hide it on any route. If it is in the way of reviewing a
 * screen, the fix is to turn the mock layer off, not to hide the sign that it is on.
 *
 * The label goes through `t()` per CLAUDE.md, but carries an English `defaultValue` so a missing
 * translation key degrades to correct text rather than to an unrendered key — this is the one string
 * in the app that must never fail to appear.
 */
export function PrototypeBanner() {
  const { t } = useTranslation("common")

  return (
    <div
      role="status"
      data-testid="prototype-mock-banner"
      className="sticky top-0 z-50 flex items-center justify-center gap-2 bg-amber-500 px-4 py-1.5 text-center text-xs font-semibold text-amber-950"
    >
      <span aria-hidden="true">⚠</span>
      <span>
        {t("prototype.banner", {
          defaultValue:
            "Prototype — all data on this screen is mocked. Nothing is saved and nothing is real.",
        })}
      </span>
    </div>
  )
}
