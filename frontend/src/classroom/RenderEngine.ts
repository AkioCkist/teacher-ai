import * as PIXI from 'pixi.js'
import { ClassroomScene } from './ClassroomScene'
import type { StudentData } from './Types'

export class RenderEngine {
  private app: PIXI.Application | null = null
  private scene: ClassroomScene | null = null
  private containerElement: HTMLElement | null = null
  private resizeObserver: ResizeObserver | null = null

  private lastActiveTypes: string[] = []
  private lastStudentStates: Record<string, Partial<StudentData>> = {}
  private lastSelectedStudentName: string | null = null

  public async init(
    container: HTMLElement,
    onSelectStudent: (student: StudentData) => void
  ) {
    this.containerElement = container

    const app = new PIXI.Application()
    await app.init({
      resizeTo: container,
      backgroundColor: 0xf7f6f3,
      antialias: true,
      resolution: window.devicePixelRatio || 1,
      autoDensity: true,
    })

    container.appendChild(app.canvas)
    this.app = app

    this.scene = new ClassroomScene(onSelectStudent)
    this.app.stage.addChild(this.scene)

    this.app.ticker.add((ticker) => {
      if (this.scene) {
        this.scene.updateAnimations(ticker.deltaTime)
      }
    })

    this.resizeObserver = new ResizeObserver(() => {
      this.handleResize()
    })
    this.resizeObserver.observe(container)
    window.addEventListener('resize', this.handleResize)
  }

  public update(
    activeTypes: string[],
    studentStates: Record<string, Partial<StudentData>>,
    selectedStudentName: string | null,
    chalkboardTitle?: string
  ) {
    this.lastActiveTypes = activeTypes
    this.lastStudentStates = studentStates
    this.lastSelectedStudentName = selectedStudentName

    if (!this.app || !this.scene || !this.containerElement) return

    const width = this.containerElement.clientWidth || 800
    const height = this.containerElement.clientHeight || 600

    this.scene.updateLayout(width, height, activeTypes, studentStates, selectedStudentName)

    if (chalkboardTitle) {
      this.scene.setChalkboardMessage(chalkboardTitle)
    }
  }

  private handleResize = () => {
    if (this.app && this.scene && this.containerElement) {
      const width = this.containerElement.clientWidth || 800
      const height = this.containerElement.clientHeight || 600
      if (width > 0 && height > 0) {
        this.app.renderer.resize(width, height)
        this.scene.updateLayout(
          width,
          height,
          this.lastActiveTypes,
          this.lastStudentStates,
          this.lastSelectedStudentName
        )
      }
    }
  }

  public destroy() {
    window.removeEventListener('resize', this.handleResize)
    if (this.resizeObserver) {
      this.resizeObserver.disconnect()
      this.resizeObserver = null
    }
    if (this.scene) {
      try {
        this.scene.destroy({ children: true })
      } catch {
        // ignore GPU cleanup errors
      }
      this.scene = null
    }
    if (this.app) {
      try {
        this.app.destroy(true, { children: true, texture: true })
      } catch {
        // PixiJS v8 can throw "gpuBuffer is null" when WebGPU resources
        // are already released before destroy() runs — safe to ignore.
      }
      this.app = null
    }
  }
}
