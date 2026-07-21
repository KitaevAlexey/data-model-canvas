import type { TableModel } from './types'

export function generateAIPrompt(tables: TableModel[]): string {
  const parts: string[] = []

  parts.push('I have a database model with the following tables:\n')

  for (const table of tables) {
    parts.push(`Table: ${table.name}`)
    for (const col of table.columns) {
      let line = `  - ${col.name}: ${col.type}`
      if (col.isPK) line += ' (Primary Key)'
      if (col.isFK && col.refTable && col.refColumn) {
        line += ` (Foreign Key -> ${col.refTable}.${col.refColumn})`
      }
      parts.push(line)
    }
    parts.push('')
  }

  parts.push('Please generate ETL specifications and DML scripts for this model.')

  return parts.join('\n')
}