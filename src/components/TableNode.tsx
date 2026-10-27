import { memo } from 'react'
import { Handle, Position, type NodeProps } from '@xyflow/react'
import type { TableModel } from '../lib/types'

const NODE_WIDTH = 260
const ROW_H = 26

function TableNode({ data, selected }: NodeProps) {
  // data приводим к типу TableModel
  const table = data.table as TableModel
  const isError = data.isError as boolean

  const fkCount = table.columns.filter((c) => c.isFK).length
  const isFact = fkCount >= 2 || /^fact|^fct/i.test(table.name)

  return (
    <div
      className={`rounded-lg border bg-white shadow-sm ${
        isError
          ? 'border-red-500 shadow-[0_0_0_2px_rgba(239,68,68,0.15)]'
          : selected
            ? 'border-[#3B82F6] shadow-[0_0_0_3px_rgba(59,130,246,0.15)]'
            : 'border-slate-300'
      }`}
      style={{ width: NODE_WIDTH }}
    >
      {/* Верхний порт для входящих связей */}
      <Handle type="target" position={Position.Top} className="!bg-transparent !border-none" />

      <div
        className={`truncate rounded-t-lg border-b px-3 py-2 text-[14px] font-semibold ${
          isFact
            ? 'border-[#1E3A5F]/30 bg-[#1E3A5F] text-white'
            : 'border-slate-200 bg-slate-50 text-slate-800'
        }`}
      >
        {table.name}
      </div>
      <div className="px-1 py-1">
        {table.columns.map((col) => (
          <div key={col.id} className="flex items-center gap-1.5 px-2" style={{ height: ROW_H }}>
            {col.isPK && (
              <span className="rounded bg-[#F59E0B] px-1 text-[10px] font-bold leading-4 text-slate-900" title="Первичный ключ">
                🔑
              </span>
            )}
            {col.isFK && (
              <span className="rounded bg-[#3B82F6] px-1 text-[10px] font-bold leading-4 text-white" title="Внешний ключ">
                🔗
              </span>
            )}
            <span className="truncate text-[13px] text-slate-800">{col.name}</span>
            <span className="ml-auto shrink-0 truncate font-mono text-[11px] text-[#64748B]">{col.type}</span>
          </div>
        ))}
        {table.columns.length === 0 && (
          <div className="px-2 py-1 text-[12px] italic text-slate-400">Нет колонок</div>
        )}
      </div>

      {/* Нижний порт для исходящих связей */}
      <Handle type="source" position={Position.Bottom} className="!bg-transparent !border-none" />
    </div>
  )
}

export default memo(TableNode)