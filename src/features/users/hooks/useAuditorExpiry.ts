import { useEffect, useState } from "react"
import { useCurrentUser } from "@/features/users/hooks/useCurrentUser"
import { AUDITOR_ROLE } from "@/features/users/types"
import { HOUR_MS, ONE_SECOND_MS } from "@/lib/constants"

export type ExpiryLevel = "none" | "warning" | "danger"

export type ExpiryState =
  | { level: "none" }
  | { level: "warning"; expiresAt: Date }
  | { level: "danger"; expiresAt: Date; secondsRemaining: number }

const ONE_DAY_MS = 24 * HOUR_MS

export function computeExpiryLevel(msRemaining: number): ExpiryLevel {
  if (msRemaining <= 0) return "none"
  if (msRemaining <= HOUR_MS) return "danger"
  if (msRemaining <= ONE_DAY_MS) return "warning"
  return "none"
}

export function formatCountdown(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600)
  const m = Math.floor((totalSeconds % 3600) / 60)
  const s = totalSeconds % 60
  return [h, m, s].map(n => String(n).padStart(2, "0")).join(":")
}

export function useAuditorExpiry(): ExpiryState {
  const { data: currentUser } = useCurrentUser()
  const [now, setNow] = useState(() => Date.now())

  const expiresAt =
    currentUser?.role === AUDITOR_ROLE && currentUser.access_valid_until
      ? new Date(currentUser.access_valid_until)
      : null

  const msRemaining = expiresAt ? expiresAt.getTime() - now : null
  const level = msRemaining !== null ? computeExpiryLevel(msRemaining) : "none"

  useEffect(() => {
    if (level === "none") return
    const id = setInterval(() => setNow(Date.now()), ONE_SECOND_MS)
    return () => clearInterval(id)
  }, [level])

  if (level === "none" || msRemaining === null || expiresAt === null) {
    return { level: "none" }
  }

  if (level === "warning") {
    return { level: "warning", expiresAt }
  }

  return {
    level: "danger",
    expiresAt,
    secondsRemaining: Math.max(0, Math.floor(msRemaining / 1000)),
  }
}
