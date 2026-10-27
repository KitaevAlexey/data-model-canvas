import dagre from 'dagre'
import type { TableModel } from './types'

const NODE_WIDTH = 260
const ROW_H = 26
const HEADER_H = 40
const PADDING = 16

function getNodeHeight(table: TableModel): number {
  const rows = table.columns.length || 1
  return HEADER_H + PADDING + rows * ROW_H
}

export function layoutGrid(tables: TableModel[]): TableModel[] {
  if (tables.length === 0) return tables

  const g = new dagre.graphlib.Graph()
  g.setGraph({
    rankdir: 'TB', // Top to Bottom: Измерения сверху, факты снизу
    nodesep: 120,  // Горизонтальный отступ между таблицами
    ranksep: 160,  // Вертикальный отступ между слоями
    marginx: 60,
    marginy: 60,
  })
  g.setDefaultEdgeLabel(() => ({}))

  // Добавляем узлы
  for (const t of tables) {
    g.setNode(t.name, { width: NODE_WIDTH, height: getNodeHeight(t) })
  }

  // Добавляем связи (FK)
  for (const t of tables) {
    for (const c of t.columns) {
      if (c.isFK && c.refTable) {
        // Проверяем, что таблица-цель существует в графе
        if (tables.some((target) => target.name === c.refTable)) {
          g.setEdge(t.name, c.refTable)
        }
      }
    }
  }

  // Считаем раскладку
  dagre.layout(g)

  // Применяем новые координаты к таблицам
  return tables.map((t) => {
    const nodeInfo = g.node(t.name)
    // Dagre возвращает координаты центра узла. 
    // Переводим их в левый верхний угол для React Flow
    return {
      ...t,
      x: nodeInfo.x - NODE_WIDTH / 2,
      y: nodeInfo.y - getNodeHeight(t) / 2,
    }
  })
}