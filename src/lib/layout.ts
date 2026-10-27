import type { TableModel } from './types'

const NODE_WIDTH = 260
const NODE_HEIGHT_EST = 160
const H_GAP = 100
const V_GAP = 220
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
 * Двухрядная компоновка для звёздной схемы:
 * - Измерения → верхний ряд
 * - Факты → нижний ряд
 * - Порядок внутри рядов оптимизируется алгоритмом barycenter:
 *   несколько итераций подряд пересчитывают «средний центр тяжести» связей,
 *   чтобы связанные объекты оказались рядом и связи не пересекались.
 */
export function layoutGrid(tables: TableModel[]): TableModel[] {
  if (tables.length === 0) return tables

  const facts = tables.filter(isFact)
  const dims = tables.filter((t) => !isFact(t))

  // Если фактов нет — просто сортируем по алфавиту
  if (facts.length === 0) {
    const sorted = [...dims].sort((a, b) => a.name.localeCompare(b.name))
    return sorted.map((t, i) => ({
      ...t,
      x: START_X + i * (NODE_WIDTH + H_GAP),
      y: START_Y,
    }))
  }

  // Если измерений нет — раскладываем факты в ряд
  if (dims.length === 0) {
    const sorted = [...facts].sort((a, b) => a.name.localeCompare(b.name))
    return sorted.map((t, i) => ({
      ...t,
      x: START_X + i * (NODE_WIDTH + H_GAP),
      y: START_Y,
    }))
  }

  // Строим связи между измерениями и фактами
  const dimToFacts = new Map<string, Set<string>>()
  const factToDims = new Map<string, Set<string>>()
  for (const d of dims) dimToFacts.set(d.name, new Set())
  for (const f of facts) factToDims.set(f.name, new Set())

  for (const f of facts) {
    for (const c of f.columns) {
      if (c.isFK && c.refTable) {
        const dim = dims.find((d) => d.name === c.refTable)
        if (dim) {
          dimToFacts.get(dim.name)!.add(f.name)
          factToDims.get(f.name)!.add(dim.name)
        }
      }
    }
  }

  // Начальный порядок — по алфавиту
  let dimOrder = [...dims].map((d) => d.name).sort()
  let factOrder = [...facts].map((f) => f.name).sort()

  // Несколько итераций barycenter для минимизации пересечений
  const ITERATIONS = 6
  for (let iter = 0; iter < ITERATIONS; iter++) {
    // Пересчитываем позиции фактов на основе среднего позиций измерений
    const factIndex = new Map<string, number>()
    factOrder.forEach((name, idx) => factIndex.set(name, idx))

    const dimBary = new Map<string, number>()
    for (const dName of dimOrder) {
      const factNeighbors = [...(dimToFacts.get(dName) || [])]
      if (factNeighbors.length === 0) {
        dimBary.set(dName, dimOrder.indexOf(dName))
      } else {
        const avg =
          factNeighbors.reduce((s, fn) => s + (factIndex.get(fn) ?? 0), 0) /
          factNeighbors.length
        dimBary.set(dName, avg)
      }
    }
    dimOrder.sort((a, b) => dimBary.get(a)! - dimBary.get(b)!)

    // Пересчитываем позиции измерений на основе среднего позиций фактов
    const dimIndex = new Map<string, number>()
    dimOrder.forEach((name, idx) => dimIndex.set(name, idx))

    const factBary = new Map<string, number>()
    for (const fName of factOrder) {
      const dimNeighbors = [...(factToDims.get(fName) || [])]
      if (dimNeighbors.length === 0) {
        factBary.set(fName, factOrder.indexOf(fName))
      } else {
        const avg =
          dimNeighbors.reduce((s, dn) => s + (dimIndex.get(dn) ?? 0), 0) /
          dimNeighbors.length
        factBary.set(fName, avg)
      }
    }
    factOrder.sort((a, b) => factBary.get(a)! - factBary.get(b)!)
  }

  // Размещаем измерения в верхнем ряду
  const dimRow = dims
    .slice()
    .sort((a, b) => dimOrder.indexOf(a.name) - dimOrder.indexOf(b.name))
    .map((d, idx) => ({
      ...d,
      x: START_X + idx * (NODE_WIDTH + H_GAP),
      y: START_Y,
    }))

  // Размещаем факты в нижнем ряду, центрируя относительно измерений
  const dimsRowWidth =
    dims.length > 0
      ? dims.length * NODE_WIDTH + (dims.length - 1) * H_GAP
      : 0
  const factsRowWidth =
    facts.length * NODE_WIDTH + (facts.length - 1) * H_GAP
  const factsOffsetX = Math.max(0, (dimsRowWidth - factsRowWidth) / 2)

  const factRow = facts
    .slice()
    .sort((a, b) => factOrder.indexOf(a.name) - factOrder.indexOf(b.name))
    .map((f, idx) => ({
      ...f,
      x: START_X + factsOffsetX + idx * (NODE_WIDTH + H_GAP),
      y: START_Y + NODE_HEIGHT_EST + V_GAP,
    }))

  return [...dimRow, ...factRow]
}