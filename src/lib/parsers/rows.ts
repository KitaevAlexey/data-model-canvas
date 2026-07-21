import { makeId, type Column, type TableModel } from '../types'

export interface RawColumnRow {
  columnName: string
  dataType: string
  key: string
  references: string
}

export function buildTableFromRows(name: string, rows: RawColumnRow[]): TableModel {
  const columns: Column[] = rows
    .filter((r) => r.columnName && r.columnName.trim())
    .map((r) => {
      const key = (r.key || '').trim().toUpperCase()
      const isPK = key === 'PK'
      const isFK = key === 'FK'
      let refTable: string | undefined
      let refColumn: string | undefined
      if (isFK && r.references) {
        const parts = r.references.trim().split('.')
        if (parts.length === 2) {
          refTable = parts[0].trim()
          refColumn = parts[1].trim()
        }
      }
      return {
        id: makeId('col'),
        name: r.columnName.trim(),
        type: (r.dataType || 'varchar(255)').trim() || 'varchar(255)',
        isPK,
        isFK,
        refTable,
        refColumn,
      }
    })

  return { id: makeId('tbl'), name, x: 0, y: 0, columns }
}