import { describe, it, expect, vi, beforeEach } from "vitest"

const mockInvalidateQueries = vi.fn()

vi.mock("@tanstack/react-query", () => ({
  useMutation: vi.fn(
    ({
      mutationFn,
      onSuccess,
    }: {
      mutationFn: (vars: unknown) => Promise<unknown>
      onSuccess?: (data: unknown, variables: unknown) => void
    }) => ({
      mutate: (
        vars: unknown,
        callbacks?: { onSuccess?: (data: unknown) => void }
      ) => {
        return mutationFn(vars).then(data => {
          onSuccess?.(data, vars)
          callbacks?.onSuccess?.(data)
        })
      },
      isPending: false,
    })
  ),
  useQueryClient: vi.fn(() => ({
    invalidateQueries: mockInvalidateQueries,
  })),
}))

vi.mock("@/features/productTemplates/api/productTemplatesApi", () => ({
  createProductTemplateDraft: vi.fn(),
  updateProductTemplateDraft: vi.fn(),
  updateProductTemplateOrchestration: vi.fn(),
  discardProductTemplateDraft: vi.fn(),
  publishProductTemplate: vi.fn(),
  createNewProductTemplateVersion: vi.fn(),
  deprecateProductTemplateVersion: vi.fn(),
  PRODUCT_TEMPLATES_QUERY_KEYS: {
    versions: (templateId: string) => [
      "product-templates",
      "versions",
      templateId,
    ],
  },
}))

import { useCreateProductTemplateDraft } from "@/features/productTemplates/hooks/useCreateProductTemplateDraft"
import { useUpdateProductTemplateDraft } from "@/features/productTemplates/hooks/useUpdateProductTemplateDraft"
import { useUpdateProductTemplateOrchestration } from "@/features/productTemplates/hooks/useUpdateProductTemplateOrchestration"
import { useDiscardProductTemplateDraft } from "@/features/productTemplates/hooks/useDiscardProductTemplateDraft"
import { usePublishProductTemplate } from "@/features/productTemplates/hooks/usePublishProductTemplate"
import { useCreateNewProductTemplateVersion } from "@/features/productTemplates/hooks/useCreateNewProductTemplateVersion"
import { useDeprecateProductTemplateVersion } from "@/features/productTemplates/hooks/useDeprecateProductTemplateVersion"
import {
  createProductTemplateDraft,
  updateProductTemplateDraft,
  updateProductTemplateOrchestration,
  discardProductTemplateDraft,
  publishProductTemplate,
  createNewProductTemplateVersion,
  deprecateProductTemplateVersion,
} from "@/features/productTemplates/api/productTemplatesApi"

const mockCreateDraft = createProductTemplateDraft as ReturnType<typeof vi.fn>
const mockUpdateDraft = updateProductTemplateDraft as ReturnType<typeof vi.fn>
const mockUpdateOrchestration =
  updateProductTemplateOrchestration as ReturnType<typeof vi.fn>
const mockDiscardDraft = discardProductTemplateDraft as ReturnType<typeof vi.fn>
const mockPublish = publishProductTemplate as ReturnType<typeof vi.fn>
const mockCreateNewVersion = createNewProductTemplateVersion as ReturnType<
  typeof vi.fn
>
const mockDeprecate = deprecateProductTemplateVersion as ReturnType<
  typeof vi.fn
>

const TEMPLATE_ID = "template-123"
const TENANT_ID = "tenant-abc"
const VERSION_NUMBER = "1.0.0"

beforeEach(() => {
  vi.clearAllMocks()
  mockCreateDraft.mockResolvedValue({ id: TEMPLATE_ID })
  mockUpdateDraft.mockResolvedValue({})
  mockUpdateOrchestration.mockResolvedValue({})
  mockDiscardDraft.mockResolvedValue({})
  mockPublish.mockResolvedValue({})
  mockCreateNewVersion.mockResolvedValue({ version_number: "2.0.0" })
  mockDeprecate.mockResolvedValue({})
})

describe("useCreateProductTemplateDraft", () => {
  const body = {
    template_code: "TC-1",
    template_name: "Template 1",
    financing_type: "full_refinancing" as const,
    legal_structure: "loan_credit" as const,
    payment_timing: "advance" as const,
    rate_basis: "act_360" as const,
    calculation_model: "annuity" as const,
  }

  it("calls createProductTemplateDraft with the correct tenantId and body", async () => {
    const { mutate } = useCreateProductTemplateDraft()
    await mutate({ tenantId: TENANT_ID, body })
    expect(mockCreateDraft).toHaveBeenCalledWith(TENANT_ID, body)
  })

  it("invalidates versions for the newly created template on success", async () => {
    const { mutate } = useCreateProductTemplateDraft()
    await mutate({ tenantId: TENANT_ID, body })
    expect(mockInvalidateQueries).toHaveBeenCalledWith({
      queryKey: ["product-templates", "versions", TEMPLATE_ID],
    })
  })
})

describe("useUpdateProductTemplateDraft", () => {
  const body = { template_name: "Updated name" }

  it("calls updateProductTemplateDraft with the correct ids and body", async () => {
    const { mutate } = useUpdateProductTemplateDraft()
    await mutate({
      templateId: TEMPLATE_ID,
      versionNumber: VERSION_NUMBER,
      body,
    })
    expect(mockUpdateDraft).toHaveBeenCalledWith(
      TEMPLATE_ID,
      VERSION_NUMBER,
      body
    )
  })

  it("invalidates versions for the template on success", async () => {
    const { mutate } = useUpdateProductTemplateDraft()
    await mutate({
      templateId: TEMPLATE_ID,
      versionNumber: VERSION_NUMBER,
      body,
    })
    expect(mockInvalidateQueries).toHaveBeenCalledWith({
      queryKey: ["product-templates", "versions", TEMPLATE_ID],
    })
  })
})

describe("useUpdateProductTemplateOrchestration", () => {
  const body = {
    required_workflow_tasks: ["task-1"],
    required_documents: ["doc-1"],
    optional_documents: [],
    validation_rule_set_id: "rule-1",
  }

  it("calls updateProductTemplateOrchestration with the correct ids and body", async () => {
    const { mutate } = useUpdateProductTemplateOrchestration()
    await mutate({
      templateId: TEMPLATE_ID,
      versionNumber: VERSION_NUMBER,
      body,
    })
    expect(mockUpdateOrchestration).toHaveBeenCalledWith(
      TEMPLATE_ID,
      VERSION_NUMBER,
      body
    )
  })

  it("invalidates versions for the template on success", async () => {
    const { mutate } = useUpdateProductTemplateOrchestration()
    await mutate({
      templateId: TEMPLATE_ID,
      versionNumber: VERSION_NUMBER,
      body,
    })
    expect(mockInvalidateQueries).toHaveBeenCalledWith({
      queryKey: ["product-templates", "versions", TEMPLATE_ID],
    })
  })
})

describe("useDiscardProductTemplateDraft", () => {
  it("calls discardProductTemplateDraft with the correct ids", async () => {
    const { mutate } = useDiscardProductTemplateDraft()
    await mutate({ templateId: TEMPLATE_ID, versionNumber: VERSION_NUMBER })
    expect(mockDiscardDraft).toHaveBeenCalledWith(TEMPLATE_ID, VERSION_NUMBER)
  })

  it("invalidates versions for the template on success", async () => {
    const { mutate } = useDiscardProductTemplateDraft()
    await mutate({ templateId: TEMPLATE_ID, versionNumber: VERSION_NUMBER })
    expect(mockInvalidateQueries).toHaveBeenCalledWith({
      queryKey: ["product-templates", "versions", TEMPLATE_ID],
    })
  })
})

describe("usePublishProductTemplate", () => {
  const body = { justification: "Ready for production" }

  it("calls publishProductTemplate with the correct ids and body", async () => {
    const { mutate } = usePublishProductTemplate()
    await mutate({
      templateId: TEMPLATE_ID,
      versionNumber: VERSION_NUMBER,
      body,
    })
    expect(mockPublish).toHaveBeenCalledWith(TEMPLATE_ID, VERSION_NUMBER, body)
  })

  it("invalidates versions for the template on success", async () => {
    const { mutate } = usePublishProductTemplate()
    await mutate({
      templateId: TEMPLATE_ID,
      versionNumber: VERSION_NUMBER,
      body,
    })
    expect(mockInvalidateQueries).toHaveBeenCalledWith({
      queryKey: ["product-templates", "versions", TEMPLATE_ID],
    })
  })
})

describe("useCreateNewProductTemplateVersion", () => {
  const body = { increment_type: "minor" as const }

  it("calls createNewProductTemplateVersion with the correct templateId and body", async () => {
    const { mutate } = useCreateNewProductTemplateVersion()
    await mutate({ templateId: TEMPLATE_ID, body })
    expect(mockCreateNewVersion).toHaveBeenCalledWith(TEMPLATE_ID, body)
  })

  it("invalidates versions for the template on success", async () => {
    const { mutate } = useCreateNewProductTemplateVersion()
    await mutate({ templateId: TEMPLATE_ID, body })
    expect(mockInvalidateQueries).toHaveBeenCalledWith({
      queryKey: ["product-templates", "versions", TEMPLATE_ID],
    })
  })
})

describe("useDeprecateProductTemplateVersion", () => {
  const body = { justification: "No longer offered to new customers" }

  it("calls deprecateProductTemplateVersion with the correct ids and body", async () => {
    const { mutate } = useDeprecateProductTemplateVersion()
    await mutate({
      templateId: TEMPLATE_ID,
      versionNumber: VERSION_NUMBER,
      body,
    })
    expect(mockDeprecate).toHaveBeenCalledWith(
      TEMPLATE_ID,
      VERSION_NUMBER,
      body
    )
  })

  it("invalidates versions for the template on success", async () => {
    const { mutate } = useDeprecateProductTemplateVersion()
    await mutate({
      templateId: TEMPLATE_ID,
      versionNumber: VERSION_NUMBER,
      body,
    })
    expect(mockInvalidateQueries).toHaveBeenCalledWith({
      queryKey: ["product-templates", "versions", TEMPLATE_ID],
    })
  })
})
