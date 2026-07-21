import { useState } from 'react'
import { makeId, type TableModel, type Column } from '../lib/types'

interface DetailPanelProps {
  table: TableModel
  allTables: TableModel[]
  startInEditMode: boolean
  onClose: () => void
  onSave: (table: TableModel) => void
  onDelete: (id: string) => void
}

export default function DetailPanel({
  table,
  allTables,
  startInEditMode,
  onClose,
  onSave,
  onDelete,
}: DetailPanelProps) {
  const [editMode, setEditMode] = useState(startInEditMode)
  const [name, setName] = useState(table.name)
  const [columns, setColumns] = useState<Column[]>(table.columns.map((c) => ({ ...c })))

  function handleSave() {
    onSave({ ...table, name, columns })
    setEditMode(false)
  }

  function addColumn() {
    setColumns([...columns, { id: makeId('col'), name: 'new_column', type: 'varchar(255)', isPK: false, isFK: false }])
  }

  function updateColumn(index: number, updates: Partial<Column>) {
    setColumns(columns.map((c, i) => (i === index ? { ...c, ...updates } : c)))
  }

  function removeColumn(index: number) {
    setColumns(columns.filter((_, i) => i !== index))
  }

  const otherTables = allTables.filter((t) => t.id !== table.id)

  return (
    <div className="fixed right-0 top-[60px] z-20 flex h-[calc(100vh-60px)] w-[320px] flex-col border-l border-slate-200 bg-white shadow-lg">
      <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
        {editMode ? (
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="text-[16px] font-semibold text-slate-800 border border-slate-300 rounded px-2 py-1 w-full"
          />
        ) : (
          <h2 className="text-[16px] font-semibold text-slate-800 truncate">{table.name}</h2>
        )}
        <div className="flex gap-1 ml-2 shrink-0">
          {editMode ? (
            <button onClick={handleSave} className="rounded px-2 py-1 text-[13px] font-medium text-white bg-[#1E3A5F] hover:opacity-90">
              Save
            </button>
          ) : (
            <button onClick={() => setEditMode(true)} className="rounded px-2 py-1 text-[13px] text-slate-500 hover:text-slate-700">
              ✎
            </button>
          )}
          <button onClick={onClose} className="rounded px-2 py-1 text-[13px] text-slate-400 hover:text-slate-600">
            ✕
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3">
        {editMode && (
          <button onClick={addColumn} className="mb-3 w-full rounded-md border border-dashed border-slate-300 px-3 py-2 text-[13px] text-slate-500 hover:bg-slate-50">
            + Add Column
          </button>
        )}

        {columns.map((col, index) => (
          <div key={col.id} className="mb-2 rounded-md border border-slate-200 px-3 py-2">
            {editMode ? (
              <div className="space-y-2">
                <input
                  value={col.name}
                  onChange={(e) => updateColumn(index, { name: e.target.value })}
                  placeholder="Column name"
                  className="w-full rounded border border-slate-300 px-2 py-1 text-[13px]"
                />
                <input
                  value={col.type}
                  onChange={(e) => updateColumn(index, { type: e.target.value })}
                  placeholder="Type"
                  className="w-full rounded border border-slate-300 px-2 py-1 text-[13px] font-mono"
                />
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-1 text-[12px]">
                    <input
                      type="checkbox"
                      checked={col.isPK}
                      onChange={(e) => updateColumn(index, { isPK: e.target.checked })}
                    />
                    PK
                  </label>
                  <label className="flex items-center gap-1 text-[12px]">
                    <input
                      type="checkbox"
                      checked={col.isFK}
                      onChange={(e) => updateColumn(index, { isFK: e.target.checked })}
                    />
                    FK
                  </label>
                  {col.isFK && (
                    <select
                      value={`${col.refTable || ''}.${col.refColumn || ''}`}
                      onChange={(e) => {
                        const [refTable, refColumn] = e.target.value.split('.')
                        updateColumn(index, { refTable, refColumn })
                      }}
                      className="rounded border border-slate-300 px-1 py-1 text-[12px]"
                    >
                      <option value=".">Select reference...</option>
                      {otherTables.map((t) =>
                        t.columns
                          .filter((c) => c.isPK)
                          .map((c) => (
                            <option key={`${t.name}.${c.name}`} value={`${t.name}.${c.name}`}>
                              {t.name}.{c.name}
                            </option>
                          ))
                      )}
                    </select>
                  )}
                  <button onClick={() => removeColumn(index)} className="ml-auto text-red-400 hover:text-red-600 text-[16px]">
                    ✕
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-1.5">
                {col.isPK && <span className="rounded bg-[#F59E0B] px-1 text-[10px] font-bold text-slate-900">🔑</span>}
                {col.isFK && <span className="rounded bg-[#3B82F6] px-1 text-[10px] font-bold text-white">🔗</span>}
                <span className="text-[13px] text-slate-800">{col.name}</span>
                <span className="ml-auto font-mono text-[11px] text-[#64748B]">{col.type}</span>
                {col.isFK && col.refTable && col.refColumn && (
                  <span className="text-[10px] text-slate-400">→ {col.refTable}.{col.refColumn}</span>
                )}
              </div>
            )}
          </div>
        ))}

        {columns.length === 0 && (
          <p className="py-4 text-center text-[13px] text-slate-400">No columns</p>
        )}
      </div>

      <div className="border-t border-slate-200 px-4 py-3">
        <button
          onClick={() => onDelete(table.id)}
          className="w-full rounded-md border border-red-200 bg-white px-3 py-2 text-[13px] font-medium text-red-600 hover:bg-red-50"
        >
          Delete Table
        </button>
      </div>
    </div>
  )
}