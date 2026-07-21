import { useState } from 'react'
import type { TableModel } from '../../lib/types'

interface SqlHelperModalProps {
  tables: TableModel[]
  onClose: () => void
}

function generateQueries(tables: TableModel[]) {
  const results: { label: string; sql: string }[] = []

  for (const table of tables) {
    const fks = table.columns.filter((c) => c.isFK && c.refTable)
    const nonPK = table.columns.filter((c) => !c.isPK)

    // Select with all joins
    if (fks.length > 0) {
      let sql = `SELECT *\nFROM ${table.name}`
      for (const fk of fks) {
        sql += `\n  LEFT JOIN ${fk.refTable} ON ${table.name}.${fk.name} = ${fk.refTable}.${fk.refColumn}`
      }
      results.push({ label: `${table.name}: Select with all joins`, sql })
    }

    // Aggregate by dimension
    if (fks.length > 0 && nonPK.some((c) => c.type.includes('int') || c.type.includes('decimal'))) {
      const numCol = nonPK.find((c) => c.type.includes('int') || c.type.includes('decimal'))
      const fk = fks[0]
      if (numCol && fk.refTable) {
        const refTable = tables.find((t) => t.name === fk.refTable)
        if (refTable) {
          const dimCol = refTable.columns.find((c) => !c.isPK)
          if (dimCol) {
            const sql = `SELECT ${fk.refTable}.${dimCol.name}, COUNT(*) AS count, SUM(${table.name}.${numCol.name}) AS total\nFROM ${table.name}\n  JOIN ${fk.refTable} ON ${table.name}.${fk.name} = ${fk.refTable}.${fk.refColumn}\nGROUP BY ${fk.refTable}.${dimCol.name}`
            results.push({ label: `${table.name}: Aggregate by ${refTable.name}`, sql })
          }
        }
      }
    }

    // Find duplicates
    if (nonPK.length > 0) {
      const cols = nonPK.slice(0, 3).map((c) => c.name).join(', ')
      const sql = `SELECT ${cols}, COUNT(*) AS duplicates\nFROM ${table.name}\nGROUP BY ${cols}\nHAVING COUNT(*) > 1`
      results.push({ label: `${table.name}: Find duplicates`, sql })
    }

    // Referential integrity check
    if (fks.length > 0) {
      const fk = fks[0]
      if (fk.refTable && fk.refColumn) {
        const sql = `SELECT ${table.name}.*\nFROM ${table.name}\n  LEFT JOIN ${fk.refTable} ON ${table.name}.${fk.name} = ${fk.refTable}.${fk.refColumn}\nWHERE ${fk.refTable}.${fk.refColumn} IS NULL`
        results.push({ label: `${table.name}: Orphaned rows check`, sql })
      }
    }
  }

  return results
}

export default function SqlHelperModal({ tables, onClose }: SqlHelperModalProps) {
  const [selectedSql, setSelectedSql] = useState('')

  const queries = generateQueries(tables)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div
        className="mx-4 max-h-[80vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <h3 className="text-[16px] font-semibold text-slate-800">SQL Helper</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-[18px]">✕</button>
        </div>

        <div className="px-5 py-4 space-y-3">
          {queries.length === 0 && (
            <p className="text-center text-[14px] text-slate-400">Add tables with relationships first</p>
          )}
          {queries.map((q, idx) => (
            <button
              key={idx}
              onClick={() => setSelectedSql(q.sql)}
              className="block w-full rounded-md border border-slate-200 px-3 py-2 text-left text-[13px] text-slate-700 hover:bg-slate-50"
            >
              {q.label}
            </button>
          ))}

          {selectedSql && (
            <>
              <pre className="max-h-64 overflow-y-auto rounded-md bg-slate-900 p-3 text-[11px] text-green-300 whitespace-pre-wrap">
                {selectedSql}
              </pre>
              <button
                onClick={() => navigator.clipboard.writeText(selectedSql)}
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-[13px] font-medium text-slate-700 hover:bg-slate-50"
              >
                Copy to Clipboard
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}