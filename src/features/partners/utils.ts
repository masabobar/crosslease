export function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/)
  return `${parts[0]?.charAt(0) ?? ""}${
    parts[parts.length - 1]?.charAt(0) ?? ""
  }`.toUpperCase()
}
