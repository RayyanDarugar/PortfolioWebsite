/** Pure: imported by the client spread, so it must not share a module with `fs`. */
/** Splits a review into pages of about `budget` characters, never inside a paragraph. */
export function reviewPages(review: string[], budget = 520): string[][] {
  const pages: string[][] = [[]]
  let used = 0
  for (const p of review) {
    if (used > 0 && used + p.length > budget) { pages.push([]); used = 0 }
    pages[pages.length - 1].push(p)
    used += p.length
  }
  return pages
}
