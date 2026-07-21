import Papa from 'papaparse'
import type { TableModel } from '../types'
import { buildTableFromRows, type RawColumnRow } from './rows'

function normalizeHeader(h: string): string {
  return h.trim().toLowerCase().replace(/\s+/g, ' ')
}

export function parseCSV(text: string): TableModel[] {
  const result = Papa.parse<Record<string, string>>(text, {
    header: true,
    skipEmptyLines: true,
    transformHeader: normalizeHeader,
  })

  const byTable = new Map<string, RawColumnRow[]>()
  const order: string[] = []

  for (const row of result.data) {
    const tableName = (row['table'] || '').trim()
    if (!tableName) continue
    if (!byTable.has(tableName)) {
      byTable.set(tableName, [])
      order.push(tableName)
    }
    byTable.get(tableName)!.push({
      columnName: row['column name'] || '',
      dataType: row['data type'] || '',
      key: row['key'] || '',
      references: row['references'] || '',
    })
  }

  return order.map((name) => buildTableFromRows(name, byTable.get(name)!))
}