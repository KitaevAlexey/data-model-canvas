import type { CollisionIssue } from '../../lib/collisions'

interface CollisionsModalProps {
  issues: CollisionIssue[]
  onClose: () => void
  onHighlight: (tableIds: string[]) => void
}

function kindColor(kind: string): string {
  if (kind === 'Нет PK') return 'bg-amber-100 text-amber-700'
  if (kind === 'Висячий FK') return 'bg-red-100 text-red-700'
  if (kind === 'Циклический FK') return 'bg-purple-100 text-purple-700'
  if (kind === 'Разная длина VARCHAR') return 'bg-blue-100 text-blue-700'
  return 'bg-orange-100 text-orange-700'
}

export default function CollisionsModal({ issues, onClose, onHighlight }: CollisionsModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div
        className="mx-4 max-h-[80vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <h3 className="text-[16px] font-semibold text-slate-800">
            Анализ коллизий ({issues.length})
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-[18px]" title="Закрыть">
            ✕
          </button>
        </div>

        <div className="px-5 py-4">
          {issues.length === 0 && (
            <p className="text-center text-[14px] text-green-600">Проблем не найдено — модель корректна.</p>
          )}
          {issues.map((issue, idx) => (
            <div key={idx} className="mb-3 rounded-md border border-slate-200 bg-slate-50 p-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className={`inline-block rounded px-2 py-0.5 text-[11px] font-semibold ${kindColor(issue.kind)}`}>
                    {issue.kind}
                  </span>
                </div>
                <button
                  onClick={() => onHighlight(issue.tables)}
                  className="shrink-0 text-[12px] text-[#3B82F6] hover:underline"
                >
                  Показать
                </button>
              </div>
              <p className="mt-2 text-[13px] text-slate-600">{issue.message}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}