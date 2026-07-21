import { useState } from 'react'
import type { TableModel } from '../../lib/types'

interface TestDataModalProps {
  tables: TableModel[]
  onClose: () => void
}

function randomString(length: number): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
  return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

function randomDate(): string {
  const start = new Date()
  start.setFullYear(start.getFullYear() - 2)
  const d = new Date(start.getTime() + Math.random() * (Date.now() - start.getTime()))
  return d.toISOString().split('T')[0]
}

function generateInserts(tables: TableModel[], rowCount: number): string {
  const pkValues = new Map<string, number[]>()
  const result: string[] = []

  // Generate PK values first
  for (const table of tables) {
    const pks: number[] = []
    for (let i = 1; i <= rowCount; i++) {
      pks.push(i)
    }
    pkValues.set(table.name, pks)
  }

  // Generate INSERTs
  for (const table of tables) {
    const pk = pkValues.get(table.name)!
    for (let r = 0; r < rowCount; r++) {
      const values: string[] = []
      for (const col of table.columns) {
        if (col.isPK) {
          values.push(String(pk[r]))
        } else if (col.isFK && col.refTable) {
          const refPks = pkValues.get(col.refTable)
          if (refPks && refPks.length > 0) {
            values.push(String(refPks[Math.floor(Math.random() * refPks.length)]))
          } else {
            values.push('1')
          }
        } else if (col.type === 'int' || col.type === 'bigint') {
          values.push(String(Math.floor(Math.random() * 100000)))
        } else if (col.type.startsWith('varchar')) {
          const len = parseInt(col.type.match(/\d+/)?.[0] || '50')
          values.push(`'${randomString(Math.min(len, 20))}'`)
        } else if (col.type === 'date') {
          values.push(`'${randomDate()}'`)
        } else if (col.type.startsWith('decimal')) {
          values.push((Math.random() * 10000).toFixed(2))
        } else {
          values.push(`'sample_${randomString(8)}'`)
        }
      }
      result.push(`INSERT INTO ${table.name} VALUES (${values.join(', ')});`)
    }
    result.push('')
  }

  return result.join('\n')
}

export default function TestDataModal({ tables, onClose }: TestDataModalProps) {
  const [rowCount, setRowCount] = useState(100)
  const [sql, setSql] = useState('')
  const [generated, setGenerated] = useState(false)

  function handleGenerate() {
    setSql(generateInserts(tables, rowCount))
    setGenerated(true)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div
        className="mx-4 max-h-[80vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <h3 className="text-[16px] font-semibold text-slate-800">Generate Test Data</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-[18px]">✕</button>
        </div>

        <div className="px-5 py-4 space-y-3">
          <div className="flex items-center gap-3">
            <label className="text-[13px] text-slate-600">Rows per table:</label>
            <input
              type="number"
              min={10}
              max={1000}
              value={rowCount}
              onChange={(e) => setRowCount(Number(e.target.value))}
              className="w-24 rounded border border-slate-300 px-2 py-1 text-[13px]"
            />
            <button
              onClick={handleGenerate}
              className="rounded-md bg-[#1E3A5F] px-4 py-1.5 text-[13px] font-medium text-white hover:opacity-90"
            >
              Generate
            </button>
          </div>

          {generated && (
            <>
              <pre className="max-h-96 overflow-y-auto rounded-md bg-slate-900 p-3 text-[11px] text-green-300 whitespace-pre-wrap">
                {sql}
              </pre>
              <button
                onClick={() => navigator.clipboard.writeText(sql)}
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