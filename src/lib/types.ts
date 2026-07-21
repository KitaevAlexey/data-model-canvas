export interface Column {
  id: string
  name: string
  type: string
  isPK: boolean
  isFK: boolean
  refTable?: string
  refColumn?: string
}

export interface TableModel {
  id: string
  name: string
  x: number
  y: number
  columns: Column[]
}

export interface ModelState {
  tables: TableModel[]
}

export function makeId(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}${Math.random().toString(36).slice(2, 6)}`
}

export function emptyModel(): ModelState {
  return { tables: [] }
}