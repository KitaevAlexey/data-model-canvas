import type { TableModel } from './types'

const NODE_WIDTH = 260
const NODE_HEIGHT_EST = 160
const H_GAP = 160
const V_GAP = 280
const START_X = 60
const START_Y = 60

function isFact(table: TableModel): boolean {
  const fkCount = table.columns.filter((c) => c.isFK).length
  const lname = table.name.toLowerCase()
  if (fkCount >= 2) return true
  if (/^fact|^fct|факт/.test(lname)) return true
  return false
}

/**
 * Упрощённый Sugiyama-подобный алгоритм для звёздной схемы:
 * 1. Layer assignment — измерения на слой 0, факты на слой 1.
 * 2. Crossing reduction — итеративный barycenter с медианным уточнением.
 * 3. Coordinate assignment — фиксированные x с центрированием.
 */
export function layoutGrid(tables: TableModel[]): TableModel[] {
  if (tables.length === 0) return tables

  const facts = tables.filter(isFact)
  const dims = tables.filter((t) => !isFact(t))

  // Если одна из групп пуста — раскладываем в один ряд
  if (facts.length === 0 || dims.length === 0) {
    const sorted = [...tables].sort((a, b) => a.name.localeCompare(b.name))
    return sorted.map((t, i) => ({
      ...t,
      x: START_X + i * (NODE_WIDTH + H_GAP),
      y: START_Y,
    }))
  }

  // Строим матрицу связей факт → измерения
  const factToDims = new Map<string, string[]>()
  const dimToFacts = new Map<string, string[]>()
  for (const f of facts) {
    factToDims.set(f.name, [])
    for (const c of f.columns) {
      if (c.isFK && c.refTable) {
        const dim = dims.find((d) => d.name === c.refTable)
        if (dim) {
          factToDims.get(f.name)!.push(dim.name)
          if (!dimToFacts.has(dim.name)) dimToFacts.set(dim.name, [])
          dimToFacts.get(dim.name)!.push(f.name)
        }
      }
    }
  }

  let dimOrder = [...dims].map((d) => d.name).sort()
  let factOrder = [...facts].map((f) => f.name).sort()

  // Итеративное улучшение порядка (barycenter + median refinement)
  for (let iter = 0; iter < 8; iter++) {
    // Пересчёт порядка измерений на основе позиций фактов
    const factPos = new Map<string, number>()
    factOrder.forEach((name, i) => factPos.set(name, i))

    const dimScores = new Map<string, number>()
    for (const dName of dimOrder) {
      const neighbors = dimToFacts.get(dName) || []
      if (neighbors.length === 0) {
        dimScores.set(dName, dimOrder.indexOf(dName))
      } else {
        // Barycenter: средняя позиция связанных фактов
        const bary = neighbors.reduce((s, f) => s + (factPos.get(f) ?? 0), 0) / neighbors.length
        dimScores.set(dName, bary)
      }
    }
    dimOrder.sort((a, b) => dimScores.get(a)! - dimScores.get(b)!)

    // Пересчёт порядка фактов на основе позиций измерений
    const dimPos = new Map<string, number>()
    dimOrder.forEach((name, i) => dimPos.set(name, i))

    const factScores = new Map<string, number>()
    for (const fName of factOrder) {
      const neighbors = factToDims.get(fName) || []
      if (neighbors.length === 0) {
        factScores.set(fName, factOrder.indexOf(fName))
      } else {
        const bary = neighbors.reduce((s, d) => s + (dimPos.get(d) ?? 0), 0) / neighbors.length
        factScores.set(fName, bary)
      }
    }
    factOrder.sort((a, b) => factScores.get(a)! - factScores.get(b)!)
  }

  // Назначение координат
  const dimRow = dims
    .slice()
    .sort((a, b) => dimOrder.indexOf(a.name) - dimOrder.indexOf(b.name))
    .map((d, i) => ({
      ...d,
      x: START_X + i * (NODE_WIDTH + H_GAP),
      y: START_Y,
    }))

  const dimsWidth = dims.length * NODE_WIDTH + (dims.length - 1) * H_GAP
  const factsWidth = facts.length * NODE_WIDTH + (facts.length - 1) * H_GAP
  const offsetX = Math.max(0, (dimsWidth - factsWidth) / 2)

  const factRow = facts
    .slice()
    .sort((a, b) => factOrder.indexOf(a.name) - factOrder.indexOf(b.name))
    .map((f, i) => ({
      ...f,
      x: START_X + offsetX + i * (NODE_WIDTH + H_GAP),
      y: START_Y + NODE_HEIGHT_EST + V_GAP,
    }))

  return [...dimRow, ...factRow]
}