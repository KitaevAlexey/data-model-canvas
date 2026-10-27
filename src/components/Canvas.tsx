import { useCallback, useEffect, forwardRef, useImperativeHandle } from 'react'
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  useReactFlow,
  ReactFlowProvider,
  getNodesBounds,
  getViewportForBounds,
  type Node,
  type Edge,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { toPng } from 'html-to-image'

import type { TableModel, EdgeType, LayoutState } from '../lib/types'
import TableNode from './TableNode'
import EditableEdge from './EditableEdge'

interface CanvasProps {
  tables: TableModel[]
  layout: LayoutState
  selectedId: string | null
  onSelect: (id: string) => void
  onMoveTable: (id: string, x: number, y: number) => void
  onEdgeBendChange: (edgeKey: string, bendY: number) => void
  edgeType: EdgeType
  highlightedTableIds: Set<string>
  highlightedEdgeKeys: Set<string>
  onLoadSample: () => void
  onImportClick: (format: 's2t' | 'excel' | 'csv') => void
}

export interface CanvasRef {
  exportPng: () => void
}

const nodeTypes = { table: TableNode }
const edgeTypes = { editable: EditableEdge }

const CanvasInner = forwardRef<CanvasRef, CanvasProps>(({
  tables,
  layout,
  selectedId,
  onSelect,
  onMoveTable,
  onEdgeBendChange,
  edgeType,
  highlightedTableIds,
  highlightedEdgeKeys,
  onLoadSample,
  onImportClick,
}, ref) => {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([])
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([])
  const { getNodes } = useReactFlow()

  // Экспорт в PNG
  useImperativeHandle(ref, () => ({
    exportPng: () => {
      const nodesBounds = getNodesBounds(getNodes())
      
      // Делаем отступы вокруг схемы, чтобы она не обрезалась
      const padding = 100
      const width = nodesBounds.width + padding * 2
      const height = nodesBounds.height + padding * 2

      // Рассчитываем viewport, чтобы все таблицы влезли в кадр.
      // 6-й аргумент (padding) передаем как 0, так как мы уже учли его в width/height
      const viewport = getViewportForBounds(nodesBounds, width, height, 0.5, 2, 0)

      const viewportElement = document.querySelector('.react-flow__viewport') as HTMLElement
      if (!viewportElement) return

      toPng(viewportElement, {
        backgroundColor: '#F8FAFC',
        width: width,
        height: height,
        style: {
          width: `${width}px`,
          height: `${height}px`,
          transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom})`,
        },
      }).then((dataUrl) => {
        const a = document.createElement('a')
        a.href = dataUrl
        a.download = 'diagram.png'
        a.click()
      }).catch((err) => {
        console.error('Ошибка экспорта PNG:', err)
        window.alert('Не удалось сохранить изображение.')
      })
    }
  }))

  useEffect(() => {
    const newNodes: Node[] = tables.map((t) => {
      const pos = layout.positions[t.id] || { x: t.x, y: t.y }
      return {
        id: t.id,
        type: 'table',
        position: pos,
        data: { table: t, isError: highlightedTableIds.has(t.id) },
        selected: selectedId === t.id,
      }
    })

    const newEdges: Edge[] = []
    for (const t of tables) {
      for (const c of t.columns) {
        if (c.isFK && c.refTable) {
          const target = tables.find((tgt) => tgt.name === c.refTable)
          if (target) {
            const edgeKey = `${t.id}:${c.id}`
            const isError = highlightedEdgeKeys.has(edgeKey)
            
            const posT = layout.positions[t.id] || { x: t.x, y: t.y }
            const posTarget = layout.positions[target.id] || { x: target.x, y: target.y }
            const dx = posTarget.x - posT.x
            const dy = posTarget.y - posT.y
            
            let sourceHandle = 'source-bottom'
            let targetHandle = 'target-top'

            if (Math.abs(dx) > Math.abs(dy)) {
              if (dx > 0) { sourceHandle = 'source-right'; targetHandle = 'target-left' }
              else { sourceHandle = 'source-left'; targetHandle = 'target-right' }
            } else {
              if (dy > 0) { sourceHandle = 'source-bottom'; targetHandle = 'target-top' }
              else { sourceHandle = 'source-top'; targetHandle = 'target-bottom' }
            }

            newEdges.push({
              id: edgeKey,
              source: t.id,
              target: target.id,
              sourceHandle,
              targetHandle,
              type: 'editable',
              data: {
                edgeType,
                bendY: layout.edgeBends[edgeKey],
                onBendChange: onEdgeBendChange,
              },
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
  }, [tables, layout, highlightedTableIds, highlightedEdgeKeys, selectedId, onEdgeBendChange, edgeType, setNodes, setEdges])

  const onNodeDragStop = useCallback(
    (_: MouseEvent | TouchEvent, node: Node) => {
      onMoveTable(node.id, node.position.x, node.position.y)
    },
    [onMoveTable]
  )

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
            <button onClick={() => onImportClick('s2t')} className="rounded-md bg-[#1E3A5F] px-4 py-2 text-[14px] font-medium text-white hover:opacity-90">Загрузить S2T</button>
            <button onClick={() => onImportClick('excel')} className="rounded-md bg-[#1E3A5F] px-4 py-2 text-[14px] font-medium text-white hover:opacity-90">Загрузить Excel</button>
            <button onClick={() => onImportClick('csv')} className="rounded-md bg-[#1E3A5F] px-4 py-2 text-[14px] font-medium text-white hover:opacity-90">Загрузить CSV</button>
          </div>
          <button onClick={onLoadSample} className="text-[13px] text-[#3B82F6] underline hover:opacity-80">Загрузить пример модели</button>
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
        edgeTypes={edgeTypes}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.1}
        maxZoom={2}
        proOptions={{ hideAttribution: true }}
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
})

const Canvas = forwardRef<CanvasRef, CanvasProps>((props, ref) => (
  <ReactFlowProvider>
    <CanvasInner {...props} ref={ref} />
  </ReactFlowProvider>
))

export default Canvas