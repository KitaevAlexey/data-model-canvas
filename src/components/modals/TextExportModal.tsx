interface TextExportModalProps {
  title: string
  content: string
  fileName?: string
  onClose: () => void
}

export default function TextExportModal({ title, content, fileName, onClose }: TextExportModalProps) {
  function handleDownload() {
    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = fileName || 'export.txt'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div
        className="mx-4 max-h-[80vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <h3 className="text-[16px] font-semibold text-slate-800">{title}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-[18px]">✕</button>
        </div>

        <div className="px-5 py-4 space-y-3">
          <pre className="max-h-96 overflow-y-auto rounded-md bg-slate-900 p-3 text-[11px] text-green-300 whitespace-pre-wrap">
            {content}
          </pre>
          <div className="flex gap-2">
            <button
              onClick={() => navigator.clipboard.writeText(content)}
              className="flex-1 rounded-md border border-slate-300 bg-white px-3 py-2 text-[13px] font-medium text-slate-700 hover:bg-slate-50"
            >
              Copy
            </button>
            {fileName && (
              <button
                onClick={handleDownload}
                className="flex-1 rounded-md bg-[#1E3A5F] px-3 py-2 text-[13px] font-medium text-white hover:opacity-90"
              >
                Download
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}