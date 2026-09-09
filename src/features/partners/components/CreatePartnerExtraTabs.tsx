import { useState } from "react"
import { useTranslation } from "react-i18next"
import { Plus, Upload } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { SelectField } from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

/**
 * The four Create-partner tabs the click dummy draws beyond Party and Bank accounts:
 * **Assessment**, **Connections**, **Relationships** and **Documents**.
 *
 * ── READ THIS BEFORE CHANGING ANYTHING HERE ────────────────────────────────────────────────────
 * None of these four has an endpoint. The contract has no partner-assessment resource, no
 * object-connections resource, no relationship graph (`/partners/{id}/ubo` answers the narrower
 * beneficial-owner question), and no partner-document resource. They were left out twice for that
 * reason and asked for twice, so they are built — and the way they are built is the part that
 * matters:
 *
 *  - **No invented wire shapes.** Nothing here calls an API or declares a Zod schema for one.
 *    `api-first.md` forbids inventing a response shape, and that prohibition is not softened by the
 *    tabs being wanted. Entries live in this component's own state.
 *  - **Nothing pretends to save.** Each tab carries one line saying so, in plain words, naming what
 *    is missing. That is the difference between a design surface and the fake UI §4 objects to: a
 *    reviewer sees the layout and is told, on the same screen, that it does not persist.
 *  - **The sample rows are the dummy's own**, so the tables read as designed rather than as four
 *    empty states. They are the design's placeholders, not real party data.
 *
 * When an endpoint ships, the tab it belongs to is rewired to it and its notice comes off. Until
 * then the notices are the only thing keeping this honest, so do not remove one without the
 * endpoint that makes it untrue.
 */

/** One line, on every unsupported tab, saying what it is and is not. */
function NotStoredNotice({ tab }: { tab: string }) {
  const { t } = useTranslation("partners")
  return (
    <p
      className="rounded-lg border border-dashed px-4 py-3 text-sm text-muted-foreground"
      data-testid={`create-partner-not-stored-${tab}`}
    >
      {t(
        `submit.extraTabs.notStored.${tab}` as "submit.extraTabs.notStored.assessment"
      )}
    </p>
  )
}

// ── Assessment ────────────────────────────────────────────────────────────────────────────────

/**
 * The client's assessment catalogue, from the dummy — the sources a party's standing can be
 * recorded from. Nothing is scored here: each row is an observation made outside the platform.
 */
const ASSESSMENT_SOURCES = [
  "Bank enquiry",
  "Trade enquiry",
  "Schufa",
  "Creditreform",
  "Self-disclosure",
  "Tax return / assessment",
  "Balance sheet",
  "Management accounts (BWA)",
  "Note",
] as const

type AssessmentRow = {
  id: string
  source: string
  asAt: string
  recordedBy: string
  says: string
}

const SEEDED_ASSESSMENTS: AssessmentRow[] = [
  {
    id: "a1",
    source: "Experience of the leasing company",
    asAt: "2026-07-20",
    recordedBy: "Süd-Leasing (portal)",
    says: "positive",
  },
  {
    id: "a2",
    source: "Schufa",
    asAt: "2026-07-14",
    recordedBy: "M. Renkl",
    says: "A / 642",
  },
  {
    id: "a3",
    source: "Management accounts (BWA)",
    asAt: "2026-02-02",
    recordedBy: "A. Berger",
    says: "filed",
  },
]

export function AssessmentTab() {
  const { t } = useTranslation("partners")
  const [rows, setRows] = useState<AssessmentRow[]>(SEEDED_ASSESSMENTS)
  const [source, setSource] = useState<string>(ASSESSMENT_SOURCES[0])
  const [asAt, setAsAt] = useState("")
  const [context, setContext] = useState("")
  const [grade, setGrade] = useState("")
  const [index, setIndex] = useState("")

  function add() {
    setRows(current => [
      {
        id: `local-${current.length + 1}`,
        source,
        asAt,
        recordedBy: t("submit.extraTabs.assessment.you"),
        says: [grade, index].filter(v => v.trim() !== "").join(" / ") || "—",
      },
      ...current,
    ])
    setAsAt("")
    setContext("")
    setGrade("")
    setIndex("")
  }

  return (
    <div
      className="flex flex-col gap-4"
      data-testid="create-partner-assessment"
    >
      <NotStoredNotice tab="assessment" />

      <div className="flex flex-col gap-4 rounded-lg border bg-muted/40 p-4">
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label={t("submit.extraTabs.assessment.source")}>
            <SelectField
              data-testid="assessment-source"
              value={source}
              onValueChange={setSource}
              options={ASSESSMENT_SOURCES.map(value => ({
                value,
                label: value,
              }))}
            />
          </Field>
          <Field label={t("submit.extraTabs.assessment.asAt")}>
            <Input
              type="date"
              data-testid="assessment-as-at"
              value={asAt}
              onChange={e => setAsAt(e.target.value)}
            />
          </Field>
          <Field label={t("submit.extraTabs.assessment.context")}>
            <Input
              data-testid="assessment-context"
              value={context}
              onChange={e => setContext(e.target.value)}
            />
          </Field>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t("submit.extraTabs.assessment.grade")}>
            <Input
              data-testid="assessment-grade"
              value={grade}
              onChange={e => setGrade(e.target.value)}
            />
          </Field>
          <Field label={t("submit.extraTabs.assessment.index")}>
            <Input
              data-testid="assessment-index"
              value={index}
              onChange={e => setIndex(e.target.value)}
            />
          </Field>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="self-end"
          data-testid="assessment-add"
          onClick={add}
        >
          <Plus size={16} />
          {t("submit.extraTabs.assessment.add")}
        </Button>
      </div>

      {/* The dummy's own words, and they carry a rule: nothing here is scored, and a wrong entry
          is retired and re-added rather than edited in place. */}
      <p className="text-xs text-muted-foreground">
        {t("submit.extraTabs.assessment.rule")}
      </p>

      <SimpleTable
        testId="assessment-table"
        columns={[
          t("submit.extraTabs.assessment.source"),
          t("submit.extraTabs.assessment.asAt"),
          t("submit.extraTabs.assessment.recordedBy"),
          t("submit.extraTabs.assessment.whatItSays"),
        ]}
        rows={rows.map(row => ({
          key: row.id,
          cells: [row.source, row.asAt || "—", row.recordedBy, row.says],
        }))}
      />
    </div>
  )
}

// ── Connections ───────────────────────────────────────────────────────────────────────────────

const SEEDED_CONNECTIONS = [
  {
    id: "c1",
    object: "Contract C-4471",
    detail: "3 assets · MAN TGX",
    role: "Lessee",
    lc: "Süd-Leasing GmbH",
    status: "financed",
  },
  {
    id: "c2",
    object: "Contract C-4470",
    detail: "1 asset · trailer",
    role: "Lessee",
    lc: "Süd-Leasing GmbH",
    status: "financed",
  },
  {
    id: "c3",
    object: "Contract C-3980",
    detail: "2 assets · vans",
    role: "Guarantor",
    lc: "Autoleasing Nord AG",
    status: "financed",
  },
  {
    id: "c4",
    object: "Request RQ-2026-0148",
    detail: "3 contracts",
    role: "Lessee",
    lc: "Süd-Leasing GmbH",
    status: "draft",
  },
] as const

/**
 * Read-only in the dummy too, and rightly: a party's connections are the consequence of contracts
 * elsewhere, not something typed on the party. Nothing here is enterable, so the tab is a table
 * and a notice.
 */
export function ConnectionsTab() {
  const { t } = useTranslation("partners")

  return (
    <div
      className="flex flex-col gap-4"
      data-testid="create-partner-connections"
    >
      <NotStoredNotice tab="connections" />
      <SimpleTable
        testId="connections-table"
        columns={[
          t("submit.extraTabs.connections.object"),
          t("submit.extraTabs.connections.role"),
          t("submit.extraTabs.connections.leasingCompany"),
          t("submit.extraTabs.connections.status"),
        ]}
        rows={SEEDED_CONNECTIONS.map(row => ({
          key: row.id,
          cells: [
            <span key="o">
              <span className="font-medium">{row.object}</span>
              <span className="block text-xs text-muted-foreground">
                {row.detail}
              </span>
            </span>,
            row.role,
            row.lc,
            <Badge
              key="s"
              variant={row.status === "draft" ? "outline" : "default"}
            >
              {row.status}
            </Badge>,
          ],
        }))}
      />
    </div>
  )
}

// ── Relationships ─────────────────────────────────────────────────────────────────────────────

const RELATIONSHIP_TYPES = [
  "Managing director",
  "Parent",
  "Subsidiary",
  "Shareholder",
  "Beneficial owner",
] as const

type RelationshipRow = {
  id: string
  party: string
  type: string
  reads: string
}

const SEEDED_RELATIONSHIPS: RelationshipRow[] = [
  {
    id: "r1",
    party: "Müller Immobilien GbR",
    type: "Parent",
    reads: "Müller Immobilien GbR is the parent of this party",
  },
  {
    id: "r2",
    party: "Josef Müller",
    type: "Managing director",
    reads: "Josef Müller is a managing director of this party",
  },
  {
    id: "r3",
    party: "Müller Logistik UG",
    type: "Subsidiary",
    reads: "Müller Logistik UG is a subsidiary of this party",
  },
]

export function RelationshipsTab() {
  const { t } = useTranslation("partners")
  const [rows, setRows] = useState<RelationshipRow[]>(SEEDED_RELATIONSHIPS)
  const [other, setOther] = useState("")
  const [type, setType] = useState<string>(RELATIONSHIP_TYPES[0])
  const [isReversed, setReversed] = useState(false)
  const [share, setShare] = useState("")
  const [validFrom, setValidFrom] = useState("")
  const [validTo, setValidTo] = useState("")

  const thisParty = t("submit.extraTabs.relationships.thisParty")
  // The dummy writes the edge out as a sentence before it is added, because a direction is the one
  // thing about a relationship that is easy to record backwards and hard to spot afterwards.
  const edge = isReversed
    ? t("submit.extraTabs.relationships.edgeReversed", {
        a: thisParty,
        type: type.toLowerCase(),
        b: other,
      })
    : t("submit.extraTabs.relationships.edge", {
        a: other,
        type: type.toLowerCase(),
        b: thisParty,
      })

  function add() {
    setRows(current => [
      { id: `local-${current.length + 1}`, party: other, type, reads: edge },
      ...current,
    ])
    setOther("")
    setShare("")
    setValidFrom("")
    setValidTo("")
    setReversed(false)
  }

  return (
    <div
      className="flex flex-col gap-4"
      data-testid="create-partner-relationships"
    >
      <NotStoredNotice tab="relationships" />

      <div className="flex flex-col gap-4 rounded-lg border bg-muted/40 p-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t("submit.extraTabs.relationships.otherParty")}>
            <Input
              data-testid="relationship-other"
              value={other}
              placeholder={t("submit.extraTabs.relationships.otherPlaceholder")}
              onChange={e => setOther(e.target.value)}
            />
          </Field>
          <Field label={t("submit.extraTabs.relationships.type")}>
            <SelectField
              data-testid="relationship-type"
              value={type}
              onValueChange={setType}
              options={RELATIONSHIP_TYPES.map(value => ({
                value,
                label: value,
              }))}
            />
          </Field>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-background px-3 py-2">
          <span className="text-sm" data-testid="relationship-edge">
            {other.trim() === ""
              ? t("submit.extraTabs.relationships.pickFirst")
              : edge}
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={other.trim() === ""}
            data-testid="relationship-swap"
            onClick={() => setReversed(v => !v)}
          >
            {t("submit.extraTabs.relationships.swap")}
          </Button>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <Field label={t("submit.extraTabs.relationships.share")}>
            <Input
              data-testid="relationship-share"
              value={share}
              onChange={e => setShare(e.target.value)}
            />
          </Field>
          <Field label={t("submit.extraTabs.relationships.validFrom")}>
            <Input
              type="date"
              data-testid="relationship-valid-from"
              value={validFrom}
              onChange={e => setValidFrom(e.target.value)}
            />
          </Field>
          <Field label={t("submit.extraTabs.relationships.validTo")}>
            <Input
              type="date"
              data-testid="relationship-valid-to"
              value={validTo}
              onChange={e => setValidTo(e.target.value)}
            />
          </Field>
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          className="self-end"
          disabled={other.trim() === ""}
          data-testid="relationship-add"
          onClick={add}
        >
          <Plus size={16} />
          {t("submit.extraTabs.relationships.add")}
        </Button>
      </div>

      <SimpleTable
        testId="relationships-table"
        columns={[
          t("submit.extraTabs.relationships.relatedParty"),
          t("submit.extraTabs.relationships.type"),
          t("submit.extraTabs.relationships.edgeColumn"),
        ]}
        rows={rows.map(row => ({
          key: row.id,
          cells: [
            row.party,
            row.type,
            <span key="r" className="text-muted-foreground">
              {row.reads}
            </span>,
          ],
        }))}
      />
    </div>
  )
}

// ── Documents ─────────────────────────────────────────────────────────────────────────────────

const DOCUMENT_TYPES = [
  "Original agreement",
  "Commercial register extract",
  "Management accounts",
] as const

type DocumentRow = { id: string; name: string; uploaded: string; by: string }

const SEEDED_DOCUMENTS: DocumentRow[] = [
  {
    id: "d1",
    name: "Management accounts 2025",
    uploaded: "2026-02-02",
    by: "A. Berger",
  },
  {
    id: "d2",
    name: "Commercial register extract",
    uploaded: "2026-07-14",
    by: "M. Renkl",
  },
]

export function DocumentsTab() {
  const { t } = useTranslation("partners")
  const [rows, setRows] = useState<DocumentRow[]>(SEEDED_DOCUMENTS)
  const [file, setFile] = useState<File | null>(null)
  const [type, setType] = useState<string>(DOCUMENT_TYPES[0])
  const [date, setDate] = useState("")
  const [label, setLabel] = useState("")

  function upload() {
    if (file === null) return
    setRows(current => [
      {
        id: `local-${current.length + 1}`,
        name: label.trim() === "" ? file.name : label,
        uploaded: date,
        by: t("submit.extraTabs.assessment.you"),
      },
      ...current,
    ])
    setFile(null)
    setDate("")
    setLabel("")
  }

  return (
    <div className="flex flex-col gap-4" data-testid="create-partner-documents">
      <NotStoredNotice tab="documents" />

      <div className="flex flex-col gap-4 rounded-lg border bg-muted/40 p-4">
        <Field label={t("submit.extraTabs.documents.file")}>
          {/* NOTE: raw <input type="file"> — no shadcn equivalent. */}
          <Input
            type="file"
            data-testid="document-file"
            onChange={e => setFile(e.target.files?.[0] ?? null)}
          />
        </Field>

        {/* The three describing fields are only meaningful once there is a file to describe. */}
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label={t("submit.extraTabs.documents.type")}>
            <SelectField
              data-testid="document-type"
              value={type}
              onValueChange={setType}
              disabled={file === null}
              options={DOCUMENT_TYPES.map(value => ({ value, label: value }))}
            />
          </Field>
          <Field label={t("submit.extraTabs.documents.date")}>
            <Input
              type="date"
              data-testid="document-date"
              disabled={file === null}
              value={date}
              onChange={e => setDate(e.target.value)}
            />
          </Field>
          <Field label={t("submit.extraTabs.documents.label")}>
            <Input
              data-testid="document-label"
              disabled={file === null}
              value={label}
              onChange={e => setLabel(e.target.value)}
            />
          </Field>
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          className="self-end"
          disabled={file === null}
          data-testid="document-upload"
          onClick={upload}
        >
          <Upload size={16} />
          {t("submit.extraTabs.documents.upload")}
        </Button>
      </div>

      <SimpleTable
        testId="documents-table"
        columns={[
          t("submit.extraTabs.documents.document"),
          t("submit.extraTabs.documents.uploaded"),
          t("submit.extraTabs.documents.by"),
        ]}
        rows={rows.map(row => ({
          key: row.id,
          cells: [row.name, row.uploaded || "—", row.by],
        }))}
      />
    </div>
  )
}

// ── Shared bits ───────────────────────────────────────────────────────────────────────────────

function Field({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label className="text-xs">{label}</Label>
      {children}
    </div>
  )
}

function SimpleTable({
  testId,
  columns,
  rows,
}: {
  testId: string
  columns: readonly string[]
  rows: readonly { key: string; cells: readonly React.ReactNode[] }[]
}) {
  return (
    <div className="overflow-x-auto rounded-lg border">
      <Table data-testid={testId}>
        <TableHeader>
          <TableRow>
            {columns.map(column => (
              <TableHead key={column}>{column}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map(row => (
            <TableRow key={row.key} data-testid={`${testId}-row-${row.key}`}>
              {row.cells.map((cell, index) => (
                <TableCell key={columns[index] ?? index}>{cell}</TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
