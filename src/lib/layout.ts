import type { TableModel } from './types'

const GRID_COLS = 3
const CELL_W = 320
const CELL_H = 280
const START_X = 60
const START_Y = 60

export function layoutGrid(tables: TableModel[]): TableModel[] {
  return tables.map((t, idx) => {
    const col = idx % GRID_COLS
    const row = Math.floor(idx / GRID_COLS)
    return { ...t, x: START_X + col * CELL_W, y: START_Y + row * CELL_H }
  })
}