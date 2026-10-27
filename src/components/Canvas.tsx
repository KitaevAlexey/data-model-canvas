import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'

import type { TableModel } from '../lib/types'
import TableNode from './TableNode'

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

const nodeTypes = { table: TableNode }

const defaultEdgeOptions = {
  type: 'smoothstep', // Красивые ортогональные скругленные линии (как на схемах)
  animated: false,
  style: { strokeWidth: 2, stroke: '#94A3B8' },
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
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([])
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([])

  // Синхронизация входящих данных с состоянием React Flow
  useEffect(() => {
    const newNodes: Node[] = tables.map((t) => ({
      id: t.id,
      type: 'table',
      position: { x: t.x, y: t.y },
      data: { table: t, isError: highlightedTableIds.has(t.id) },
      selected: selectedId === t.id,
    }))

    const newEdges: Edge[] = []
    for (const t of tables) {
      for (const c of t.columns) {
        if (c.isFK && c.refTable) {
          const target = tables.find((tgt) => tgt.name === c.refTable)
          if (target) {
            const edgeKey = `${t.id}:${c.id}`
            const isError = highlightedEdgeKeys.has(edgeKey)
            newEdges.push({
              id: edgeKey,
              source: t.id,
              target: target.id,
              ...defaultEdgeOptions,
              style: {
                strokeWidth: 2,
                stroke: isError ? '#EF4444' : '#94A3B8',
                strokeDasharray: isError ? '6 4' : undefined,
              },
            })
          }
        }
      }
    }

    setNodes(newNodes)
    setEdges(newEdges)
  }, [tables, highlightedTableIds, highlightedEdgeKeys, selectedId, setNodes, setEdges])

  // Обновляем координаты в родительском состоянии только после окончания перетаскивания
  const onNodeDragStop = useCallback(
    (_: React.MouseEvent, node: Node) => {
      onMoveTable(node.id, node.position.x, node.position.y)
    },
    [onMoveTable]
  )

  // Обработка клика по узлу
  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      onSelect(node.id)
    },
    [onSelect]
  )

  return (
    <div className="relative flex-1 bg-[#F8FAFC]">
      {tables.length === 0 && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-4 px-4 text-center bg-white/80 backdrop-blur-sm">
          <p className="max-w-sm text-[15px] text-slate-500">Загрузите модель данных, чтобы начать</p>
          <div className="flex flex-wrap justify-center gap-3">
            <button onClick={() => onImportClick('s2t')} className="rounded-md bg-[#1E3A5F] px-4 py-2 text-[14px] font-medium text-white hover:opacity-90">
              Загрузить S2T
            </button>
            <button onClick={() => onImportClick('excel')} className="rounded-md bg-[#1E3A5F] px-4 py-2 text-[14px] font-medium text-white hover:opacity-90">
              Загрузить Excel
            </button>
            <button onClick={() => onImportClick('csv')} className="rounded-md bg-[#1E3A5F] px-4 py-2 text-[14px] font-medium text-white hover:opacity-90">
              Загрузить CSV
            </button>
          </div>
          <button onClick={onLoadSample} className="text-[13px] text-[#3B82F6] underline hover:opacity-80">
            Загрузить пример модели
          </button>
        </div>
      )}

      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeDragStop={onNodeDragStop}
        onNodeClick={onNodeClick}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.1}
        maxZoom={2}
        proOptions={{ hideAttribution: true }} // Скрываем логотип ReactFlow в правом нижнем углу
      >
        <Background color="#E2E8F0" gap={20} size={1} />
        <Controls />
        <MiniMap
          nodeColor={(n) => {
            const table = n.data.table as TableModel
            const isFact = table.columns.filter((c) => c.isFK).length >= 2 || /^fact|^fct/i.test(table.name)
            return isFact ? '#1E3A5F' : '#CBD5E1'
          }}
          maskColor="rgba(248, 250, 252, 0.7)"
          className="!bg-white !border-slate-200 !shadow-sm"
        />
      </ReactFlow>
    </div>
  )
}