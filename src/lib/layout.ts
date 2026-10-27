import type { TableModel } from './types'

const NODE_WIDTH = 260
const NODE_HEIGHT_EST = 160
const H_GAP = 120
const V_GAP = 180
const START_X = 60
const START_Y = 60

/**
 * Многоуровневая компоновка:
 * 1. Каждая таблица получает слой = максимальная длина цепочки FK от «корней».
 *    Корни (измерения без входящих FK) — слой 0. Факты — слой N.
 * 2. Внутри слоя таблицы упорядочиваются по «барицентру» — средней позиции
 *    родителей. Это снижает число пересечений связей.
 * 3. Слои центрируются по горизонтали — композиция выглядит сбалансированной.
 */
export function layoutGrid(tables: TableModel[]): TableModel[] {
  if (tables.length === 0) return tables

  const byName = new Map(tables.map((t) => [t.name, t]))

  const parents = new Map<string, Set<string>>()
  const children = new Map<string, Set<string>>()
  for (const t of tables) {
    parents.set(t.name, new Set())
    children.set(t.name, new Set())
  }
  for (const t of tables) {
    for (const c of t.columns) {
      if (c.isFK && c.refTable && byName.has(c.refTable) && c.refTable !== t.name) {
        parents.get(t.name)!.add(c.refTable)
        children.get(c.refTable)!.add(t.name)
      }
    }
  }

  // Слой через самую длинную цепочку от корня; защита от циклов
  const layer = new Map<string, number>()
  const visiting = new Set<string>()

  function computeLayer(name: string): number {
    if (layer.has(name)) return layer.get(name)!
    if (visiting.has(name)) return 0
    visiting.add(name)
    let maxParentLayer = -1
    for (const p of parents.get(name)!) {
      maxParentLayer = Math.max(maxParentLayer, computeLayer(p))
    }
    visiting.delete(name)
    const result = maxParentLayer + 1
    layer.set(name, result)
    return result
  }
  for (const t of tables) computeLayer(t.name)

  const layers = new Map<number, TableModel[]>()
  for (const t of tables) {
    const l = layer.get(t.name) ?? 0
    if (!layers.has(l)) layers.set(l, [])
    layers.get(l)!.push(t)
  }

  const sortedLayerNums = [...layers.keys()].sort((a, b) => a - b)
  const xIndex = new Map<string, number>()

  for (const layerNum of sortedLayerNums) {
    const nodes = layers.get(layerNum)!
    if (layerNum === 0) {
      nodes.sort((a, b) => a.name.localeCompare(b.name))
    } else {
      nodes.sort((a, b) => {
        const bary = (t: TableModel) => {
          const xs = [...parents.get(t.name)!]
            .map((p) => xIndex.get(p))
            .filter((v): v is number => v !== undefined)
          if (xs.length === 0) return 0
          return xs.reduce((s, v) => s + v, 0) / xs.length
        }
        const diff = bary(a) - bary(b)
        if (Math.abs(diff) < 0.001) return a.name.localeCompare(b.name)
        return diff
      })
    }
    nodes.forEach((t, idx) => xIndex.set(t.name, idx))
    layers.set(layerNum, nodes)
  }

  const result: TableModel[] = []
  const maxPerLayer = Math.max(...[...layers.values()].map((arr) => arr.length))

  for (const layerNum of sortedLayerNums) {
    const nodes = layers.get(layerNum)!
    const layerWidth = nodes.length * NODE_WIDTH + (nodes.length - 1) * H_GAP
    const totalWidth = maxPerLayer * NODE_WIDTH + (maxPerLayer - 1) * H_GAP
    const offsetX = (totalWidth - layerWidth) / 2

    nodes.forEach((t, idx) => {
      result.push({
        ...t,
        x: START_X + offsetX + idx * (NODE_WIDTH + H_GAP),
        y: START_Y + layerNum * (NODE_HEIGHT_EST + V_GAP),
      })
    })
  }

  return result
}