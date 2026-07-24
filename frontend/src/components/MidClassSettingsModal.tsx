import { PERSONALITY_TYPES } from '../lib/api'

interface MidClassSettingsModalProps {
  isOpen: boolean
  onClose: () => void
  selectedTypes: string[]
  setSelectedTypes: React.Dispatch<React.SetStateAction<string[]>>
  onSave: () => void
  isPending: boolean
}

export default function MidClassSettingsModal({
  isOpen,
  onClose,
  selectedTypes,
  setSelectedTypes,
  onSave,
  isPending,
}: MidClassSettingsModalProps) {
  if (!isOpen) return null

  const allSelected = selectedTypes.length === PERSONALITY_TYPES.length

  const toggleType = (type: string) => {
    setSelectedTypes(prev =>
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    )
  }

  const toggleAll = () => {
    if (allSelected) {
      setSelectedTypes([])
    } else {
      setSelectedTypes(PERSONALITY_TYPES.map(t => t.type))
    }
  }

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white border border-slate-200 w-full max-w-xl rounded-2xl p-6 text-slate-800 shadow-xl animate-in">
        <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-base font-semibold text-slate-800">Cấu hình sỉ số & tính cách học sinh</h2>
            <p className="text-xs text-slate-500">Sơ đồ chỗ ngồi 2D trong lớp học sẽ tự động thay đổi theo lựa chọn này.</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 transition-colors">✕</button>
        </div>

        <div className="flex items-center justify-between mb-3">
          <span className="text-xs text-slate-600">
            Đã chọn: <strong className="text-amber-600">{selectedTypes.length}</strong> / {PERSONALITY_TYPES.length} em
          </span>
          <button
            type="button"
            onClick={toggleAll}
            className="text-xs font-semibold text-amber-600 hover:text-amber-700 uppercase tracking-wider"
          >
            {allSelected ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2 max-h-80 overflow-y-auto pr-1 mb-6">
          {PERSONALITY_TYPES.map(pt => {
            const isSelected = selectedTypes.includes(pt.type)
            return (
              <button
                key={pt.type}
                type="button"
                onClick={() => toggleType(pt.type)}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium border text-left transition-all ${
                  isSelected
                    ? 'border-amber-300 bg-amber-50 text-amber-900'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                }`}
              >
                <span className={`w-4 h-4 rounded flex items-center justify-center border text-[10px] ${
                  isSelected ? 'border-amber-600 bg-amber-600 text-white font-bold' : 'border-slate-300'
                }`}>
                  {isSelected ? '✓' : ''}
                </span>
                <span className="truncate">{pt.label}</span>
              </button>
            )
          })}
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-medium text-slate-500 hover:text-slate-800 transition-colors"
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={onSave}
            disabled={isPending}
            className="bg-amber-600 hover:bg-amber-700 text-white px-5 py-2 rounded-xl text-xs font-medium uppercase tracking-wider disabled:opacity-40 transition-all shadow-sm"
          >
            {isPending ? 'Đang cập nhật...' : 'Cập nhật sơ đồ lớp'}
          </button>
        </div>
      </div>
    </div>
  )
}
