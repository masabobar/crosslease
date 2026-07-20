import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { ONE_SECOND_MS } from "@/lib/constants"

export const REDIRECT_SECONDS = 5

export function useCountdownRedirect(
  isActive: boolean,
  destination: string,
  seconds: number
): number {
  const navigate = useNavigate()
  const [countdown, setCountdown] = useState(seconds)

  useEffect(() => {
    if (!isActive) return
    const id = setInterval(() => {
      setCountdown(c => c - 1)
    }, ONE_SECOND_MS)
    return () => clearInterval(id)
  }, [isActive])

  useEffect(() => {
    if (isActive && countdown <= 0) navigate(destination)
  }, [isActive, countdown, navigate, destination])

  return countdown
}
