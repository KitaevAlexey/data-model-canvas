import type { TableModel } from './types'

const NODE_WIDTH = 260
const NODE_HEIGHT = 180
const START_X = 60
const START_Y = 60
const IDEAL_EDGE = 380
const ITERATIONS = 400
const PADDING = 80

/**
 * Force-directed layout:
 * - Узлы отталкиваются друг от друга (кулоновская сила).
 * - Связанные узлы притягиваются (пружины).
 * - Узлы слегка тянутся к центру, чтобы не разлетались.
 * - Начальная раскладка — сетка (детерминированная).
 * Результат — минимизирует пересечения связей и даёт "органичную" компоновку.
 */
export function layoutGrid(tables: TableModel[]): TableModel[] {
  if (tables.length === 0) return tables
  if (tables.length === 1) {
    return [{ ...tables[0], x: START_X, y: START_Y }]
  }

  const byName = new Map(tables.map((t) => [t.name, t]))
  const edges: [string, string][] = []
  for (const t of tables) {
    for (const c of t.columns) {
      if (c.isFK && c.refTable && byName.has(c.refTable) && c.refTable !== t.name) {
        edges.push([t.name, c.refTable])
      }
    }
  }

  const N = tables.length
  const positions = new Map<string, { x: number; y: number }>()

  // Детерминированная начальная раскладка — сетка
  const cols = Math.ceil(Math.sqrt(N))
  tables.forEach((t, i) => {
    const col = i % cols
    const row = Math.floor(i / cols)
    positions.set(t.name, {
      x: col * (NODE_WIDTH + IDEAL_EDGE),
      y: row * (NODE_HEIGHT + IDEAL_EDGE),
    })
  })

  const minNodeDist = Math.max(NODE_WIDTH, NODE_HEIGHT) + 60

  for (let iter = 0; iter < ITERATIONS; iter++) {
    const temp = 1 - iter / ITERATIONS // остывание
    const forces = new Map<string, { fx: number; fy: number }>()
    for (const t of tables) forces.set(t.name, { fx: 0, fy: 0 })

    // Отталкивание всех пар
    for (let i = 0; i < N; i++) {
      for (let j = i + 1; j < N; j++) {
        const a = positions.get(tables[i].name)!
        const b = positions.get(tables[j].name)!
        const dx = a.x - b.x
        const dy = a.y - b.y
        const dist = Math.sqrt(dx * dx + dy * dy) || 0.01
        const nx = dx / dist
        const ny = dy / dist

        if (dist < minNodeDist) {
          // Жёсткое расталкивание — ноды не должны пересекаться
          const push = (minNodeDist - dist) * 0.9
          forces.get(tables[i].name)!.fx += nx * push
          forces.get(tables[i].name)!.fy += ny * push
          forces.get(tables[j].name)!.fx -= nx * push
          forces.get(tables[j].name)!.fy -= ny * push
        } else {
          // Мягкое отталкивание
          const repulsion = (IDEAL_EDGE * IDEAL_EDGE) / dist
          forces.get(tables[i].name)!.fx += nx * repulsion * 0.3
          forces.get(tables[i].name)!.fy += ny * repulsion * 0.3
          forces.get(tables[j].name)!.fx -= nx * repulsion * 0.3
          forces.get(tables[j].name)!.fy -= ny * repulsion * 0.3
        }
      }
    }

    // Притяжение вдоль связей
    for (const [a, b] of edges) {
      const pa = positions.get(a)!
      const pb = positions.get(b)!
      const dx = pb.x - pa.x
      const dy = pb.y - pa.y
      const dist = Math.sqrt(dx * dx + dy * dy) || 0.01
      const nx = dx / dist
      const ny = dy / dist
      const attraction = (dist * dist) / IDEAL_EDGE
      forces.get(a)!.fx += nx * attraction * 0.15
      forces.get(a)!.fy += ny * attraction * 0.15
      forces.get(b)!.fx -= nx * attraction * 0.15
      forces.get(b)!.fy -= ny * attraction * 0.15
    }

    // Гравитация к центру
    for (const t of tables) {
      const p = positions.get(t.name)!
      forces.get(t.name)!.fx -= p.x * 0.012
      forces.get(t.name)!.fy -= p.y * 0.012
    }

    // Применяем силы с ограничением шага
    const maxStep = 60 * temp
    for (const t of tables) {
      const p = positions.get(t.name)!
      const f = forces.get(t.name)!
      const stepX = Math.max(-maxStep, Math.min(maxStep, f.fx * 0.05))
      const stepY = Math.max(-maxStep, Math.min(maxStep, f.fy * 0.05))
      p.x += stepX
      p.y += stepY
    }
  }

  // Нормализуем координаты
  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity
  for (const p of positions.values()) {
    minX = Math.min(minX, p.x)
    minY = Math.min(minY, p.y)
    maxX = Math.max(maxX, p.x + NODE_WIDTH)
    maxY = Math.max(maxY, p.y + NODE_HEIGHT)
  }

  return tables.map((t) => {
    const p = positions.get(t.name)!
    return {
      ...t,
      x: Math.round(p.x - minX + START_X + PADDING),
      y: Math.round(p.y - minY + START_Y + PADDING),
    }
  })
}