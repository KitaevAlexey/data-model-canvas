import type { TableModel } from './types'

export interface CollisionIssue {
  kind: string
  tables: string[]
  columns: string[]
  message: string
}

function parseVarcharLength(type: string): number | null {
  const m = /^varchar\s*\(\s*(\d+)\s*\)$/i.exec(type.trim())
  return m ? parseInt(m[1], 10) : null
}

export function analyzeCollisions(tables: TableModel[]): CollisionIssue[] {
  const issues: CollisionIssue[] = []
  const byName = new Map(tables.map((t) => [t.name, t]))

  for (const table of tables) {
    if (!table.columns.some((c) => c.isPK)) {
      issues.push({
        kind: 'Нет PK',
        tables: [table.name],
        columns: [],
        message: `Таблица "${table.name}" не имеет первичного ключа.`,
      })
    }

    for (const col of table.columns) {
      if (!col.isFK || !col.refTable || !col.refColumn) continue

      const refTable = byName.get(col.refTable)
      if (!refTable) {
        issues.push({
          kind: 'Висячий FK',
          tables: [table.name, col.refTable],
          columns: [col.name],
          message: `FK "${table.name}.${col.name}" ссылается на несуществующую таблицу "${col.refTable}".`,
        })
        continue
      }

      const refCol = refTable.columns.find((c) => c.name === col.refColumn)
      if (!refCol) {
        issues.push({
          kind: 'Висячий FK',
          tables: [table.name, refTable.name],
          columns: [col.name, col.refColumn],
          message: `FK "${table.name}.${col.name}" ссылается на несуществующую колонку "${refTable.name}.${col.refColumn}".`,
        })
        continue
      }

      if (col.type !== refCol.type) {
        issues.push({
          kind: 'Несовпадение типов',
          tables: [table.name, refTable.name],
          columns: [col.name, refCol.name],
          message: `FK "${table.name}.${col.name}" (${col.type}) не совпадает по типу с PK "${refTable.name}.${refCol.name}" (${refCol.type}).`,
        })
      } else {
        const fkLen = parseVarcharLength(col.type)
        const pkLen = parseVarcharLength(refCol.type)
        if (fkLen !== null && pkLen !== null && fkLen !== pkLen) {
          issues.push({
            kind: 'Разная длина VARCHAR',
            tables: [table.name, refTable.name],
            columns: [col.name, refCol.name],
            message: `FK "${table.name}.${col.name}" имеет varchar(${fkLen}), а PK "${refTable.name}.${refCol.name}" — varchar(${pkLen}).`,
          })
        }
      }
    }
  }

  for (const table of tables) {
    for (const col of table.columns) {
      if (!col.isFK || !col.refTable) continue
      const visited = new Set<string>([table.name])
      let current = col.refTable
      let depth = 0
      while (current && depth < 10) {
        if (current === table.name) {
          issues.push({
            kind: 'Циклический FK',
            tables: [table.name],
            columns: [col.name],
            message: `FK "${table.name}.${col.name}" создаёт циклическую цепочку ссылок.`,
          })
          break
        }
        if (visited.has(current)) break
        visited.add(current)
        const ref = byName.get(current)
        if (!ref) break
        const nextFK = ref.columns.find((c) => c.isFK)
        if (!nextFK || !nextFK.refTable) break
        current = nextFK.refTable
        depth++
      }
    }
  }

  return issues
}