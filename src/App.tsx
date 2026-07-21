import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import TopBar from './components/TopBar'
import Sidebar from './components/Sidebar'
import Canvas from './components/Canvas'
import DetailPanel from './components/DetailPanel'
import CollisionsModal from './components/modals/CollisionsModal'
import TestDataModal from './components/modals/TestDataModal'
import SqlHelperModal from './components/modals/SqlHelperModal'
import TextExportModal from './components/modals/TextExportModal'
import { loadModel, saveModel, clearModel } from './lib/storage'
import { emptyModel, makeId, type ModelState, type TableModel } from './lib/types'
import { parseS2T, generateS2T } from './lib/parsers/s2t'
import { parseExcel, generateExcel } from './lib/parsers/excel'
import { parseCSV } from './lib/parsers/csv'
import { layoutGrid } from './lib/layout'
import { buildSampleModel } from './lib/sample'
import { generateDDL } from './lib/ddl'
import { generateAIPrompt } from './lib/aiPrompt'
import { analyzeCollisions, type CollisionIssue } from './lib/collisions'

type ActiveModal =
  | { kind: 'none' }
  | { kind: 'collisions'; issues: CollisionIssue[] }
  | { kind: 'test-data' }
  | { kind: 'sql-helper' }
  | { kind: 'text-export'; title: string; content: string; fileName?: string }

export default function App() {
  const [model, setModel] = useState<ModelState>(emptyModel())
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [detailEditMode, setDetailEditMode] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [modal, setModal] = useState<ActiveModal>({ kind: 'none' })
  const [highlightedTableIds, setHighlightedTableIds] = useState<Set<string>>(new Set())
  const hasLoaded = useRef(false)

  useEffect(() => {
    const stored = loadModel()
    if (stored) setModel(stored)
    hasLoaded.current = true
  }, [])

  useEffect(() => {
    if (!hasLoaded.current) return
    saveModel(model)
  }, [model])

  const selectedTable = useMemo(
    () => model.tables.find((t) => t.id === selectedId) ?? null,
    [model.tables, selectedId]
  )

  const highlightedEdgeKeys = useMemo(() => {
    if (modal.kind !== 'collisions') return new Set<string>()
    const keys = new Set<string>()
    for (const t of model.tables) {
      for (const c of t.columns) {
        if (highlightedTableIds.has(t.id)) keys.add(`${t.id}:${c.id}`)
      }
    }
    return keys
  }, [modal, highlightedTableIds, model.tables])

  const applyImportedTables = useCallback((tables: TableModel[]) => {
    setModel((m) => ({ tables: layoutGrid([...m.tables, ...tables]) }))
  }, [])

  const handleImportS2T = useCallback(
    (file: File) => {
      const reader = new FileReader()
      reader.onload = () => {
        try {
          const tables = parseS2T(String(reader.result ?? ''))
          console.log('Parsed S2T tables:', tables.map((t) => t.name))
          applyImportedTables(tables)
        } catch (err) {
          console.error('S2T parse error:', err)
          window.alert('Could not parse S2T file. Please check the format.')
        }
      }
      reader.readAsText(file)
    },
    [applyImportedTables]
  )

  const handleImportExcel = useCallback(
    (file: File) => {
      const reader = new FileReader()
      reader.onload = () => {
        try {
          const tables = parseExcel(reader.result as ArrayBuffer)
          console.log('Parsed Excel tables:', tables.map((t) => t.name))
          applyImportedTables(tables)
        } catch (err) {
          console.error('Excel parse error:', err)
          window.alert('Could not parse Excel file. Please check the format.')
        }
      }
      reader.readAsArrayBuffer(file)
    },
    [applyImportedTables]
  )

  const handleImportCSV = useCallback(
    (file: File) => {
      const reader = new FileReader()
      reader.onload = () => {
        try {
          const tables = parseCSV(String(reader.result ?? ''))
          console.log('Parsed CSV tables:', tables.map((t) => t.name))
          applyImportedTables(tables)
        } catch (err) {
          console.error('CSV parse error:', err)
          window.alert('Could not parse CSV file. Please check the format.')
        }
      }
      reader.readAsText(file)
    },
    [applyImportedTables]
  )

  const handleLoadSample = useCallback(() => {
    setModel({ tables: buildSampleModel() })
  }, [])

  const handleImportClick = useCallback(
    (format: 's2t' | 'excel' | 'csv') => {
      const input = document.createElement('input')
      input.type = 'file'
      input.accept = format === 's2t' ? '.s2t,.txt' : format === 'excel' ? '.xlsx' : '.csv'
      input.onchange = (e) => {
        const file = (e.target as HTMLInputElement).files?.[0]
        if (!file) return
        if (format === 's2t') handleImportS2T(file)
        else if (format === 'excel') handleImportExcel(file)
        else handleImportCSV(file)
      }
      input.click()
    },
    [handleImportS2T, handleImportExcel, handleImportCSV]
  )

  const handleMoveTable = useCallback((id: string, x: number, y: number) => {
    setModel((m) => ({ tables: m.tables.map((t) => (t.id === id ? { ...t, x, y } : t)) }))
  }, [])

  const handleAddTable = useCallback(() => {
    const newTable: TableModel = {
      id: makeId('tbl'),
      name: `NewTable_${model.tables.length + 1}`,
      x: 0,
      y: 0,
      columns: [],
    }
    setModel((m) => ({ tables: layoutGrid([...m.tables, newTable]) }))
    setSelectedId(newTable.id)
    setDetailEditMode(true)
  }, [model.tables.length])

  const handleSaveTable = useCallback((table: TableModel) => {
    setModel((m) => ({ tables: m.tables.map((t) => (t.id === table.id ? table : t)) }))
  }, [])

  const handleDeleteTable = useCallback((id: string) => {
    if (!window.confirm('Delete this table? This cannot be undone.')) return
    setModel((m) => ({
      tables: m.tables
        .filter((t) => t.id !== id)
        .map((t) => ({
          ...t,
          columns: t.columns.map((c) =>
            c.refTable && m.tables.find((rt) => rt.id === id)?.name === c.refTable
              ? { ...c, isFK: false, refTable: undefined, refColumn: undefined }
              : c
          ),
        })),
    }))
    setSelectedId((cur) => (cur === id ? null : cur))
  }, [])

  const handleClearCanvas = useCallback(() => {
    if (!window.confirm('Clear the entire canvas? All tables will be removed permanently.')) return
    setModel(emptyModel())
    clearModel()
    setSelectedId(null)
  }, [])

  const handleAnalyzeCollisions = useCallback(() => {
    const issues = analyzeCollisions(model.tables)
    setModal({ kind: 'collisions', issues })
  }, [model.tables])

  const handleHighlight = useCallback((tableIds: string[]) => {
    setHighlightedTableIds(new Set(tableIds))
  }, [])

  function closeModal() {
    setModal({ kind: 'none' })
    setHighlightedTableIds(new Set())
  }

  function handleExportExcel() {
    const data = generateExcel(model.tables)
    const blob = new Blob([data], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'model.xlsx'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="flex h-screen flex-col bg-[#F8FAFC]">
      <TopBar
        onImportS2T={handleImportS2T}
        onImportExcel={handleImportExcel}
        onImportCSV={handleImportCSV}
        onExportDDL={() =>
          setModal({ kind: 'text-export', title: 'Export DDL', content: generateDDL(model.tables) })
        }
        onExportS2T={() =>
          setModal({
            kind: 'text-export',
            title: 'Export S2T',
            content: generateS2T(model.tables),
            fileName: 'model.s2t',
          })
        }
        onExportAIPrompt={() =>
          setModal({
            kind: 'text-export',
            title: 'Export AI Prompt',
            content: generateAIPrompt(model.tables),
          })
        }
        onExportExcel={handleExportExcel}
        onClearCanvas={handleClearCanvas}
        onToggleSidebar={() => setSidebarOpen((v) => !v)}
      />

      <div className="relative flex flex-1 overflow-hidden">
        <Sidebar
          tables={model.tables}
          selectedId={selectedId}
          onSelect={(id) => {
            setSelectedId(id)
            setDetailEditMode(false)
            setSidebarOpen(false)
          }}
          onEdit={(id) => {
            setSelectedId(id)
            setDetailEditMode(true)
            setSidebarOpen(false)
          }}
          onDelete={handleDeleteTable}
          onAddTable={handleAddTable}
          onAnalyzeCollisions={handleAnalyzeCollisions}
          onGenerateTestData={() => setModal({ kind: 'test-data' })}
          onSqlHelper={() => setModal({ kind: 'sql-helper' })}
          open={sidebarOpen}
        />

        <Canvas
          tables={model.tables}
          selectedId={selectedId}
          onSelect={(id) => {
            setSelectedId(id)
            setDetailEditMode(false)
          }}
          onMoveTable={handleMoveTable}
          highlightedTableIds={highlightedTableIds}
          highlightedEdgeKeys={highlightedEdgeKeys}
          onLoadSample={handleLoadSample}
          onImportClick={handleImportClick}
        />

        {selectedTable && (
          <DetailPanel
            key={selectedTable.id}
            table={selectedTable}
            allTables={model.tables}
            startInEditMode={detailEditMode}
            onClose={() => setSelectedId(null)}
            onSave={handleSaveTable}
            onDelete={handleDeleteTable}
          />
        )}
      </div>

      {modal.kind === 'collisions' && (
        <CollisionsModal
          issues={modal.issues}
          onClose={closeModal}
          onHighlight={handleHighlight}
        />
      )}
      {modal.kind === 'test-data' && (
        <TestDataModal tables={model.tables} onClose={closeModal} />
      )}
      {modal.kind === 'sql-helper' && (
        <SqlHelperModal tables={model.tables} onClose={closeModal} />
      )}
      {modal.kind === 'text-export' && (
        <TextExportModal
          title={modal.title}
          content={modal.content}
          fileName={modal.fileName}
          onClose={closeModal}
        />
      )}
    </div>
  )
}