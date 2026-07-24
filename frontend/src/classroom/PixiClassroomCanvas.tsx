import { useEffect, useRef } from 'react'
import { RenderEngine } from './RenderEngine'
import type { StudentData } from './Types'

interface PixiClassroomCanvasProps {
  activeTypes: string[]
  studentStates: Record<string, Partial<StudentData>>
  selectedStudentName: string | null
  chalkboardTitle?: string
  onSelectStudent: (student: StudentData) => void
}

export default function PixiClassroomCanvas({
  activeTypes,
  studentStates,
  selectedStudentName,
  chalkboardTitle,
  onSelectStudent,
}: PixiClassroomCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const engineRef = useRef<RenderEngine | null>(null)

  useEffect(() => {
    if (!containerRef.current) return

    let destroyed = false
    const engine = new RenderEngine()
    engineRef.current = engine

    engine.init(containerRef.current, onSelectStudent).then(() => {
      if (!destroyed) {
        engine.update(activeTypes, studentStates, selectedStudentName, chalkboardTitle)
      }
    })

    return () => {
      destroyed = true
      engine.destroy()
      engineRef.current = null
    }
  }, [])

  useEffect(() => {
    if (engineRef.current) {
      engineRef.current.update(activeTypes, studentStates, selectedStudentName, chalkboardTitle)
    }
  }, [activeTypes, studentStates, selectedStudentName, chalkboardTitle])

  return (
    <div
      ref={containerRef}
      className="w-full h-full relative overflow-hidden bg-[#f7f6f3] select-none"
    />
  )
}
