import { STATUS_LABELS, type UserGame } from '../types'

export type ExportFormat = 'csv' | 'excel' | 'json'

export interface ExportRow {
  list_entry_id: string
  game_id: number
  game_name: string
  game_slug: string
  release_year: string
  platforms: string
  genres: string
  cover_url: string
  summary: string
  status: string
  status_label: string
  score: string
  hours_played: string
  favourite: string
  notes: string
  started_at: string
  finished_at: string
  added_to_list_at: string
  last_updated_at: string
}

const HEADERS: (keyof ExportRow)[] = [
  'list_entry_id',
  'game_id',
  'game_name',
  'game_slug',
  'release_year',
  'platforms',
  'genres',
  'cover_url',
  'summary',
  'status',
  'status_label',
  'score',
  'hours_played',
  'favourite',
  'notes',
  'started_at',
  'finished_at',
  'added_to_list_at',
  'last_updated_at',
]

function cell(value: string | number | null | undefined): string {
  if (value == null) return ''
  return String(value)
}

function joinList(values: string[] | undefined): string {
  if (!values?.length) return ''
  return values.join('; ')
}

function iso(value: string | null | undefined): string {
  if (!value) return ''
  return value
}

/** Prefer DB created_at; fall back to updated_at if migration not applied yet. */
function addedAt(entry: UserGame): string {
  return iso(entry.created_at ?? entry.updated_at)
}

export function buildExportRows(entries: UserGame[]): ExportRow[] {
  const sorted = [...entries].sort((a, b) => {
    const nameA = a.games?.name ?? ''
    const nameB = b.games?.name ?? ''
    return nameA.localeCompare(nameB) || a.igdb_id - b.igdb_id
  })

  return sorted.map((entry) => ({
    list_entry_id: entry.id,
    game_id: entry.igdb_id,
    game_name: cell(entry.games?.name),
    game_slug: cell(entry.games?.slug),
    release_year: cell(entry.games?.release_year),
    platforms: joinList(entry.games?.platforms),
    genres: joinList(entry.games?.genres),
    cover_url: cell(entry.games?.cover_url),
    summary: cell(entry.games?.summary),
    status: entry.status,
    status_label: STATUS_LABELS[entry.status] ?? entry.status,
    score: cell(entry.score),
    hours_played: cell(entry.hours_played),
    favourite: entry.is_favorite ? 'yes' : 'no',
    notes: cell(entry.notes),
    started_at: iso(entry.started_at),
    finished_at: iso(entry.finished_at),
    added_to_list_at: addedAt(entry),
    last_updated_at: iso(entry.updated_at),
  }))
}

function escapeCsv(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replaceAll('"', '""')}"`
  }
  return value
}

function toCsv(rows: ExportRow[]): string {
  const lines = [
    HEADERS.join(','),
    ...rows.map((row) => HEADERS.map((key) => escapeCsv(String(row[key]))).join(',')),
  ]
  // BOM helps Excel detect UTF-8
  return `\uFEFF${lines.join('\r\n')}`
}

function escapeXml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}

function toSpreadsheetMl(rows: ExportRow[]): string {
  const headerCells = HEADERS.map(
    (h) => `<Cell><Data ss:Type="String">${escapeXml(h)}</Data></Cell>`,
  ).join('')

  const body = rows
    .map((row) => {
      const cells = HEADERS.map((key) => {
        const raw = String(row[key] ?? '')
        const isNumber =
          (key === 'game_id' || key === 'score' || key === 'hours_played' || key === 'release_year') &&
          raw !== '' &&
          !Number.isNaN(Number(raw))
        return `<Cell><Data ss:Type="${isNumber ? 'Number' : 'String'}">${escapeXml(raw)}</Data></Cell>`
      }).join('')
      return `<Row>${cells}</Row>`
    })
    .join('')

  return `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
 <Worksheet ss:Name="MyGameList">
  <Table>
   <Row>${headerCells}</Row>
   ${body}
  </Table>
 </Worksheet>
</Workbook>`
}

function downloadBlob(filename: string, blob: Blob) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.rel = 'noopener'
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

function stamp(username: string): string {
  const safe = username.replace(/[^a-z0-9_-]+/gi, '_').toLowerCase() || 'list'
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `mygamelist-${safe}-${y}${m}${day}`
}

export function exportUserList(
  entries: UserGame[],
  format: ExportFormat,
  username: string,
): void {
  const rows = buildExportRows(entries)
  const base = stamp(username)

  if (format === 'csv') {
    downloadBlob(
      `${base}.csv`,
      new Blob([toCsv(rows)], { type: 'text/csv;charset=utf-8' }),
    )
    return
  }

  if (format === 'json') {
    downloadBlob(
      `${base}.json`,
      new Blob([JSON.stringify(rows, null, 2)], { type: 'application/json' }),
    )
    return
  }

  downloadBlob(
    `${base}.xls`,
    new Blob([toSpreadsheetMl(rows)], {
      type: 'application/vnd.ms-excel;charset=utf-8',
    }),
  )
}
