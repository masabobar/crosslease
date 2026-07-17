import { vi, describe, it, expect, beforeEach } from "vitest"

vi.mock("sonner", () => {
  const base = vi.fn(() => "default-id")
  return {
    toast: Object.assign(base, {
      info: vi.fn(() => "info-id"),
      success: vi.fn(() => "success-id"),
      warning: vi.fn(() => "warning-id"),
      error: vi.fn(() => "error-id"),
      dismiss: vi.fn(),
    }),
  }
})

import { toast as sonnerToast } from "sonner"
import { useToastStore } from "@/store/toastStore"

describe("useToastStore", () => {
  beforeEach(() => {
    // Reset the store's module-level _activeId tracking (shared across tests)
    // before clearing mock history, so each test starts from a clean slate.
    useToastStore.getState().dismissToast()
    vi.clearAllMocks()
  })

  it("dispatches the info variant via sonner toast.info", () => {
    useToastStore
      .getState()
      .showToast({ variant: "info", title: "Title", message: "Message" })

    expect(sonnerToast.info).toHaveBeenCalledWith("Title", {
      description: "Message",
    })
  })

  it("dispatches the success variant via sonner toast.success", () => {
    useToastStore
      .getState()
      .showToast({ variant: "success", title: "Title", message: "Message" })

    expect(sonnerToast.success).toHaveBeenCalledWith("Title", {
      description: "Message",
    })
  })

  it("dispatches the warning variant via sonner toast.warning", () => {
    useToastStore
      .getState()
      .showToast({ variant: "warning", title: "Title", message: "Message" })

    expect(sonnerToast.warning).toHaveBeenCalledWith("Title", {
      description: "Message",
    })
  })

  it("dispatches the error variant via sonner toast.error", () => {
    useToastStore
      .getState()
      .showToast({ variant: "error", title: "Title", message: "Message" })

    expect(sonnerToast.error).toHaveBeenCalledWith("Title", {
      description: "Message",
    })
  })

  it("dispatches the default variant via the base sonner toast function", () => {
    useToastStore
      .getState()
      .showToast({ variant: "default", title: "Title", message: "Message" })

    expect(sonnerToast).toHaveBeenCalledWith("Title", {
      description: "Message",
    })
  })

  it("includes an action handler when actionLabel/onAction are provided", () => {
    const onAction = vi.fn()
    useToastStore.getState().showToast({
      variant: "info",
      title: "Title",
      message: "Message",
      actionLabel: "Undo",
      onAction,
    })

    const [, opts] = vi.mocked(sonnerToast.info).mock.calls[0]
    expect(opts?.action).toMatchObject({ label: "Undo" })
    ;(opts?.action as unknown as { onClick: () => void }).onClick()
    expect(onAction).toHaveBeenCalled()
  })

  it("omits the action when no actionLabel/onAction are provided", () => {
    useToastStore
      .getState()
      .showToast({ variant: "info", title: "Title", message: "Message" })

    const [, opts] = vi.mocked(sonnerToast.info).mock.calls[0]
    expect(opts?.action).toBeUndefined()
  })

  it("does not dismiss anything before the first toast is shown", () => {
    useToastStore
      .getState()
      .showToast({ variant: "info", title: "A", message: "a" })

    expect(sonnerToast.dismiss).not.toHaveBeenCalled()
  })

  it("dismisses the previously-active toast before showing a new one", () => {
    vi.mocked(sonnerToast.info).mockReturnValueOnce("first-id")
    useToastStore
      .getState()
      .showToast({ variant: "info", title: "A", message: "a" })

    vi.mocked(sonnerToast.success).mockReturnValueOnce("second-id")
    useToastStore
      .getState()
      .showToast({ variant: "success", title: "B", message: "b" })

    expect(sonnerToast.dismiss).toHaveBeenCalledWith("first-id")
  })

  it("dismissToast dismisses the active toast and clears tracking", () => {
    vi.mocked(sonnerToast.info).mockReturnValueOnce("active-id")
    useToastStore
      .getState()
      .showToast({ variant: "info", title: "A", message: "a" })

    useToastStore.getState().dismissToast()
    expect(sonnerToast.dismiss).toHaveBeenCalledWith("active-id")

    vi.mocked(sonnerToast.dismiss).mockClear()
    useToastStore.getState().dismissToast()
    expect(sonnerToast.dismiss).not.toHaveBeenCalled()
  })
})
