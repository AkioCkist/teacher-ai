import * as PIXI from 'pixi.js'
import { StudentAvatar, generateAvatarStyle } from './StudentAvatar'
import type { StudentData } from './Types'
import { getStudentDisplayName } from './Types'
import { PERSONALITY_TYPES } from '../lib/api'

export class ClassroomScene extends PIXI.Container {
  private widthPx: number = 800
  private heightPx: number = 600

  private roomBgGraphics: PIXI.Graphics
  private chalkboardContainer: PIXI.Container
  private chalkboardText: PIXI.Text
  private studentAvatarsMap: Map<string, StudentAvatar> = new Map()

  private onSelectStudent: (student: StudentData) => void

  constructor(onSelectStudent: (student: StudentData) => void) {
    super()
    this.onSelectStudent = onSelectStudent

    this.roomBgGraphics = new PIXI.Graphics()
    this.chalkboardContainer = new PIXI.Container()
    this.chalkboardText = new PIXI.Text({
      text: 'CHÀO MỪNG ĐẾN LỚP HỌC MÔ PHỎNG',
      style: {
        fontFamily: 'Be Vietnam Pro, system-ui, sans-serif',
        fontSize: 16,
        fontWeight: 'bold',
        fill: 0xfef08a,
        align: 'center',
        wordWrap: true,
        wordWrapWidth: 560,
      },
    })

    this.addChild(this.roomBgGraphics)
    this.addChild(this.chalkboardContainer)
    this.chalkboardContainer.addChild(this.chalkboardText)
  }

  public updateLayout(
    width: number,
    height: number,
    activeTypes: string[],
    studentStates: Record<string, Partial<StudentData>>,
    selectedStudentName: string | null
  ) {
    this.widthPx = Math.max(300, width)
    this.heightPx = Math.max(300, height)

    this.drawRoomBackground()
    this.updateDesksLayout(activeTypes, studentStates, selectedStudentName)
  }

  public updateAnimations(delta: number) {
    this.studentAvatarsMap.forEach(avatar => {
      avatar.updateAnimation(delta)
    })
  }

  public setChalkboardMessage(msg: string) {
    this.chalkboardText.text = msg
    this.chalkboardText.x = (this.widthPx - this.chalkboardText.width) / 2
  }

  private drawRoomBackground() {
    this.roomBgGraphics.clear()

    // 1. Wall color (Minimalist Light Cream/Slate)
    const wallHeight = this.heightPx * 0.40
    this.roomBgGraphics.rect(0, 0, this.widthPx, wallHeight)
    this.roomBgGraphics.fill({ color: 0xfffbeb })

    // Wall baseboard molding (Amber Accent)
    this.roomBgGraphics.rect(0, wallHeight - 6, this.widthPx, 6)
    this.roomBgGraphics.fill({ color: 0xd97706 })

    // 2. Wooden Floor (Light Oak Wood)
    this.roomBgGraphics.rect(0, wallHeight, this.widthPx, this.heightPx - wallHeight)
    this.roomBgGraphics.fill({ color: 0xfef3c7 })

    // Floor planks grid lines
    for (let y = wallHeight; y < this.heightPx; y += 30) {
      this.roomBgGraphics.moveTo(0, y)
      this.roomBgGraphics.lineTo(this.widthPx, y)
      this.roomBgGraphics.stroke({ color: 0xfde68a, width: 1, alpha: 0.8 })
    }

    // 3. Chalkboard on Front Wall
    const boardW = Math.min(640, this.widthPx * 0.8)
    const boardH = 110
    const boardX = (this.widthPx - boardW) / 2
    const boardY = 20

    // Chalkboard Frame
    this.roomBgGraphics.roundRect(boardX - 6, boardY - 6, boardW + 12, boardH + 12, 8)
    this.roomBgGraphics.fill({ color: 0xd97706 })

    // Chalkboard Surface (Clean Dark Slate/Green)
    this.roomBgGraphics.roundRect(boardX, boardY, boardW, boardH, 6)
    this.roomBgGraphics.fill({ color: 0x0f172a })

    // Positioning Chalkboard Text
    this.chalkboardText.style.wordWrapWidth = boardW - 30
    this.chalkboardText.x = (this.widthPx - this.chalkboardText.width) / 2
    this.chalkboardText.y = boardY + (boardH - this.chalkboardText.height) / 2

    // 4. Windows (Left and Right Wall Accents)
    this.drawWindow(16, 20, 70, 100)
    this.drawWindow(this.widthPx - 86, 20, 70, 100)
  }

  private drawWindow(x: number, y: number, w: number, h: number) {
    if (x + w > this.widthPx || x < 0) return
    // Window Frame
    this.roomBgGraphics.roundRect(x, y, w, h, 6)
    this.roomBgGraphics.fill({ color: 0xffffff })
    this.roomBgGraphics.stroke({ color: 0xfcd34d, width: 2 })
    // Glass Panes
    this.roomBgGraphics.moveTo(x + w / 2, y)
    this.roomBgGraphics.lineTo(x + w / 2, y + h)
    this.roomBgGraphics.stroke({ color: 0xfde68a, width: 1.5 })
    this.roomBgGraphics.moveTo(x, y + h / 2)
    this.roomBgGraphics.lineTo(x + w, y + h / 2)
    this.roomBgGraphics.stroke({ color: 0xfde68a, width: 1.5 })
  }

  private updateDesksLayout(
    activeTypes: string[],
    studentStates: Record<string, Partial<StudentData>>,
    selectedStudentName: string | null
  ) {
    // Filter active personality configs precisely matching user selection
    const activePersonalityConfigs = PERSONALITY_TYPES.filter(pt => activeTypes.includes(pt.type))
    const totalStudents = activePersonalityConfigs.length

    if (totalStudents === 0) {
      this.studentAvatarsMap.forEach(avatar => this.removeChild(avatar))
      this.studentAvatarsMap.clear()
      return
    }

    // Dynamic grid layout math matching active count
    let cols = 4
    if (totalStudents <= 3) cols = 3
    else if (totalStudents <= 8) cols = 4
    else if (totalStudents <= 15) cols = 5
    else cols = 5

    const rows = Math.ceil(totalStudents / cols)

    // Classroom seating area bounds
    const startY = this.heightPx * 0.46
    const availableH = this.heightPx * 0.48
    const availableW = Math.min(1000, this.widthPx * 0.92)
    const startX = (this.widthPx - availableW) / 2

    const cellW = availableW / cols
    const cellH = rows > 1 ? availableH / rows : availableH

    const currentKeys = new Set<string>()

    activePersonalityConfigs.forEach((pt, index) => {
      const studentId = pt.type
      currentKeys.add(studentId)

      const col = index % cols
      const row = Math.floor(index / cols)

      const x = startX + col * cellW + cellW / 2
      const y = startY + row * cellH + cellH / 2

      // Check if student state updated
      const state = studentStates[studentId] || {}
      const displayName = getStudentDisplayName(pt.type, state.name)
      const isSelected = selectedStudentName === displayName || selectedStudentName === state.name

      const studentData: StudentData = {
        id: studentId,
        name: displayName,
        type: pt.type,
        label: pt.label,
        color: pt.color as any,
        deskIndex: index,
        isSpeaking: state.isSpeaking || false,
        isHandRaised: state.isHandRaised || false,
        isSelected,
        lastResponse: state.lastResponse,
        avatarStyle: generateAvatarStyle(index),
      }

      let avatar = this.studentAvatarsMap.get(studentId)
      if (!avatar) {
        avatar = new StudentAvatar(studentData, (s) => this.onSelectStudent(s))
        this.addChild(avatar)
        this.studentAvatarsMap.set(studentId, avatar)
      } else {
        avatar.updateStudentData(studentData)
      }

      avatar.x = x
      avatar.y = y
    })

    // Remove inactive student avatars
    this.studentAvatarsMap.forEach((avatar, id) => {
      if (!currentKeys.has(id)) {
        this.removeChild(avatar)
        this.studentAvatarsMap.delete(id)
      }
    })
  }
}
