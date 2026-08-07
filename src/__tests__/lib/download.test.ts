import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { downloadBlob } from "@/lib/download"

// Vitest runs in the node environment here, so the three browser APIs the helper touches are
// stubbed rather than mocked over a real DOM. The assertions are about the sequence the
// browser needs — create URL, set href/download, click, revoke — which is the whole contract.
const OBJECT_URL = "blob:mock-object-url"

let createObjectURL: ReturnType<typeof vi.fn>
let revokeObjectURL: ReturnType<typeof vi.fn>
let click: ReturnType<typeof vi.fn>
let link: { href: string; download: string; click: typeof click }

beforeEach(() => {
  createObjectURL = vi.fn(() => OBJECT_URL)
  revokeObjectURL = vi.fn()
  click = vi.fn()
  link = { href: "", download: "", click }

  vi.stubGlobal("URL", { createObjectURL, revokeObjectURL })
  vi.stubGlobal("document", { createElement: vi.fn(() => link) })
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe("downloadBlob", () => {
  it("points an anchor at the blob and clicks it", () => {
    const blob = new Blob(["id,name\n1,Ana"], { type: "text/csv" })

    downloadBlob(blob, "framework-agreements.csv")

    expect(createObjectURL).toHaveBeenCalledWith(blob)
    expect(link.href).toBe(OBJECT_URL)
    expect(link.download).toBe("framework-agreements.csv")
    expect(click).toHaveBeenCalledOnce()
  })

  it("revokes the object URL so it does not leak for the document's lifetime", () => {
    downloadBlob(new Blob(["x"]), "export.csv")

    expect(revokeObjectURL).toHaveBeenCalledWith(OBJECT_URL)
  })

  // Revoking before the click would cancel the download.
  it("clicks before revoking", () => {
    const order: string[] = []
    click.mockImplementation(() => order.push("click"))
    revokeObjectURL.mockImplementation(() => order.push("revoke"))

    downloadBlob(new Blob(["x"]), "export.csv")

    expect(order).toEqual(["click", "revoke"])
  })
})
