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
      setCountdown(c => {
        if (c <= 1) navigate(destination)
        return c - 1
      })
    }, ONE_SECOND_MS)
    return () => clearInterval(id)
  }, [isActive, navigate, destination])

  return countdown
}
