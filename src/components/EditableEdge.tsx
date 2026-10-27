import { useState, useCallback } from 'react'
import {
  BaseEdge,
  EdgeLabelRenderer,
  getSmoothStepPath,
  type EdgeProps,
} from '@xyflow/react'

export default function EditableEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  data,
}: EdgeProps) {
  // data.bendY - сохраненное смещение, data.onBendChange - коллбэк для сохранения
  const currentBendY = data?.bendY as number | undefined
  const onBendChange = data?.onBendChange as ((id: string, y: number) => void) | undefined

  // Если смещение не задано, ставим линию ровно посередине
  const defaultBendY = (sourceY + targetY) / 2
  const [bendY, setBendY] = useState<number>(currentBendY ?? defaultBendY)

  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    centerY: bendY, // Применяем наше смещение
    borderRadius: 8,
  })

  const onPointerDown = useCallback(
    (event: React.PointerEvent) => {
      event.stopPropagation()
      const startY = event.clientY
      const startBendY = bendY

      const onPointerMove = (moveEvent: PointerEvent) => {
        const deltaY = moveEvent.clientY - startY
        const newBendY = startBendY + deltaY
        setBendY(newBendY)
        onBendChange?.(id, newBendY)
      }

      const onPointerUp = () => {
        document.removeEventListener('pointermove', onPointerMove)
        document.removeEventListener('pointerup', onPointerUp)
      }

      document.addEventListener('pointermove', onPointerMove)
      document.addEventListener('pointerup', onPointerUp)
    },
    [bendY, id, onBendChange]
  )

  return (
    <>
      <BaseEdge path={edgePath} markerEnd={markerEnd} style={style} />
      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px,${bendY}px)`,
            pointerEvents: 'all',
          }}
          className="nodrag nopan cursor-ns-resize"
          onPointerDown={onPointerDown}
        >
          {/* Кружок для захвата линии */}
          <div className="w-3 h-3 bg-white border-2 border-slate-400 rounded-full hover:border-blue-500 hover:scale-125 transition-transform" />
        </div>
      </EdgeLabelRenderer>
    </>
  )
}