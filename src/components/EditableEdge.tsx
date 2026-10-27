import { useState, useCallback } from 'react'
import {
  BaseEdge,
  EdgeLabelRenderer,
  getSmoothStepPath,
  getBezierPath,
  getStraightPath,
  type EdgeProps,
} from '@xyflow/react'

export default function EditableEdge(props: EdgeProps) {
  const {
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
  } = props

  const edgeType = (data?.edgeType as string) || 'smoothstep'
  const currentBendY = data?.bendY as number | undefined
  const onBendChange = data?.onBendChange as ((id: string, y: number) => void) | undefined

  const defaultBendY = (sourceY + targetY) / 2
  const [bendY, setBendY] = useState<number>(currentBendY ?? defaultBendY)

  let edgePath = ''
  let labelX = 0
  let labelY = 0

  if (edgeType === 'smoothstep') {
    ;[edgePath, labelX, labelY] = getSmoothStepPath({
      sourceX,
      sourceY,
      sourcePosition,
      targetX,
      targetY,
      targetPosition,
      centerY: bendY,
      borderRadius: 8,
    })
  } else if (edgeType === 'bezier') {
    ;[edgePath, labelX, labelY] = getBezierPath({
      sourceX,
      sourceY,
      sourcePosition,
      targetX,
      targetY,
      targetPosition,
      curvature: 0.5,
    })
  } else {
    // straight
    ;[edgePath, labelX, labelY] = getStraightPath({
      sourceX,
      sourceY,
      targetX,
      targetY,
    })
  }

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
      
      {/* Кружок для захвата показываем только для типа smoothstep */}
      {edgeType === 'smoothstep' && (
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
            <div className="w-3 h-3 bg-white border-2 border-slate-400 rounded-full hover:border-blue-500 hover:scale-125 transition-transform" />
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  )
}