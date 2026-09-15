"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

function Label({
  className,
  error,
  ...props
}: React.ComponentProps<"label"> & { error?: boolean }) {
  return (
    <label
      data-slot="label"
      className={cn(
        "flex items-center gap-2 text-sm leading-none font-medium select-none group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-50 peer-disabled:cursor-not-allowed peer-disabled:opacity-50",
        error && "text-destructive",
        className
      )}
      {...props}
    />
  )
}

/**
 * The `*` / `(optional)` marker the click dummy puts on every field label.
 *
 * It is a component rather than two strings appended by each caller so the whole modal marks
 * required-ness the same way — the dummy is consistent about it, and a form where some fields are
 * marked and others are not reads as a form where the unmarked ones are optional.
 *
 * `requirement` takes the label's own word for it: a field is `required` or `optional`, never
 * neither. Callers that genuinely cannot say simply do not render one.
 */
function FieldRequirement({
  requirement,
  optionalLabel,
}: {
  requirement: "required" | "optional"
  /** The translated word for "optional" — this primitive does not read i18n itself. */
  optionalLabel: string
}) {
  if (requirement === "required") {
    return (
      <span aria-hidden className="text-primary">
        *
      </span>
    )
  }
  return (
    <span className="font-normal text-muted-foreground">({optionalLabel})</span>
  )
}

export { Label, FieldRequirement }
