import type { TableModel } from './types'

export interface CollisionIssue {
  kind: string
  tables: string[]
  columns: string[]
  message: string
}

export function analyzeCollisions(tables: TableModel[]): CollisionIssue[] {
  const issues: CollisionIssue[] = []
  const byName = new Map(tables.map((t) => [t.name, t]))

  for (const table of tables) {
    // Missing PK
    if (!table.columns.some((c) => c.isPK)) {
      issues.push({
        kind: 'Missing PK',
        tables: [table.name],
        columns: [],
        message: `Table "${table.name}" has no primary key.`,
      })
    }

    for (const col of table.columns) {
      if (!col.isFK || !col.refTable || !col.refColumn) continue

      const refTable = byName.get(col.refTable)
      if (!refTable) {
        issues.push({
          kind: 'Orphaned FK',
          tables: [table.name, col.refTable],
          columns: [col.name],
          message: `FK "${table.name}.${col.name}" references non-existent table "${col.refTable}".`,
        })
        continue
      }

      const refCol = refTable.columns.find((c) => c.name === col.refColumn)
      if (!refCol) {
        issues.push({
          kind: 'Orphaned FK',
          tables: [table.name, refTable.name],
          columns: [col.name, col.refColumn],
          message: `FK "${table.name}.${col.name}" references non-existent column "${refTable.name}.${col.refColumn}".`,
        })
        continue
      }

      // Type mismatch
      if (col.type !== refCol.type) {
        issues.push({
          kind: 'Type mismatch',
          tables: [table.name, refTable.name],
          columns: [col.name, refCol.name],
          message: `FK "${table.name}.${col.name}" (${col.type}) does not match PK "${refTable.name}.${refCol.name}" (${refCol.type}).`,
        })
      }
    }
  }

  // Circular FK detection
  for (const table of tables) {
    for (const col of table.columns) {
      if (!col.isFK || !col.refTable) continue
      const visited = new Set<string>([table.name])
      let current = col.refTable
      let depth = 0
      while (current && depth < 10) {
        if (current === table.name) {
          issues.push({
            kind: 'Circular FK',
            tables: [table.name],
            columns: [col.name],
            message: `FK "${table.name}.${col.name}" creates a circular reference chain.`,
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