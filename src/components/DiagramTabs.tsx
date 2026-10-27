import type { TableModel } from '../lib/types'

interface DiagramTabsProps {
  tables: TableModel[]
  activeTab: string
  onTabChange: (tab: string) => void
}

export default function DiagramTabs({ tables, activeTab, onTabChange }: DiagramTabsProps) {
  const isFact = (t: TableModel) => {
    const fkCount = t.columns.filter(c => c.isFK).length
    return fkCount >= 2 || /^fact|^fct/i.test(t.name)
  }

  const facts = tables.filter(isFact)

  return (
    <div className="flex items-center gap-1 overflow-x-auto border-b border-slate-200 bg-white px-4 py-2 shrink-0">
      <button
        onClick={() => onTabChange('overview')}
        className={`whitespace-nowrap rounded-md px-3 py-1.5 text-[13px] font-medium transition-colors ${
          activeTab === 'overview'
            ? 'bg-[#1E3A5F] text-white'
            : 'text-slate-600 hover:bg-slate-100'
        }`}
      >
        Обзор
      </button>
      
      {facts.map(f => (
        <button
          key={f.id}
          onClick={() => onTabChange(f.name)}
          className={`whitespace-nowrap rounded-md px-3 py-1.5 text-[13px] font-medium transition-colors ${
            activeTab === f.name
              ? 'bg-[#1E3A5F] text-white'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          {f.name}
        </button>
      ))}
    </div>
  )
}