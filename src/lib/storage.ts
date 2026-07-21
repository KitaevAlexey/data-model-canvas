import type { ModelState } from './types'

const STORAGE_KEY = 'data-model-canvas:state:v1'

export function loadModel(): ModelState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (parsed && Array.isArray(parsed.tables)) return parsed as ModelState
    return null
  } catch {
    return null
  }
}

export function saveModel(model: ModelState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(model))
  } catch {
    // ignore
  }
}

export function clearModel(): void {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    // ignore
  }
}