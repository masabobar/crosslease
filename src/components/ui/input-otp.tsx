import * as React from "react"
import { OTPInput, OTPInputContext } from "input-otp"
import { MinusIcon } from "lucide-react"
import { cn } from "@/lib/utils"

// ─── Shadcn composable exports ────────────────────────────────────────────────

function InputOTPRoot({
  className,
  containerClassName,
  ...props
}: React.ComponentProps<typeof OTPInput> & { containerClassName?: string }) {
  return (
    <OTPInput
      data-slot="input-otp"
      containerClassName={cn(
        "cn-input-otp flex items-center has-disabled:opacity-50",
        containerClassName
      )}
      spellCheck={false}
      className={cn("disabled:cursor-not-allowed", className)}
      {...props}
    />
  )
}

function InputOTPGroup({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="input-otp-group"
      className={cn(
        "flex items-center rounded-[10px] has-aria-invalid:border-destructive has-aria-invalid:ring-3 has-aria-invalid:ring-destructive/20 dark:has-aria-invalid:ring-destructive/40",
        className
      )}
      {...props}
    />
  )
}

function InputOTPSlot({
  index,
  className,
  ...props
}: React.ComponentProps<"div"> & { index: number }) {
  const inputOTPContext = React.useContext(OTPInputContext)
  const { char, hasFakeCaret, isActive } = inputOTPContext?.slots[index] ?? {}

  return (
    <div
      data-slot="input-otp-slot"
      data-active={isActive}
      className={cn(
        "relative flex size-8 items-center justify-center border-y border-r border-input text-sm transition-all outline-none first:rounded-l-[10px] first:border-l last:rounded-r-[10px] aria-invalid:border-destructive data-[active=true]:z-10 data-[active=true]:border-ring data-[active=true]:ring-3 data-[active=true]:ring-ring/50 data-[active=true]:aria-invalid:border-destructive data-[active=true]:aria-invalid:ring-destructive/20 dark:bg-input/30 dark:data-[active=true]:aria-invalid:ring-destructive/40",
        className
      )}
      {...props}
    >
      {char}
      {hasFakeCaret && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="h-4 w-px animate-caret-blink bg-foreground duration-1000" />
        </div>
      )}
    </div>
  )
}

function InputOTPSeparator({ ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="input-otp-separator"
      className="flex items-center [&_svg:not([class*='size-'])]:size-4"
      role="separator"
      {...props}
    >
      <MinusIcon />
    </div>
  )
}

export { InputOTPRoot, InputOTPGroup, InputOTPSlot, InputOTPSeparator }

// ─── InputOTP: convenience wrapper preserving existing API ────────────────────

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
  return (
    <InputOTPRoot
      maxLength={length}
      value={value}
      onChange={onChange}
      disabled={disabled}
      autoFocus={autoFocus}
      containerClassName="w-full"
    >
      <InputOTPGroup className="w-full">
        {Array.from({ length }, (_, i) => (
          <InputOTPSlot
            key={i}
            index={i}
            data-testid={`otp-input-${i}`}
            className={cn(
              "flex-1 h-16 text-xl bg-card",
              hasError && "aria-invalid:border-destructive"
            )}
            aria-invalid={hasError || undefined}
          />
        ))}
      </InputOTPGroup>
    </InputOTPRoot>
  )
}

export { InputOTP }
