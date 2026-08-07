/**
 * Saves a Blob to the user's downloads as `fileName`.
 *
 * The CSV export endpoints return a blob rather than the JSON envelope, so there is no
 * navigable URL to hand the browser — the object URL has to be created, clicked and revoked
 * by hand. Extracted because three call sites had grown their own copy of that sequence
 * (the FA list export, the FA audit-history export, and the user export).
 *
 * Revoking synchronously after `click()` is safe: the click dispatches the download
 * navigation before the call returns, and holding the URL any longer leaks it for the
 * lifetime of the document.
 */
export function downloadBlob(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = fileName
  link.click()
  URL.revokeObjectURL(url)
}
