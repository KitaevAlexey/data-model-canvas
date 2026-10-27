import type { TableModel } from './types'

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
  if (tables.length === 1) return [{ ...tables[0], x: 800, y: 800 }]

  // 1. Находим центральную таблицу фактов (максимум исходящих FK)
  let factTable = tables[0]
  let maxFks = -1
  for (const t of tables) {
    const fkCount = t.columns.filter((c) => c.isFK).length
    if (fkCount > maxFks || t.name.toLowerCase().includes('fact')) {
      maxFks = fkCount
      factTable = t
    }
  }

  // 2. Обход в ширину (BFS) для определения уровней (слоёв)
  const levels = new Map<string, number>()
  const parents = new Map<string, string | null>()
  levels.set(factTable.name, 0)
  parents.set(factTable.name, null)

  const queue = [factTable.name]
  while (queue.length > 0) {
    const currentName = queue.shift()!
    const currentLevel = levels.get(currentName)!

    for (const t of tables) {
      if (levels.has(t.name)) continue

      // Проверяем, есть ли связь между t и currentName
      const hasEdgeToCurrent = t.columns.some((c) => c.isFK && c.refTable === currentName)
      const currentTableObj = tables.find((x) => x.name === currentName)
      const currentHasEdgeTo = currentTableObj?.columns.some((c) => c.isFK && c.refTable === t.name)

      if (hasEdgeToCurrent || currentHasEdgeTo) {
        levels.set(t.name, currentLevel + 1)
        parents.set(t.name, currentName)
        queue.push(t.name)
      }
    }
  }

  // Если есть оторванные таблицы без связей — отправляем их на 3-й уровень
  for (const t of tables) {
    if (!levels.has(t.name)) {
      levels.set(t.name, 3)
      parents.set(t.name, factTable.name)
    }
  }

  // 3. Группируем таблицы по уровням
  const nodesByLevel = new Map<number, string[]>()
  for (const [name, level] of levels.entries()) {
    if (!nodesByLevel.has(level)) nodesByLevel.set(level, [])
    nodesByLevel.get(level)!.push(name)
  }

  const positions = new Map<string, { x: number; y: number }>()
  
  // Центр холста
  const CENTER_X = 1500
  const CENTER_Y = 1500
  const RADIUS_1 = 600  // Радиус для прямых измерений
  const RADIUS_2 = 1200 // Радиус для измерений 2-го уровня

  // 4. Ставим Факт в центр
  positions.set(factTable.name, {
    x: CENTER_X - NODE_WIDTH / 2,
    y: CENTER_Y - getNodeHeight(factTable) / 2,
  })

  const angleMap = new Map<string, number>()

  // 5. Расставляем 1-й уровень по кругу
  const level1 = nodesByLevel.get(1) || []
  const angleStep = (2 * Math.PI) / (level1.length || 1)

  level1.forEach((name, i) => {
    const angle = i * angleStep
    angleMap.set(name, angle)
    const table = tables.find((t) => t.name === name)!
    
    positions.set(name, {
      x: CENTER_X + RADIUS_1 * Math.cos(angle) - NODE_WIDTH / 2,
      y: CENTER_Y + RADIUS_1 * Math.sin(angle) - getNodeHeight(table) / 2,
    })
  })

  // 6. Расставляем 2-й и последующие уровни (снежинка)
  const maxLevel = Math.max(...Array.from(levels.values()))
  for (let lvl = 2; lvl <= maxLevel; lvl++) {
    const nodes = nodesByLevel.get(lvl) || []
    const byParent = new Map<string, string[]>()
    
    for (const n of nodes) {
      const p = parents.get(n)!
      if (!byParent.has(p)) byParent.set(p, [])
      byParent.get(p)!.push(n)
    }

    for (const [parentName, children] of byParent.entries()) {
      let baseAngle = angleMap.get(parentName) || 0
      
      // Немного раздвигаем дочерние элементы вокруг угла родителя
      const spread = Math.PI / 4
      const step = children.length > 1 ? spread / (children.length - 1) : 0
      
      children.forEach((childName, i) => {
         const angle = baseAngle - spread / 2 + i * step
         angleMap.set(childName, angle)
         
         // Увеличиваем радиус для каждого следующего уровня
         const r = RADIUS_1 + (lvl - 1) * (RADIUS_2 - RADIUS_1)
         const table = tables.find((t) => t.name === childName)!
         
         positions.set(childName, {
           x: CENTER_X + r * Math.cos(angle) - NODE_WIDTH / 2,
           y: CENTER_Y + r * Math.sin(angle) - getNodeHeight(table) / 2,
         })
      })
    }
  }

  return tables.map((t) => {
    const pos = positions.get(t.name) || { x: 0, y: 0 }
    return {
      ...t,
      x: Math.round(pos.x),
      y: Math.round(pos.y),
    }
  })
}