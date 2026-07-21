import type { TableModel } from '../lib/types'

interface SidebarProps {
  tables: TableModel[]
  selectedId: string | null
  onSelect: (id: string) => void
  onEdit: (id: string) => void
  onDelete: (id: string) => void
  onAddTable: () => void
  onAnalyzeCollisions: () => void
  onGenerateTestData: () => void
  onSqlHelper: () => void
  open: boolean
}

export default function Sidebar({
  tables,
  selectedId,
  onSelect,
  onEdit,
  onDelete,
  onAddTable,
  onAnalyzeCollisions,
  onGenerateTestData,
  onSqlHelper,
  open,
}: SidebarProps) {
  return (
    <>
      {open && <div className="fixed inset-0 z-20 bg-black/30 md:hidden" onClick={() => {}} />}
      <aside
        className={`${
          open ? 'translate-x-0' : '-translate-x-full'
        } fixed left-0 top-[60px] z-30 flex h-[calc(100vh-60px)] w-[280px] flex-col border-r border-slate-200 bg-white transition-transform md:static md:z-0 md:translate-x-0`}
      >
        <div className="flex-1 overflow-y-auto px-3 py-4">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-[13px] font-semibold uppercase text-slate-400">Tables</span>
            <button onClick={onAddTable} className="rounded-md bg-[#1E3A5F] px-3 py-1 text-[12px] font-medium text-white hover:opacity-90">
              + Add Table
            </button>
          </div>

          {tables.length === 0 && (
            <p className="py-4 text-center text-[13px] text-slate-400">No tables yet</p>
          )}

          {tables.map((table) => (
            <div
              key={table.id}
              onClick={() => onSelect(table.id)}
              className={`mb-1 cursor-pointer rounded-md border px-3 py-2 transition-colors ${
                selectedId === table.id
                  ? 'border-[#3B82F6] bg-blue-50'
                  : 'border-transparent hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[14px] font-medium text-slate-800 truncate">{table.name}</span>
                <div className="flex gap-1 ml-2 shrink-0">
                  <button
                    onClick={(e) => { e.stopPropagation(); onEdit(table.id) }}
                    className="rounded p-0.5 text-slate-400 hover:text-slate-600"
                    title="Edit"
                  >
                    ✎
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); onDelete(table.id) }}
                    className="rounded p-0.5 text-slate-400 hover:text-red-500"
                    title="Delete"
                  >
                    ✕
                  </button>
                </div>
              </div>
              <span className="text-[12px] text-slate-400">{table.columns.length} columns</span>
            </div>
          ))}
        </div>

        <div className="border-t border-slate-200 px-3 py-3 space-y-2">
          <button onClick={onAnalyzeCollisions} className="w-full rounded-md bg-[#1E3A5F] px-3 py-2 text-[13px] font-medium text-white hover:opacity-90">
            Analyze Collisions
          </button>
          <button onClick={onGenerateTestData} className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-[13px] font-medium text-slate-700 hover:bg-slate-50">
            Generate Test Data
          </button>
          <button onClick={onSqlHelper} className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-[13px] font-medium text-slate-700 hover:bg-slate-50">
            SQL Helper
          </button>
        </div>
      </aside>
    </>
  )
}