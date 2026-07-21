import { useCallback, useMemo, useRef, useState, type WheelEvent } from 'react'
import type { TableModel } from '../lib/types'

const NODE_WIDTH = 260
const HEADER_H = 40
const ROW_H = 26
const PADDING_TOP = 8

interface CanvasProps {
  tables: TableModel[]
  selectedId: string | null
  onSelect: (id: string) => void
  onMoveTable: (id: string, x: number, y: number) => void
  highlightedTableIds: Set<string>
  highlightedEdgeKeys: Set<string>
  onLoadSample: () => void
  onImportClick: (format: 's2t' | 'excel' | 'csv') => void
}

function columnPortY(colIndex: number): number {
  return HEADER_H + PADDING_TOP + colIndex * ROW_H + ROW_H / 2
}

export default function Canvas({
  tables,
  selectedId,
  onSelect,
  onMoveTable,
  highlightedTableIds,
  highlightedEdgeKeys,
  onLoadSample,
  onImportClick,
}: CanvasProps) {
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const containerRef = useRef<HTMLDivElement>(null)
  const dragState = useRef<{
    mode: 'pan' | 'node'
    id?: string
    startX: number
    startY: number
    origX: number
    origY: number
  } | null>(null)

  const byName = useMemo(() => new Map(tables.map((t) => [t.name, t])), [tables])

  const startPan = useCallback(
    (clientX: number, clientY: number) => {
      dragState.current = { mode: 'pan', startX: clientX, startY: clientY, origX: pan.x, origY: pan.y }
    },
    [pan]
  )

  const startNodeDrag = useCallback(
    (id: string, clientX: number, clientY: number, table: TableModel) => {
      dragState.current = { mode: 'node', id, startX: clientX, startY: clientY, origX: table.x, origY: table.y }
    },
    []
  )

  const handleMove = useCallback(
    (clientX: number, clientY: number) => {
      const ds = dragState.current
      if (!ds) return
      const dx = clientX - ds.startX
      const dy = clientY - ds.startY
      if (ds.mode === 'pan') {
        setPan({ x: ds.origX + dx, y: ds.origY + dy })
      } else if (ds.mode === 'node' && ds.id) {
        onMoveTable(ds.id, ds.origX + dx / zoom, ds.origY + dy / zoom)
      }
    },
    [onMoveTable, zoom]
  )

  const endDrag = useCallback(() => {
    dragState.current = null
  }, [])

  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault()
    setZoom((z) => Math.min(2, Math.max(0.3, z - e.deltaY * 0.001)))
  }, [])

  const connections = useMemo(() => {
    const lines: { key: string; d: string; error: boolean }[] = []
    for (const table of tables) {
      table.columns.forEach((col, colIndex) => {
        if (!col.isFK || !col.refTable || !col.refColumn) return
        const target = byName.get(col.refTable)
        if (!target) return
        const targetColIndex = target.columns.findIndex((c) => c.name === col.refColumn)
        if (targetColIndex === -1) return

        const sourceOnLeft = table.x < target.x
        const sy = table.y + columnPortY(colIndex)
        const ty = target.y + columnPortY(targetColIndex)
        const sx = sourceOnLeft ? table.x + NODE_WIDTH : table.x
        const tx = sourceOnLeft ? target.x : target.x + NODE_WIDTH
        const curve = Math.max(60, Math.abs(tx - sx) / 3)
        const c1x = sourceOnLeft ? sx + curve : sx - curve
        const c2x = sourceOnLeft ? tx - curve : tx + curve

        const key = `${table.id}:${col.id}`
        lines.push({
          key,
          d: `M ${sx} ${sy} C ${c1x} ${sy}, ${c2x} ${ty}, ${tx} ${ty}`,
          error: highlightedEdgeKeys.has(key),
        })
      })
    }
    return lines
  }, [tables, byName, highlightedEdgeKeys])

  const bounds = useMemo(() => {
    let maxX = 800
    let maxY = 600
    for (const t of tables) {
      maxX = Math.max(maxX, t.x + NODE_WIDTH + 200)
      maxY = Math.max(maxY, t.y + HEADER_H + PADDING_TOP + t.columns.length * ROW_H + 200)
    }
    return { width: maxX, height: maxY }
  }, [tables])

  return (
    <div
      ref={containerRef}
      className="relative flex-1 overflow-hidden bg-white"
      style={{
        backgroundImage: 'radial-gradient(circle, #E2E8F0 1px, transparent 1px)',
        backgroundSize: '20px 20px',
        backgroundPosition: `${pan.x}px ${pan.y}px`,
      }}
      onWheel={handleWheel}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget || (e.target as HTMLElement).dataset.canvasBg) {
          startPan(e.clientX, e.clientY)
        }
      }}
      onMouseMove={(e) => handleMove(e.clientX, e.clientY)}
      onMouseUp={endDrag}
      onMouseLeave={endDrag}
      onTouchMove={(e) => {
        const t = e.touches[0]
        if (t) handleMove(t.clientX, t.clientY)
      }}
      onTouchEnd={endDrag}
    >
      {tables.length === 0 && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-4 px-4 text-center">
          <p className="max-w-sm text-[15px] text-slate-500">Import your data model to get started</p>
          <div className="flex flex-wrap justify-center gap-3">
            <button onClick={() => onImportClick('s2t')} className="rounded-md bg-[#1E3A5F] px-4 py-2 text-[14px] font-medium text-white hover:opacity-90">
              Import S2T
            </button>
            <button onClick={() => onImportClick('excel')} className="rounded-md bg-[#1E3A5F] px-4 py-2 text-[14px] font-medium text-white hover:opacity-90">
              Import Excel
            </button>
            <button onClick={() => onImportClick('csv')} className="rounded-md bg-[#1E3A5F] px-4 py-2 text-[14px] font-medium text-white hover:opacity-90">
              Import CSV
            </button>
          </div>
          <button onClick={onLoadSample} className="text-[13px] text-[#3B82F6] underline hover:opacity-80">
            Load Sample Model
          </button>
        </div>
      )}

      <div
        data-canvas-bg="true"
        className="absolute left-0 top-0"
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transformOrigin: '0 0',
          width: bounds.width,
          height: bounds.height,
        }}
      >
        <svg
          className="pointer-events-none absolute left-0 top-0"
          width={bounds.width}
          height={bounds.height}
          style={{ overflow: 'visible' }}
        >
          <defs>
            <marker id="arrow" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
              <path d="M0,0 L8,4 L0,8 Z" fill="#94A3B8" />
            </marker>
            <marker id="arrow-error" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
              <path d="M0,0 L8,4 L0,8 Z" fill="#EF4444" />
            </marker>
          </defs>
          {connections.map((line) => (
            <path
              key={line.key}
              d={line.d}
              fill="none"
              stroke={line.error ? '#EF4444' : '#94A3B8'}
              strokeWidth={2}
              strokeDasharray={line.error ? '6 4' : undefined}
              markerEnd={line.error ? 'url(#arrow-error)' : 'url(#arrow)'}
            />
          ))}
        </svg>

        {tables.map((table) => {
          const isSelected = selectedId === table.id
          const isError = highlightedTableIds.has(table.id)
          return (
            <div
              key={table.id}
              onMouseDown={(e) => {
                e.stopPropagation()
                startNodeDrag(table.id, e.clientX, e.clientY, table)
              }}
              onTouchStart={(e) => {
                e.stopPropagation()
                const t = e.touches[0]
                if (t) startNodeDrag(table.id, t.clientX, t.clientY, table)
              }}
              onClick={(e) => {
                e.stopPropagation()
                onSelect(table.id)
              }}
              className={`absolute cursor-grab select-none rounded-lg border bg-white shadow-sm active:cursor-grabbing ${
                isError
                  ? 'border-red-500 shadow-[0_0_0_2px_rgba(239,68,68,0.15)]'
                  : isSelected
                    ? 'border-[#3B82F6] shadow-[0_0_0_3px_rgba(59,130,246,0.15)]'
                    : 'border-slate-300'
              }`}
              style={{ left: table.x, top: table.y, width: NODE_WIDTH }}
            >
              <div className="truncate rounded-t-lg border-b border-slate-200 bg-slate-50 px-3 py-2 text-[14px] font-semibold text-slate-800">
                {table.name}
              </div>
              <div className="px-1 py-1">
                {table.columns.map((col) => (
                  <div key={col.id} className="flex items-center gap-1.5 px-2" style={{ height: ROW_H }}>
                    {col.isPK && (
                      <span className="rounded bg-[#F59E0B] px-1 text-[10px] font-bold leading-4 text-slate-900" title="Primary Key">
                        🔑
                      </span>
                    )}
                    {col.isFK && (
                      <span className="rounded bg-[#3B82F6] px-1 text-[10px] font-bold leading-4 text-white" title="Foreign Key">
                        🔗
                      </span>
                    )}
                    <span className="truncate text-[13px] text-slate-800">{col.name}</span>
                    <span className="ml-auto shrink-0 truncate font-mono text-[11px] text-[#64748B]">{col.type}</span>
                  </div>
                ))}
                {table.columns.length === 0 && (
                  <div className="px-2 py-1 text-[12px] italic text-slate-400">No columns</div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}