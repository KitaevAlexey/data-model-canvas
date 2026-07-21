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
    
    console.log('Excel headers:', headerRow)
    
    // Check if this sheet has a "Table" column → all tables on one sheet
    const tableColIdx = headerRow.findIndex((h) => h === 'table')
    console.log('Table column index:', tableColIdx)
    
    if (tableColIdx !== -1) {
      // FORMAT: all tables on one sheet with "Table" column
      const colNameIdx = headerRow.findIndex((h) => h === 'column name')
      const typeIdx = headerRow.findIndex((h) => h === 'data type')
      const keyIdx = headerRow.findIndex((h) => h === 'key')
      const refIdx = headerRow.findIndex((h) => h === 'references')

      console.log('Column indexes:', { colNameIdx, typeIdx, keyIdx, refIdx })

      if (colNameIdx === -1) continue

      const byTable = new Map<string, RawColumnRow[]>()
      const order: string[] = []

      for (const row of rows.slice(1)) {
        const tableName = String(row[tableColIdx] ?? '').trim()
        if (!tableName) continue
        if (!byTable.has(tableName)) {
          byTable.set(tableName, [])
          order.push(tableName)
        }
        byTable.get(tableName)!.push({
          columnName: String(row[colNameIdx] ?? ''),
          dataType: typeIdx !== -1 ? String(row[typeIdx] ?? '') : '',
          key: keyIdx !== -1 ? String(row[keyIdx] ?? '') : '',
          references: refIdx !== -1 ? String(row[refIdx] ?? '') : '',
        })
      }

      console.log('Found tables:', order)

      for (const name of order) {
        tables.push(buildTableFromRows(name, byTable.get(name)!))
      }
    } else {
      // FORMAT: sheet name = table name
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
  }

  console.log('Total parsed tables:', tables.length)
  return tables
}

export function generateExcel(tables: TableModel[]): ArrayBuffer {
  const workbook = XLSX.utils.book_new()

  const rows = [
    ['Table', 'Column Name', 'Data Type', 'Key', 'References'],
    ...tables.flatMap((table) =>
      table.columns.map((c) => [
        table.name,
        c.name,
        c.type,
        c.isPK ? 'PK' : c.isFK ? 'FK' : '',
        c.isFK && c.refTable && c.refColumn ? `${c.refTable}.${c.refColumn}` : '',
      ])
    ),
  ]
  const sheet = XLSX.utils.aoa_to_sheet(rows)
  XLSX.utils.book_append_sheet(workbook, sheet, 'Tables')

  return XLSX.write(workbook, { type: 'array', bookType: 'xlsx' }) as ArrayBuffer
}