import ELK from 'elkjs/lib/elk.bundled.js'
import type { TableModel } from './types'

const elk = new ELK()

const NODE_WIDTH = 260
const ROW_H = 26
const HEADER_H = 40
const PADDING = 16

function getNodeHeight(table: TableModel): number {
  const rows = table.columns.length || 1
  return HEADER_H + PADDING + rows * ROW_H
}

export async function layoutGrid(tables: TableModel[]): Promise<TableModel[]> {
  if (tables.length === 0) return tables

  const graph = {
    id: 'root',
    layoutOptions: {
      'elk.algorithm': 'layered',
      'elk.direction': 'DOWN',
      'elk.spacing.nodeNode': '120',           
      'elk.layered.spacing.nodeNodeBetweenLayers': '180', 
      'elk.layered.crossingMinimization.strategy': 'LAYER_SWEEP',
      'elk.layered.nodePlacement.strategy': 'NETWORK_SIMPLEX',
      'elk.edgeRouting': 'ORTHOGONAL',         
    },
    children: tables.map((t) => ({
      id: t.name,
      width: NODE_WIDTH,
      height: getNodeHeight(t),
    })),
    edges: tables.flatMap((t) =>
      t.columns
        .filter((c) => c.isFK && c.refTable && tables.some((tgt) => tgt.name === c.refTable))
        .map((c) => ({
          id: `${t.name}-${c.refTable}-${c.id}`,
          sources: [t.name],
          // Исправление TS: добавляем "as string", так как мы уже отфильтровали undefined выше
          targets: [c.refTable as string],
        }))
    ),
  }

  try {
    const layout = await elk.layout(graph)
    return tables.map((t) => {
      const node = layout.children?.find((n) => n.id === t.name)
      return {
        ...t,
        x: node?.x || 0,
        y: node?.y || 0,
      }
    })
  } catch (err) {
    console.error('ELK layout failed:', err)
    return tables
  }
}