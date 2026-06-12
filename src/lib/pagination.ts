const MAX_VISIBLE_PAGE_NUMBERS = 5

export function buildPageNumbers(
  currentPage: number,
  totalPages: number
): Array<number | "..."> {
  if (totalPages <= MAX_VISIBLE_PAGE_NUMBERS) {
    return Array.from({ length: totalPages }, (_, i) => i + 1)
  }

  const pages = new Set<number>([1, totalPages, currentPage])
  if (currentPage > 1) pages.add(currentPage - 1)
  if (currentPage < totalPages) pages.add(currentPage + 1)

  const sorted = Array.from(pages).sort((a, b) => a - b)
  const result: Array<number | "..."> = []

  for (let i = 0; i < sorted.length; i++) {
    if (i > 0 && sorted[i] - sorted[i - 1] > 1) {
      result.push("...")
    }
    result.push(sorted[i])
  }

  return result
}
