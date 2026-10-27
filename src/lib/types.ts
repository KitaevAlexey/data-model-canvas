export interface Column {
  id: string
  name: string
  type: string
  isPK: boolean
  isFK: boolean
  refTable?: string
  refColumn?: string
  edgeBendY?: number // Оставляем для обратной совместимости, но используем LayoutState
}

export interface TableModel {
  id: string
  name: string
  x: number
  y: number
  columns: Column[]
}

export interface LayoutState {
  positions: Record<string, { x: number; y: number }>
  edgeBends: Record<string, number>
}

export interface ModelState {
  tables: TableModel[]
  layouts: Record<string, LayoutState> // Ключ - имя вкладки ('overview', 'FactSales' и т.д.)
}

export type EdgeType = 'smoothstep' | 'straight' | 'bezier'

export function makeId(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}${Math.random().toString(36).slice(2, 6)}`
}

export function emptyModel(): ModelState {
  return { tables: [], layouts: {} }
}