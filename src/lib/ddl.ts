import type { TableModel } from './types'

export function generateDDL(tables: TableModel[]): string {
  const statements: string[] = []

  for (const table of tables) {
    const lines: string[] = []
    const pkCols: string[] = []
    const fkLines: string[] = []

    for (const col of table.columns) {
      let line = `  ${col.name} ${col.type}`
      if (col.isPK) {
        line += ' NOT NULL'
        pkCols.push(col.name)
      }
      lines.push(line)

      if (col.isFK && col.refTable && col.refColumn) {
        fkLines.push(
          `  FOREIGN KEY (${col.name}) REFERENCES ${col.refTable}(${col.refColumn})`
        )
      }
    }

    if (pkCols.length > 0) {
      lines.push(`  PRIMARY KEY (${pkCols.join(', ')})`)
    }

    lines.push(...fkLines)

    statements.push(`CREATE TABLE ${table.name} (\n${lines.join(',\n')}\n);`)
  }

  return statements.join('\n\n')
}