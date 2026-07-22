import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { uploadLessonPlan, PERSONALITY_TYPES } from '../lib/api'

const ACCEPTED_TYPES = {
  'application/pdf': '.pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': '.pptx',
}

export default function UploadPage() {
  const navigate = useNavigate()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [lessonContent, setLessonContent] = useState('')
  const [dragActive, setDragActive] = useState(false)
  const [selectedTypes, setSelectedTypes] = useState<string[]>(
    PERSONALITY_TYPES.map(t => t.type)
  )

  const allSelected = selectedTypes.length === PERSONALITY_TYPES.length

  const toggleType = (type: string) => {
    setSelectedTypes(prev =>
      prev.includes(type)
        ? prev.filter(t => t !== type)
        : [...prev, type]
    )
  }

  const toggleAll = () => {
    if (allSelected) {
      setSelectedTypes([])
    } else {
      setSelectedTypes(PERSONALITY_TYPES.map(t => t.type))
    }
  }

  const uploadMutation = useMutation({
    mutationFn: () => {
      if (!selectedFile) throw new Error('No file selected')
      return uploadLessonPlan(selectedFile, lessonContent || undefined, selectedTypes)
    },
    onSuccess: (data) => {
      navigate(`/session/${data.sessionId}`)
    },
  })

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (!ACCEPTED_TYPES[file.type as keyof typeof ACCEPTED_TYPES]) {
        alert('Định dạng không hợp lệ. Vui lòng tải lên file PDF, DOCX hoặc PPTX.')
        return
      }
      setSelectedFile(file)
    }
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    const file = e.dataTransfer.files?.[0]
    if (file) {
      if (!ACCEPTED_TYPES[file.type as keyof typeof ACCEPTED_TYPES]) {
        alert('Định dạng không hợp lệ. Vui lòng tải lên file PDF, DOCX hoặc PPTX.')
        return
      }
      setSelectedFile(file)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    uploadMutation.mutate()
  }

  return (
    <div className="h-full w-full overflow-y-auto">
      <div className="max-w-xl mx-auto px-6 py-8">
      <h1 className="text-lg font-semibold text-slate-800 mb-1">Tải lên giáo án</h1>
      <p className="text-sm text-slate-500 mb-6">
        Tải lên giáo án để bắt đầu buổi dạy thực hành.
      </p>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            File giáo án
          </label>
          <div
            className={`border-2 border-dashed p-6 text-center transition-colors ${
              dragActive
                ? 'border-amber-500 bg-amber-50'
                : 'border-slate-300 hover:border-slate-400'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.docx,.pptx"
              onChange={handleFileSelect}
              className="hidden"
            />

            {selectedFile ? (
              <div className="flex items-center justify-center gap-3">
                <svg className="w-6 h-6 text-emerald-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="text-left text-sm">
                  <p className="font-medium text-slate-800">{selectedFile.name}</p>
                  <p className="text-slate-400">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
                <button type="button" onClick={() => setSelectedFile(null)} className="text-slate-400 hover:text-slate-600 shrink-0">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ) : (
              <div>
                <svg className="w-10 h-10 mx-auto text-slate-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <p className="text-sm text-slate-500 mb-2">Kéo và thả file vào đây, hoặc</p>
                <button type="button" onClick={() => fileInputRef.current?.click()} className="text-sm font-medium text-amber-600 hover:text-amber-700">chọn file</button>
                <p className="text-[11px] text-slate-400 mt-2">Hỗ trợ: PDF, DOCX, PPTX (tối đa 10MB)</p>
              </div>
            )}
          </div>
        </div>

        {/* Personality selection */}
        <div className="border border-slate-200 bg-white">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
            <label className="text-sm font-medium text-slate-700">
              Tính cách học sinh
            </label>
            <div className="flex items-center gap-3">
              <span className="text-[11px] text-slate-400">
                {selectedTypes.length}/{PERSONALITY_TYPES.length}
              </span>
              <button
                type="button"
                onClick={toggleAll}
                className="text-[11px] font-medium text-amber-600 hover:text-amber-700 uppercase tracking-[0.06em]"
              >
                {allSelected ? 'Bỏ chọn' : 'Chọn tất cả'}
              </button>
            </div>
          </div>
          <div className="p-4">
            <div className="grid grid-cols-2 gap-1.5">
              {PERSONALITY_TYPES.map(pt => {
                const selected = selectedTypes.includes(pt.type)
                return (
                  <button
                    key={pt.type}
                    type="button"
                    onClick={() => toggleType(pt.type)}
                    className={`flex items-center gap-2 px-3 py-2 text-left text-sm transition-colors border ${
                      selected
                        ? 'border-amber-200 bg-amber-50'
                        : 'border-slate-200 bg-white hover:border-slate-300 text-slate-500'
                    }`}
                  >
                    <div className={`w-3.5 h-3.5 flex items-center justify-center border ${
                      selected ? 'border-amber-600 bg-amber-600' : 'border-slate-300'
                    }`}>
                      {selected && (
                        <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                    <span className={selected ? 'text-slate-800 font-medium' : ''}>{pt.label}</span>
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Nội dung bài học (Không bắt buộc)
          </label>
          <textarea
            value={lessonContent}
            onChange={(e) => setLessonContent(e.target.value)}
            rows={4}
            className="w-full px-3 py-2 border border-slate-300 text-sm text-slate-700 placeholder:text-slate-400 resize-none outline-none focus:border-amber-500"
            placeholder="Dán nội dung giáo án vào đây để AI hiểu rõ hơn..."
          />
        </div>

        {uploadMutation.isError && (
          <div className="border border-red-200 bg-red-50 px-4 py-3">
            <p className="text-red-600 text-sm">
              {uploadMutation.error instanceof Error
                ? uploadMutation.error.message
                : 'Tải lên thất bại. Vui lòng thử lại.'}
            </p>
          </div>
        )}

        <button
          type="submit"
          disabled={!selectedFile || uploadMutation.isPending}
          className="w-full bg-amber-600 text-white py-2.5 text-sm font-medium hover:bg-amber-700 transition-colors disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed"
        >
          {uploadMutation.isPending ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Đang tạo buổi học...
            </span>
          ) : (
            'Bắt đầu buổi dạy'
          )}
        </button>
      </form>
    </div>
    </div>
  )
}
