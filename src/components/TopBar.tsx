import { useState, useRef, useEffect } from 'react'

interface TopBarProps {
  onImportS2T: (file: File) => void
  onImportExcel: (file: File) => void
  onImportCSV: (file: File) => void
  onExportDDL: () => void
  onExportS2T: () => void
  onExportAIPrompt: () => void
  onExportExcel: () => void
  onClearCanvas: () => void
  onToggleSidebar: () => void
}

export default function TopBar({
  onImportS2T,
  onImportExcel,
  onImportCSV,
  onExportDDL,
  onExportS2T,
  onExportAIPrompt,
  onExportExcel,
  onClearCanvas,
  onToggleSidebar,
}: TopBarProps) {
  const [importOpen, setImportOpen] = useState(false)
  const [exportOpen, setExportOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const importRef = useRef<HTMLDivElement>(null)
  const exportRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (importRef.current && !importRef.current.contains(e.target as Node)) setImportOpen(false)
      if (exportRef.current && !exportRef.current.contains(e.target as Node)) setExportOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  function triggerFileInput(format: 's2t' | 'excel' | 'csv') {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = format === 's2t' ? '.s2t,.txt' : format === 'excel' ? '.xlsx' : '.csv'
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return
      if (format === 's2t') onImportS2T(file)
      else if (format === 'excel') onImportExcel(file)
      else onImportCSV(file)
    }
    input.click()
  }

  const desktopButtons = (
    <>
      <div className="relative" ref={importRef}>
        <button
          onClick={() => { setImportOpen((v) => !v); setExportOpen(false) }}
          className="rounded-md border border-white/20 bg-transparent px-3 py-1.5 text-[14px] font-medium text-white hover:bg-white/10"
        >
          Import ▾
        </button>
        {importOpen && (
          <div className="absolute right-0 top-full z-20 mt-1 w-56 rounded-md border border-slate-200 bg-white py-1 text-slate-800 shadow-lg">
            <button className="block w-full px-3 py-2 text-left text-[14px] hover:bg-slate-50" onClick={() => { triggerFileInput('s2t'); setImportOpen(false) }}>Import S2T (.s2t/.txt)</button>
            <button className="block w-full px-3 py-2 text-left text-[14px] hover:bg-slate-50" onClick={() => { triggerFileInput('excel'); setImportOpen(false) }}>Import Excel (.xlsx)</button>
            <button className="block w-full px-3 py-2 text-left text-[14px] hover:bg-slate-50" onClick={() => { triggerFileInput('csv'); setImportOpen(false) }}>Import CSV (.csv)</button>
          </div>
        )}
      </div>

      <div className="relative" ref={exportRef}>
        <button
          onClick={() => { setExportOpen((v) => !v); setImportOpen(false) }}
          className="rounded-md border border-white/20 bg-transparent px-3 py-1.5 text-[14px] font-medium text-white hover:bg-white/10"
        >
          Export ▾
        </button>
        {exportOpen && (
          <div className="absolute right-0 top-full z-20 mt-1 w-56 rounded-md border border-slate-200 bg-white py-1 text-slate-800 shadow-lg">
            <button className="block w-full px-3 py-2 text-left text-[14px] hover:bg-slate-50" onClick={() => { onExportDDL(); setExportOpen(false) }}>Export DDL</button>
            <button className="block w-full px-3 py-2 text-left text-[14px] hover:bg-slate-50" onClick={() => { onExportS2T(); setExportOpen(false) }}>Export S2T</button>
            <button className="block w-full px-3 py-2 text-left text-[14px] hover:bg-slate-50" onClick={() => { onExportAIPrompt(); setExportOpen(false) }}>Export AI Prompt</button>
            <button className="block w-full px-3 py-2 text-left text-[14px] hover:bg-slate-50" onClick={() => { onExportExcel(); setExportOpen(false) }}>Export Excel</button>
          </div>
        )}
      </div>

      <button onClick={onClearCanvas} className="rounded-md bg-transparent px-3 py-1.5 text-[14px] font-medium text-white hover:bg-white/10">
        Clear Canvas
      </button>
    </>
  )

  return (
    <header className="flex h-[60px] shrink-0 items-center justify-between bg-[#0F1729] px-4 text-white sm:px-6">
      <div className="flex items-center gap-3">
        <button onClick={onToggleSidebar} className="rounded-md px-2 py-1 text-white hover:bg-white/10 md:hidden" aria-label="Toggle sidebar">
          ☰
        </button>
        <span className="text-[18px] font-bold tracking-tight">Data Model Canvas</span>
      </div>

      <div className="hidden items-center gap-3 sm:flex">{desktopButtons}</div>

      <div className="relative sm:hidden">
        <button onClick={() => setMobileMenuOpen((v) => !v)} className="rounded-md px-2 py-1 text-white hover:bg-white/10" aria-label="Menu">⋮</button>
        {mobileMenuOpen && (
          <div className="absolute right-0 top-full z-20 mt-1 w-56 rounded-md border border-slate-200 bg-white py-1 text-slate-800 shadow-lg">
            <div className="px-3 py-1 text-[11px] font-semibold uppercase text-slate-400">Import</div>
            <button className="block w-full px-3 py-2 text-left text-[14px] hover:bg-slate-50" onClick={() => { triggerFileInput('s2t'); setMobileMenuOpen(false) }}>S2T (.s2t/.txt)</button>
            <button className="block w-full px-3 py-2 text-left text-[14px] hover:bg-slate-50" onClick={() => { triggerFileInput('excel'); setMobileMenuOpen(false) }}>Excel (.xlsx)</button>
            <button className="block w-full px-3 py-2 text-left text-[14px] hover:bg-slate-50" onClick={() => { triggerFileInput('csv'); setMobileMenuOpen(false) }}>CSV (.csv)</button>
            <div className="mt-1 border-t border-slate-200 px-3 py-1 text-[11px] font-semibold uppercase text-slate-400">Export</div>
            <button className="block w-full px-3 py-2 text-left text-[14px] hover:bg-slate-50" onClick={() => { onExportDDL(); setMobileMenuOpen(false) }}>DDL</button>
            <button className="block w-full px-3 py-2 text-left text-[14px] hover:bg-slate-50" onClick={() => { onExportS2T(); setMobileMenuOpen(false) }}>S2T</button>
            <button className="block w-full px-3 py-2 text-left text-[14px] hover:bg-slate-50" onClick={() => { onExportAIPrompt(); setMobileMenuOpen(false) }}>AI Prompt</button>
            <button className="block w-full px-3 py-2 text-left text-[14px] hover:bg-slate-50" onClick={() => { onExportExcel(); setMobileMenuOpen(false) }}>Excel</button>
            <div className="mt-1 border-t border-slate-200 px-3 py-2">
              <button className="text-[14px] font-medium text-red-600" onClick={() => { onClearCanvas(); setMobileMenuOpen(false) }}>Clear Canvas</button>
            </div>
          </div>
        )}
      </div>
    </header>
  )
}