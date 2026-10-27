import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import TopBar from './components/TopBar'
import Sidebar from './components/Sidebar'
import Canvas, { type CanvasRef } from './components/Canvas'
import DetailPanel from './components/DetailPanel'
import DiagramTabs from './components/DiagramTabs'
import CollisionsModal from './components/modals/CollisionsModal'
import TestDataModal from './components/modals/TestDataModal'
import SqlHelperModal from './components/modals/SqlHelperModal'
import TextExportModal from './components/modals/TextExportModal'
import { loadModel, saveModel, clearModel } from './lib/storage'
import { emptyModel, makeId, type ModelState, type TableModel, type EdgeType, type LayoutState } from './lib/types'
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
  const [edgeType, setEdgeType] = useState<EdgeType>('bezier')
  const [activeTab, setActiveTab] = useState<string>('overview')
  const hasLoaded = useRef(false)
  const canvasRef = useRef<CanvasRef>(null)

  useEffect(() => {
    const stored = loadModel()
    if (stored) setModel(stored)
    hasLoaded.current = true
  }, [])

  useEffect(() => {
    if (!hasLoaded.current) return
    saveModel(model)
  }, [model])

  // Следим, чтобы активная вкладка не "сломалась", если таблицу удалили
  useEffect(() => {
    if (activeTab !== 'overview' && !model.tables.some(t => t.name === activeTab)) {
      setActiveTab('overview')
    }
  }, [model.tables, activeTab])

  // Фильтруем таблицы для текущей вкладки
  const activeTables = useMemo(() => {
    if (activeTab === 'overview') return model.tables

    const factTable = model.tables.find(t => t.name === activeTab)
    if (!factTable) return model.tables

    const relevantNames = new Set<string>([factTable.name])
    
    // 1-й уровень (прямые измерения)
    factTable.columns.forEach(c => {
      if (c.isFK && c.refTable) relevantNames.add(c.refTable)
    })
    
    // 2-й уровень (снежинка)
    model.tables.forEach(t => {
      if (relevantNames.has(t.name)) {
        t.columns.forEach(c => {
          if (c.isFK && c.refTable) relevantNames.add(c.refTable)
        })
      }
    })

    return model.tables.filter(t => relevantNames.has(t.name))
  }, [model.tables, activeTab])

  // Инициализация раскладки при первом открытии вкладки
  useEffect(() => {
    if (activeTables.length > 0 && !model.layouts[activeTab]) {
      let isMounted = true
      layoutGrid(activeTables).then(laidOut => {
        if (!isMounted) return
        const positions: Record<string, { x: number; y: number }> = {}
        laidOut.forEach(t => { positions[t.id] = { x: t.x, y: t.y } })
        
        setModel(m => ({
          ...m,
          layouts: {
            ...m.layouts,
            [activeTab]: { positions, edgeBends: {} }
          }
        }))
      })
      return () => { isMounted = false }
    }
  }, [activeTab, activeTables, model.layouts])

  const selectedTable = useMemo(
    () => model.tables.find((t) => t.id === selectedId) ?? null,
    [model.tables, selectedId]
  )

  const highlightedEdgeKeys = useMemo(() => {
    if (modal.kind !== 'collisions') return new Set<string>()
    const keys = new Set<string>()
    for (const t of activeTables) {
      for (const c of t.columns) {
        if (highlightedTableIds.has(t.id)) keys.add(`${t.id}:${c.id}`)
      }
    }
    return keys
  }, [modal, highlightedTableIds, activeTables])

  const applyImportedTables = useCallback(async (newTables: TableModel[]) => {
    setModel((m) => {
      const combined = [...m.tables, ...newTables]
      layoutGrid(combined).then((laidOut) => {
        const positions: Record<string, { x: number; y: number }> = {}
        laidOut.forEach(t => { positions[t.id] = { x: t.x, y: t.y } })
        
        setModel(prev => ({ 
          tables: laidOut,
          layouts: {
            ...prev.layouts,
            overview: { positions, edgeBends: {} }
          }
        }))
        setActiveTab('overview')
      })
      return m 
    })
  }, [])

  const handleImportS2T = useCallback(
    (file: File) => {
      const reader = new FileReader()
      reader.onload = () => {
        try {
          const tables = parseS2T(String(reader.result ?? ''))
          applyImportedTables(tables)
        } catch (err) {
          console.error('S2T parse error:', err)
          window.alert('Не удалось разобрать S2T-файл. Проверьте формат.')
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
          applyImportedTables(tables)
        } catch (err) {
          console.error('Excel parse error:', err)
          window.alert('Не удалось разобрать Excel-файл. Проверьте формат.')
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
          applyImportedTables(tables)
        } catch (err) {
          console.error('CSV parse error:', err)
          window.alert('Не удалось разобрать CSV-файл. Проверьте формат.')
        }
      }
      reader.readAsText(file)
    },
    [applyImportedTables]
  )

  const handleLoadSample = useCallback(async () => {
    const laidOut = await layoutGrid(buildSampleModel())
    const positions: Record<string, { x: number; y: number }> = {}
    laidOut.forEach(t => { positions[t.id] = { x: t.x, y: t.y } })
    
    setModel({ 
      tables: laidOut, 
      layouts: { overview: { positions, edgeBends: {} } } 
    })
    setActiveTab('overview')
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
    setModel((m) => ({
      ...m,
      layouts: {
        ...m.layouts,
        [activeTab]: {
          ...(m.layouts[activeTab] || { positions: {}, edgeBends: {} }),
          positions: {
            ...(m.layouts[activeTab]?.positions || {}),
            [id]: { x, y }
          }
        }
      }
    }))
  }, [activeTab])

  const handleEdgeBendChange = useCallback((edgeKey: string, newBendY: number) => {
    setModel((m) => ({
      ...m,
      layouts: {
        ...m.layouts,
        [activeTab]: {
          ...(m.layouts[activeTab] || { positions: {}, edgeBends: {} }),
          edgeBends: {
            ...(m.layouts[activeTab]?.edgeBends || {}),
            [edgeKey]: newBendY
          }
        }
      }
    }))
  }, [activeTab])

  const handleAddTable = useCallback(async () => {
    const newTable: TableModel = {
      id: makeId('tbl'),
      name: `NewTable_${model.tables.length + 1}`,
      x: 0,
      y: 0,
      columns: [],
    }
    setModel(m => ({ ...m, tables: [...m.tables, newTable] }))
    setSelectedId(newTable.id)
    setDetailEditMode(true)
    setActiveTab('overview')
  }, [model.tables.length])

  const handleSaveTable = useCallback((table: TableModel) => {
    setModel((m) => ({ ...m, tables: m.tables.map((t) => (t.id === table.id ? table : t)) }))
  }, [])

  const handleDeleteTable = useCallback((id: string) => {
    if (!window.confirm('Удалить эту таблицу? Действие нельзя отменить.')) return
    setModel((m) => ({
      ...m,
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
    if (!window.confirm('Очистить весь холст? Все таблицы будут удалены безвозвратно.')) return
    setModel(emptyModel())
    clearModel()
    setSelectedId(null)
    setActiveTab('overview')
  }, [])

  const handleAnalyzeCollisions = useCallback(() => {
    const issues = analyzeCollisions(activeTables)
    setModal({ kind: 'collisions', issues })
  }, [activeTables])

  const handleRelayout = useCallback(async () => {
    const laidOut = await layoutGrid(activeTables)
    const positions: Record<string, { x: number; y: number }> = {}
    laidOut.forEach(t => { positions[t.id] = { x: t.x, y: t.y } })
    
    setModel(m => ({
      ...m,
      layouts: {
        ...m.layouts,
        [activeTab]: { positions, edgeBends: {} }
      }
    }))
  }, [activeTables, activeTab])

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

  const emptyLayout: LayoutState = { positions: {}, edgeBends: {} }

  return (
    <div className="flex h-screen flex-col bg-[#F8FAFC]">
      <TopBar
        onImportS2T={handleImportS2T}
        onImportExcel={handleImportExcel}
        onImportCSV={handleImportCSV}
        onExportDDL={() =>
          setModal({ kind: 'text-export', title: 'Экспорт DDL', content: generateDDL(model.tables) })
        }
        onExportS2T={() =>
          setModal({
            kind: 'text-export',
            title: 'Экспорт S2T',
            content: generateS2T(model.tables),
            fileName: 'model.s2t',
          })
        }
        onExportAIPrompt={() =>
          setModal({
            kind: 'text-export',
            title: 'Экспорт AI-промпта',
            content: generateAIPrompt(model.tables),
          })
        }
        onExportExcel={handleExportExcel}
        onExportPNG={() => canvasRef.current?.exportPng()}
        onClearCanvas={handleClearCanvas}
        onToggleSidebar={() => setSidebarOpen((v) => !v)}
      />

      <div className="relative flex flex-1 overflow-hidden">
        <Sidebar
          tables={activeTables}
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
          onRelayout={handleRelayout}
          edgeType={edgeType}
          onEdgeTypeChange={setEdgeType}
          open={sidebarOpen}
        />

        <div className="flex flex-1 flex-col overflow-hidden">
          <DiagramTabs
            tables={model.tables}
            activeTab={activeTab}
            onTabChange={setActiveTab}
          />
          <Canvas
            ref={canvasRef}
            tables={activeTables}
            layout={model.layouts[activeTab] || emptyLayout}
            selectedId={selectedId}
            onSelect={(id) => {
              setSelectedId(id)
              setDetailEditMode(false)
            }}
            onMoveTable={handleMoveTable}
            onEdgeBendChange={handleEdgeBendChange}
            edgeType={edgeType}
            highlightedTableIds={highlightedTableIds}
            highlightedEdgeKeys={highlightedEdgeKeys}
            onLoadSample={handleLoadSample}
            onImportClick={handleImportClick}
          />
        </div>

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
        <TestDataModal tables={activeTables} onClose={closeModal} />
      )}
      {modal.kind === 'sql-helper' && (
        <SqlHelperModal tables={activeTables} onClose={closeModal} />
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