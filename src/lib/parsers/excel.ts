import * as XLSX from 'xlsx'
import type { TableModel } from '../types'
import { buildTableFromRows, type RawColumnRow } from './rows'

function normalizeHeader(h: string): string {
  return h.trim().toLowerCase().replace(/\s+/g, ' ')
}

export function parseExcel(data: ArrayBuffer): TableModel[] {
  const workbook = XLSX.read(new Uint8Array(data), { type: 'array' })
  const tables: TableModel[] = []

  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName]
    const rows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' })
    if (!rows.length) continue

    const headerRow = rows[0].map((h) => normalizeHeader(String(h)))
    const colNameIdx = headerRow.findIndex((h) => h === 'column name')
    const typeIdx = headerRow.findIndex((h) => h === 'data type')
    const keyIdx = headerRow.findIndex((h) => h === 'key')
    const refIdx = headerRow.findIndex((h) => h === 'references')

    if (colNameIdx === -1) continue

    const rawRows: RawColumnRow[] = rows.slice(1).map((row) => ({
      columnName: String(row[colNameIdx] ?? ''),
      dataType: typeIdx !== -1 ? String(row[typeIdx] ?? '') : '',
      key: keyIdx !== -1 ? String(row[keyIdx] ?? '') : '',
      references: refIdx !== -1 ? String(row[refIdx] ?? '') : '',
    }))

    tables.push(buildTableFromRows(sheetName, rawRows))
  }

  return tables
}

export function generateExcel(tables: TableModel[]): ArrayBuffer {
  const workbook = XLSX.utils.book_new()

  for (const table of tables) {
    const rows = [
      ['Column Name', 'Data Type', 'Key', 'References'],
      ...table.columns.map((c) => [
        c.name,
        c.type,
        c.isPK ? 'PK' : c.isFK ? 'FK' : '',
        c.isFK && c.refTable && c.refColumn ? `${c.refTable}.${c.refColumn}` : '',
      ]),
    ]
    const sheet = XLSX.utils.aoa_to_sheet(rows)
    const safeName = table.name.slice(0, 31) || 'Table'
    XLSX.utils.book_append_sheet(workbook, sheet, safeName)
  }

  return XLSX.write(workbook, { type: 'array', bookType: 'xlsx' }) as ArrayBuffer
}