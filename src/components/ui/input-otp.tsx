import { useRef, type ClipboardEvent, type KeyboardEvent } from "react"
import { cn } from "@/lib/utils"

type InputOTPProps = {
  value: string
  onChange: (value: string) => void
  length?: number
  hasError?: boolean
  disabled?: boolean
  autoFocus?: boolean
}

function InputOTP({
  value,
  onChange,
  length = 6,
  hasError = false,
  disabled = false,
  autoFocus = false,
}: InputOTPProps) {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  const chars = Array.from({ length }, (_, i) => value[i] ?? "")

  const focusAt = (index: number) => {
    inputRefs.current[Math.min(Math.max(index, 0), length - 1)]?.focus()
  }

  const handleChange = (index: number, inputValue: string) => {
    const digit = inputValue.replace(/\D/g, "").slice(-1)
    if (!digit) return
    const newValue = (
      value.slice(0, index) +
      digit +
      value.slice(index + 1)
    ).slice(0, length)
    onChange(newValue)
    if (index < length - 1) focusAt(index + 1)
  }

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      e.preventDefault()
      if (chars[index] !== "") {
        onChange(value.slice(0, index) + value.slice(index + 1))
        if (index > 0) focusAt(index - 1)
      } else if (index > 0) {
        onChange(value.slice(0, index - 1) + value.slice(index))
        focusAt(index - 1)
      }
    } else if (e.key === "ArrowLeft") {
      e.preventDefault()
      focusAt(index - 1)
    } else if (e.key === "ArrowRight") {
      e.preventDefault()
      focusAt(index + 1)
    }
  }

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault()
    const pasted = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, length)
    onChange(pasted)
    focusAt(Math.min(pasted.length, length - 1))
  }

  const handleFocus = (index: number) => {
    const firstEmpty = chars.findIndex(c => c === "")
    if (firstEmpty !== -1 && index > firstEmpty) {
      focusAt(firstEmpty)
    }
  }

  return (
    <div className="flex w-full" data-testid="otp-input">
      {chars.map((char, i) => (
        <input
          key={i}
          ref={el => {
            inputRefs.current[i] = el
          }}
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={2}
          value={char}
          autoFocus={autoFocus && i === 0}
          disabled={disabled}
          data-testid={`otp-input-${i}`}
          onChange={e => handleChange(i, e.target.value)}
          onKeyDown={e => handleKeyDown(i, e)}
          onPaste={handlePaste}
          onFocus={() => handleFocus(i)}
          className={cn(
            "flex-1 min-w-0 h-16 text-center text-base bg-card",
            "focus:outline-none focus:z-10 relative transition-colors",
            i === 0
              ? "border rounded-l-[10px]"
              : i === length - 1
                ? "border-y border-r rounded-r-[10px]"
                : "border-y border-r",
            hasError
              ? "border-destructive text-destructive"
              : "border-input text-foreground focus:border-primary",
            disabled && "opacity-50 cursor-not-allowed"
          )}
        />
      ))}
    </div>
  )
}

export { InputOTP }
