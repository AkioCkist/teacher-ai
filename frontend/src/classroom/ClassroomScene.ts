import * as PIXI from 'pixi.js'
import { StudentAvatar, generateAvatarStyle } from './StudentAvatar'
import type { StudentData } from './Types'
import { getStudentDisplayName } from './Types'
import { PERSONALITY_TYPES } from '../lib/api'

// Cozy classroom palette — warm, material-rich
const PALETTE = {
  wall: 0xf0e8d6,         // warm cream wall
  wallShadow: 0xe8ddc8,   // wall bottom shadow
  baseboard: 0xc4b494,    // wooden baseboard
  floor: 0xd4c4a8,        // warm wood floor
  floorPlank: 0xcabb9c,   // alternating plank
  floorLine: 0xbfaf8e,    // plank gap
  boardSurface: 0x1a3320, // dark green chalkboard
  boardFrame: 0x8b7355,   // wood frame
  boardInner: 0xc4a882,   // inner frame highlight
  windowFrame: 0xc4b494,  // wood window frame
  windowGlass: 0xe1eef7,  // light sky blue glass
  windowGlow: 0xf5f0e8,   // window light glow on wall
  curtain: 0xd9c8b0,      // curtain sides
  rug: 0xc4956a,          // warm terra-cotta rug
  rugBorder: 0xb8845a,    // rug border
  accent: 0xd97706,
}

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
      text: 'PHÒNG HỌC MÔ PHỎNG',
      style: {
        fontFamily: 'Be Vietnam Pro, system-ui, sans-serif',
        fontSize: 14,
        fontWeight: '600',
        fill: 0xf0e8c8,
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

    const wallH = this.heightPx * 0.40

    // === 1. WALL ===
    this.roomBgGraphics.rect(0, 0, this.widthPx, wallH)
    this.roomBgGraphics.fill({ color: PALETTE.wall })

    // Wall bottom shadow
    this.roomBgGraphics.rect(0, wallH - 20, this.widthPx, 20)
    this.roomBgGraphics.fill({ color: PALETTE.wallShadow, alpha: 0.4 })

    // === 2. BASEBOARD ===
    this.roomBgGraphics.rect(0, wallH - 5, this.widthPx, 5)
    this.roomBgGraphics.fill({ color: PALETTE.baseboard })

    // === 3. WOOD FLOOR ===
    const floorY = wallH
    const floorH = this.heightPx - floorY
    this.roomBgGraphics.rect(0, floorY, this.widthPx, floorH)
    this.roomBgGraphics.fill({ color: PALETTE.floor })

    // Floor boards — alternating planks with perspective
    const plankCount = 8
    const plankH = floorH / plankCount
    for (let i = 0; i < plankCount; i++) {
      const py = floorY + i * plankH
      if (i % 2 === 0) {
        this.roomBgGraphics.rect(0, py, this.widthPx, plankH)
        this.roomBgGraphics.fill({ color: PALETTE.floorPlank, alpha: 0.3 })
      }
      // Plank gap line
      this.roomBgGraphics.moveTo(0, py)
      this.roomBgGraphics.lineTo(this.widthPx, py)
      this.roomBgGraphics.stroke({ color: PALETTE.floorLine, width: 0.8, alpha: 0.5 })
    }

    // === 4. RUG under student area ===
    const rugX = this.widthPx * 0.08
    const rugW = this.widthPx * 0.84
    const rugY = floorY + floorH * 0.08
    const rugH = floorH * 0.84
    this.roomBgGraphics.roundRect(rugX, rugY, rugW, rugH, 6)
    this.roomBgGraphics.fill({ color: PALETTE.rug, alpha: 0.35 })
    this.roomBgGraphics.roundRect(rugX + 6, rugY + 6, rugW - 12, rugH - 12, 4)
    this.roomBgGraphics.stroke({ color: PALETTE.rugBorder, width: 1.5, alpha: 0.4 })

    // === 5. CHALKBOARD ===
    const boardW = Math.min(520, this.widthPx * 0.72)
    const boardH = 90
    const boardX = (this.widthPx - boardW) / 2
    const boardY = 18

    // Outer wood frame
    this.roomBgGraphics.roundRect(boardX - 6, boardY - 6, boardW + 12, boardH + 12, 6)
    this.roomBgGraphics.fill({ color: PALETTE.boardFrame })
    // Inner frame highlight
    this.roomBgGraphics.roundRect(boardX - 3, boardY - 3, boardW + 6, boardH + 6, 5)
    this.roomBgGraphics.fill({ color: PALETTE.boardInner, alpha: 0.3 })
    // Green board surface
    this.roomBgGraphics.roundRect(boardX, boardY, boardW, boardH, 4)
    this.roomBgGraphics.fill({ color: PALETTE.boardSurface })
    // Chalk tray
    this.roomBgGraphics.rect(boardX - 4, boardY + boardH, boardW + 8, 5)
    this.roomBgGraphics.fill({ color: PALETTE.boardFrame })

    // Chalkboard text
    this.chalkboardText.style.wordWrapWidth = boardW - 20
    this.chalkboardText.x = (this.widthPx - this.chalkboardText.width) / 2
    this.chalkboardText.y = boardY + (boardH - this.chalkboardText.height) / 2

    // === 6. WINDOWS with curtains ===
    this.drawWindow(12, 16, 60, 85)
    this.drawWindow(this.widthPx - 72, 16, 60, 85)
  }

  private drawWindow(x: number, y: number, w: number, h: number) {
    if (x + w > this.widthPx || x < 0) return

    // Light glow on wall around window
    this.roomBgGraphics.roundRect(x - 4, y - 4, w + 8, h + 8, 4)
    this.roomBgGraphics.fill({ color: PALETTE.windowGlow, alpha: 0.5 })

    // Outer wood frame
    this.roomBgGraphics.roundRect(x - 2, y - 2, w + 4, h + 4, 3)
    this.roomBgGraphics.fill({ color: PALETTE.windowFrame })

    // Glass pane
    this.roomBgGraphics.roundRect(x, y, w, h, 2)
    this.roomBgGraphics.fill({ color: PALETTE.windowGlass, alpha: 0.7 })

    // Window cross — horizontal + vertical dividers
    this.roomBgGraphics.moveTo(x + w / 2, y)
    this.roomBgGraphics.lineTo(x + w / 2, y + h)
    this.roomBgGraphics.stroke({ color: PALETTE.windowFrame, width: 2 })
    this.roomBgGraphics.moveTo(x, y + h / 2)
    this.roomBgGraphics.lineTo(x + w, y + h / 2)
    this.roomBgGraphics.stroke({ color: PALETTE.windowFrame, width: 2 })

    // Curtain sides
    const curtainW = 10
    const curtainH = h + 6
    this.roomBgGraphics.roundRect(x - curtainW, y - 3, curtainW, curtainH, 2)
    this.roomBgGraphics.fill({ color: PALETTE.curtain, alpha: 0.7 })
    this.roomBgGraphics.roundRect(x + w, y - 3, curtainW, curtainH, 2)
    this.roomBgGraphics.fill({ color: PALETTE.curtain, alpha: 0.7 })

    // Glass shine
    this.roomBgGraphics.rect(x + 4, y + 4, w * 0.35, h * 0.25)
    this.roomBgGraphics.fill({ color: 0xffffff, alpha: 0.15 })
  }

  private updateDesksLayout(
    activeTypes: string[],
    studentStates: Record<string, Partial<StudentData>>,
    selectedStudentName: string | null
  ) {
    const activePersonalityConfigs = PERSONALITY_TYPES.filter(pt => activeTypes.includes(pt.type))
    const totalStudents = activePersonalityConfigs.length

    if (totalStudents === 0) {
      this.studentAvatarsMap.forEach(avatar => this.removeChild(avatar))
      this.studentAvatarsMap.clear()
      return
    }

    let cols = 4
    if (totalStudents <= 3) cols = 3
    else if (totalStudents <= 8) cols = 4
    else if (totalStudents <= 15) cols = 5
    else cols = 5

    const rows = Math.ceil(totalStudents / cols)

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

    this.studentAvatarsMap.forEach((avatar, id) => {
      if (!currentKeys.has(id)) {
        this.removeChild(avatar)
        this.studentAvatarsMap.delete(id)
      }
    })
  }
}
