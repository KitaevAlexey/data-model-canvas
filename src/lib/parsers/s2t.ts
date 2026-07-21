import { makeId, type Column, type TableModel } from '../types'

export function parseS2T(text: string): TableModel[] {
  const lines = text.split(/\r\n|\r|\n/)
  const tables: TableModel[] = []
  let current: TableModel | null = null

  for (const rawLine of lines) {
    if (!rawLine.trim()) continue
    const tableMatch = /^Table:\s*(.+)\s*$/i.exec(rawLine.trim())
    const isIndented = /^\s+/.test(rawLine) && !tableMatch

    if (tableMatch) {
      current = {
        id: makeId('tbl'),
        name: tableMatch[1].trim(),
        x: 0,
        y: 0,
        columns: [],
      }
      tables.push(current)
      continue
    }

    if (isIndented && current) {
      const colMatch = /^\s*([^:]+):\s*(.+)\s*$/.exec(rawLine)
      if (!colMatch) continue
      const colName = colMatch[1].trim()
      const rest = colMatch[2].trim()

      const pkMatch = /\bPK\b/i.test(rest)
      const restWithoutPK = rest.replace(/\bPK\b/i, '').trim()
      const fkMatch = /^(.*?)\s*FK\s*->\s*([^.]+)\.(\S+)\s*$/i.exec(restWithoutPK)

      let type: string
      let isFK = false
      let refTable: string | undefined
      let refColumn: string | undefined

      if (fkMatch) {
        isFK = true
        type = fkMatch[1].trim()
        refTable = fkMatch[2].trim()
        refColumn = fkMatch[3].trim()
      } else {
        type = restWithoutPK
      }

      const column: Column = {
        id: makeId('col'),
        name: colName,
        type: type || 'varchar(255)',
        isPK: pkMatch,
        isFK,
        refTable,
        refColumn,
      }
      current.columns.push(column)
    }
  }

  return tables
}

export function generateS2T(tables: TableModel[]): string {
  const blocks = tables.map((t) => {
    const header = `Table: ${t.name}`
    const cols = t.columns.map((c) => {
      let line = `  ${c.name}: ${c.type}`
      if (c.isPK) line += ' PK'
      if (c.isFK && c.refTable && c.refColumn) {
        line += ` FK -> ${c.refTable}.${c.refColumn}`
      }
      return line
    })
    return [header, ...cols].join('\n')
  })
  return blocks.join('\n\n') + '\n'
}