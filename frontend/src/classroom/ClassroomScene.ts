import * as PIXI from 'pixi.js'
import { StudentAvatar, generateAvatarStyle } from './StudentAvatar'
import type { StudentData } from './Types'
import { getStudentDisplayName } from './Types'
import { PERSONALITY_TYPES } from '../lib/api'
import { LightingEffects } from './LightingEffects'

// Cozy classroom palette — warm, material-rich, pastel-friendly
const PALETTE = {
  wallTop: 0xfaf6ed,
  wallBottom: 0xf0e6d0,
  baseboard: 0xc4b494,
  floorTop: 0xe8dcc8,
  floorBottom: 0xd4c4a8,
  floorPlank: 0xcabb9c,
  floorLine: 0xbfaf8e,
  boardSurfaceTop: 0x2a4a35,
  boardSurfaceBottom: 0x1a3320,
  boardFrame: 0x8b7355,
  boardInner: 0xc4a882,
  windowFrame: 0xc4b494,
  windowGlass: 0xe1eef7,
  windowGlow: 0xf5f0e8,
  curtain: 0xd9c8b0,
  rug: 0xc4956a,
  rugBorder: 0xb8845a,
  accent: 0xd97706,
  shelfWood: 0xa38460,
  shelfDark: 0x8b7355,
  plantGreen: 0x5a9c6b,
  plantDark: 0x4a7c59,
  clockFace: 0xfaf6ed,
  lightFixture: 0xf8fafc,
  lightWarm: 0xfef3c7,
}

export class ClassroomScene extends PIXI.Container {
  private widthPx: number = 800
  private heightPx: number = 600

  private roomBgGraphics: PIXI.Graphics
  private decorGraphics: PIXI.Graphics
  private chalkboardContainer: PIXI.Container
  private chalkboardText: PIXI.Text
  private studentAvatarsMap: Map<string, StudentAvatar> = new Map()
  private lightingEffects: LightingEffects

  private onSelectStudent: (student: StudentData) => void

  constructor(onSelectStudent: (student: StudentData) => void) {
    super()
    this.onSelectStudent = onSelectStudent

    this.roomBgGraphics = new PIXI.Graphics()
    this.decorGraphics = new PIXI.Graphics()
    this.chalkboardContainer = new PIXI.Container()
    this.chalkboardText = new PIXI.Text({
        text: 'PHÒNG HỌC MÔ PHỎNG',
        style: {
          fontFamily: 'Be Vietnam Pro, system-ui, sans-serif',
          fontSize: 15,
          fontWeight: '700',
          fill: 0xf0e8c8,
          align: 'center',
          wordWrap: true,
          wordWrapWidth: 560,
        },
      })
    this.lightingEffects = new LightingEffects()

    this.addChild(this.roomBgGraphics)
    this.addChild(this.lightingEffects)
    this.addChild(this.decorGraphics)
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
    this.drawDecorations()
    this.updateDesksLayout(activeTypes, studentStates, selectedStudentName)
    this.lightingEffects.updateLayout(this.widthPx, this.heightPx)
  }

  public updateAnimations(delta: number) {
    this.studentAvatarsMap.forEach(avatar => {
      avatar.updateAnimation(delta)
    })
    this.lightingEffects.updateAnimation(delta)
  }

  public setChalkboardMessage(msg: string) {
    this.chalkboardText.text = msg
    this.chalkboardText.x = (this.widthPx - this.chalkboardText.width) / 2
  }

  private drawRoomBackground() {
    this.roomBgGraphics.clear()

    const wallH = this.heightPx * 0.40

    // === 1. WALL with vertical gradient ===
    const wallSteps = 40
    for (let i = 0; i < wallSteps; i++) {
      const y = (i / wallSteps) * wallH
      const h = wallH / wallSteps + 1
      const t = i / wallSteps
      const r = Math.round(250 - t * 10)
      const g = Math.round(246 - t * 10)
      const b = Math.round(237 - t * 11)
      this.roomBgGraphics.rect(0, y, this.widthPx, h)
      this.roomBgGraphics.fill({ color: (r << 16) | (g << 8) | b })
    }

    // Wall bottom shadow band
    this.roomBgGraphics.rect(0, wallH - 24, this.widthPx, 24)
    this.roomBgGraphics.fill({ color: PALETTE.wallBottom, alpha: 0.35 })

    // === 2. BASEBOARD ===
    this.roomBgGraphics.rect(0, wallH - 6, this.widthPx, 6)
    this.roomBgGraphics.fill({ color: PALETTE.baseboard })
    // Baseboard highlight
    this.roomBgGraphics.rect(0, wallH - 6, this.widthPx, 1.5)
    this.roomBgGraphics.fill({ color: 0xddd0b8 })

    // === 3. WOOD FLOOR with gradient ===
    const floorY = wallH
    const floorH = this.heightPx - floorY
    const floorSteps = 30
    for (let i = 0; i < floorSteps; i++) {
      const y = floorY + (i / floorSteps) * floorH
      const h = floorH / floorSteps + 1
      const t = i / floorSteps
      const r = Math.round(232 - t * 14)
      const g = Math.round(220 - t * 16)
      const b = Math.round(200 - t * 14)
      this.roomBgGraphics.rect(0, y, this.widthPx, h)
      this.roomBgGraphics.fill({ color: (r << 16) | (g << 8) | b })
    }

    // Floor boards — alternating planks with perspective
    const plankCount = 10
    const plankH = floorH / plankCount
    for (let i = 0; i < plankCount; i++) {
      const py = floorY + i * plankH
      if (i % 2 === 0) {
        this.roomBgGraphics.rect(0, py, this.widthPx, plankH)
        this.roomBgGraphics.fill({ color: PALETTE.floorPlank, alpha: 0.25 })
      }
      // Plank gap line
      this.roomBgGraphics.moveTo(0, py)
      this.roomBgGraphics.lineTo(this.widthPx, py)
      this.roomBgGraphics.stroke({ color: PALETTE.floorLine, width: 0.8, alpha: 0.4 })
    }

    // === 4. RUG under student area ===
    const rugX = this.widthPx * 0.08
    const rugW = this.widthPx * 0.84
    const rugY = floorY + floorH * 0.06
    const rugH = floorH * 0.88
    // Rug shadow
    this.roomBgGraphics.roundRect(rugX + 3, rugY + 3, rugW, rugH, 10)
    this.roomBgGraphics.fill({ color: 0x000000, alpha: 0.06 })
    // Rug body
    this.roomBgGraphics.roundRect(rugX, rugY, rugW, rugH, 10)
    this.roomBgGraphics.fill({ color: PALETTE.rug, alpha: 0.3 })
    // Rug inner border
    this.roomBgGraphics.roundRect(rugX + 8, rugY + 8, rugW - 16, rugH - 16, 6)
    this.roomBgGraphics.stroke({ color: PALETTE.rugBorder, width: 1.5, alpha: 0.35 })
    // Rug pattern dots
    const dotSpacing = 40
    for (let dx = 15; dx < rugW - 15; dx += dotSpacing) {
      for (let dy = 15; dy < rugH - 15; dy += dotSpacing) {
        if ((Math.floor(dx / dotSpacing) + Math.floor(dy / dotSpacing)) % 2 === 0) {
          this.roomBgGraphics.circle(rugX + dx, rugY + dy, 3)
          this.roomBgGraphics.fill({ color: PALETTE.rugBorder, alpha: 0.15 })
        }
      }
    }

    // === 5. CHALKBOARD with depth ===
    const boardW = Math.min(520, this.widthPx * 0.72)
    const boardH = 189
    const boardX = (this.widthPx - boardW) / 2
    const boardY = 16

    // Drop shadow
    this.roomBgGraphics.roundRect(boardX - 4, boardY + 4, boardW + 12, boardH + 12, 8)
    this.roomBgGraphics.fill({ color: 0x000000, alpha: 0.08 })
    // Outer wood frame
    this.roomBgGraphics.roundRect(boardX - 8, boardY - 8, boardW + 16, boardH + 16, 8)
    this.roomBgGraphics.fill({ color: PALETTE.boardFrame })
    // Frame highlight
    this.roomBgGraphics.roundRect(boardX - 8, boardY - 8, boardW + 16, 3, 2)
    this.roomBgGraphics.fill({ color: 0xba9c65, alpha: 0.5 })
    // Inner frame
    this.roomBgGraphics.roundRect(boardX - 4, boardY - 4, boardW + 8, boardH + 8, 6)
    this.roomBgGraphics.fill({ color: PALETTE.boardInner, alpha: 0.25 })
    // Green board with gradient
    const boardSteps = 20
    for (let i = 0; i < boardSteps; i++) {
      const by = boardY + (i / boardSteps) * boardH
      const bh = boardH / boardSteps + 1
      const t = i / boardSteps
      const r = Math.round(42 - t * 10)
      const g = Math.round(74 - t * 8)
      const b = Math.round(53 - t * 5)
      this.roomBgGraphics.rect(boardX, by, boardW, bh)
      this.roomBgGraphics.fill({ color: (r << 16) | (g << 8) | b })
    }
    // Chalk dust specks
    for (let i = 0; i < 8; i++) {
      const cx = boardX + 20 + Math.random() * (boardW - 40)
      const cy = boardY + boardH - 10 - Math.random() * 15
      this.roomBgGraphics.circle(cx, cy, 1 + Math.random())
      this.roomBgGraphics.fill({ color: 0xffffff, alpha: 0.15 + Math.random() * 0.15 })
    }
    // Chalk tray
    this.roomBgGraphics.roundRect(boardX - 6, boardY + boardH, boardW + 12, 7, 3)
    this.roomBgGraphics.fill({ color: PALETTE.boardFrame })
    this.roomBgGraphics.rect(boardX - 6, boardY + boardH, boardW + 12, 2)
    this.roomBgGraphics.fill({ color: 0xba9c65, alpha: 0.4 })
    // Chalk pieces
    this.roomBgGraphics.roundRect(boardX + 15, boardY + boardH + 2, 28, 3, 1)
    this.roomBgGraphics.fill({ color: 0xffffff, alpha: 0.85 })
    this.roomBgGraphics.roundRect(boardX + 48, boardY + boardH + 2, 22, 3, 1)
    this.roomBgGraphics.fill({ color: 0xfbbf24, alpha: 0.8 })
    this.roomBgGraphics.roundRect(boardX + 75, boardY + boardH + 2, 20, 3, 1)
    this.roomBgGraphics.fill({ color: 0xf87171, alpha: 0.7 })

    // Chalkboard text
    this.chalkboardText.style.wordWrapWidth = boardW - 24
    this.chalkboardText.x = (this.widthPx - this.chalkboardText.width) / 2
    this.chalkboardText.y = boardY + (boardH - this.chalkboardText.height) / 2

    // === 6. WINDOWS with curtains & light glow ===
    this.drawWindow(16, 18, 64, 90)
    this.drawWindow(this.widthPx - 80, 18, 64, 90)

    // === 7. SUNBEAMS from windows ===
    this.drawSunbeam(80, 108, 280, this.heightPx)
    this.drawSunbeam(this.widthPx - 80, 108, this.widthPx - 280, this.heightPx)
  }

  private drawSunbeam(x1: number, y1: number, x2: number, y2: number) {
    const steps = 30
    for (let i = 0; i < steps; i++) {
      const t = i / steps
      const alpha = 0.04 * (1 - t)
      const spread = 60 + t * 120
      const midX = x1 + (x2 - x1) * t
      this.roomBgGraphics.moveTo(x1, y1)
      this.roomBgGraphics.lineTo(midX - spread, y2)
      this.roomBgGraphics.lineTo(midX + spread, y2)
      this.roomBgGraphics.closePath()
      this.roomBgGraphics.fill({ color: 0xfff8e7, alpha })
    }
  }

  private drawWindow(x: number, y: number, w: number, h: number) {
    if (x + w > this.widthPx || x < 0) return

    // Light glow on wall around window
    this.roomBgGraphics.roundRect(x - 6, y - 6, w + 12, h + 12, 5)
    this.roomBgGraphics.fill({ color: PALETTE.windowGlow, alpha: 0.55 })

    // Outer wood frame with shadow
    this.roomBgGraphics.roundRect(x + 1, y + 2, w + 4, h + 4, 4)
    this.roomBgGraphics.fill({ color: 0x000000, alpha: 0.06 })
    this.roomBgGraphics.roundRect(x - 2, y - 2, w + 4, h + 4, 4)
    this.roomBgGraphics.fill({ color: PALETTE.windowFrame })
    // Frame highlight
    this.roomBgGraphics.roundRect(x - 2, y - 2, w + 4, 2, 1)
    this.roomBgGraphics.fill({ color: 0xddd0b8, alpha: 0.5 })

    // Glass pane with subtle gradient
    const glassSteps = 10
    for (let i = 0; i < glassSteps; i++) {
      const gy = y + (i / glassSteps) * h
      const gh = h / glassSteps + 1
      const t = i / glassSteps
      const r = Math.round(225 - t * 8)
      const g = Math.round(238 - t * 6)
      const b = Math.round(247 - t * 4)
      this.roomBgGraphics.rect(x, gy, w, gh)
      this.roomBgGraphics.fill({ color: (r << 16) | (g << 8) | b, alpha: 0.75 })
    }

    // Window cross — horizontal + vertical dividers
    this.roomBgGraphics.moveTo(x + w / 2, y)
    this.roomBgGraphics.lineTo(x + w / 2, y + h)
    this.roomBgGraphics.stroke({ color: PALETTE.windowFrame, width: 2.5 })
    this.roomBgGraphics.moveTo(x, y + h / 2)
    this.roomBgGraphics.lineTo(x + w, y + h / 2)
    this.roomBgGraphics.stroke({ color: PALETTE.windowFrame, width: 2.5 })

    // Curtain sides with folds
    const curtainW = 12
    const curtainH = h + 8
    // Left curtain
    this.roomBgGraphics.roundRect(x - curtainW, y - 4, curtainW, curtainH, 3)
    this.roomBgGraphics.fill({ color: PALETTE.curtain, alpha: 0.75 })
    this.roomBgGraphics.moveTo(x - curtainW + 3, y - 4)
    this.roomBgGraphics.lineTo(x - curtainW + 3, y + curtainH - 4)
    this.roomBgGraphics.stroke({ color: 0xbfaf8e, width: 1, alpha: 0.4 })
    // Right curtain
    this.roomBgGraphics.roundRect(x + w, y - 4, curtainW, curtainH, 3)
    this.roomBgGraphics.fill({ color: PALETTE.curtain, alpha: 0.75 })
    this.roomBgGraphics.moveTo(x + w + 9, y - 4)
    this.roomBgGraphics.lineTo(x + w + 9, y + curtainH - 4)
    this.roomBgGraphics.stroke({ color: 0xbfaf8e, width: 1, alpha: 0.4 })

    // Glass shine
    this.roomBgGraphics.rect(x + 5, y + 5, w * 0.3, h * 0.22)
    this.roomBgGraphics.fill({ color: 0xffffff, alpha: 0.18 })
    this.roomBgGraphics.rect(x + 8, y + 8, w * 0.15, h * 0.1)
    this.roomBgGraphics.fill({ color: 0xffffff, alpha: 0.25 })
  }

  private drawDecorations() {
    this.decorGraphics.clear()
    const wallH = this.heightPx * 0.40

    // === CEILING LIGHT ===
    const lightX = this.widthPx / 2
    const lightY = 0
    // Cord
    this.decorGraphics.rect(lightX - 2, lightY, 4, 22)
    this.decorGraphics.fill({ color: 0x94a3b8 })
    // Fixture body
    this.decorGraphics.ellipse(lightX, 24, 38, 9)
    this.decorGraphics.fill({ color: PALETTE.lightFixture, alpha: 0.95 })
    this.decorGraphics.ellipse(lightX, 24, 38, 9)
    this.decorGraphics.stroke({ color: 0xe2e8f0, width: 1 })
    // Warm bulb glow
    this.decorGraphics.ellipse(lightX, 24, 28, 6)
    this.decorGraphics.fill({ color: PALETTE.lightWarm, alpha: 0.5 })
    // Light rays
    this.decorGraphics.moveTo(lightX - 30, 28)
    this.decorGraphics.lineTo(lightX - 85, wallH + 60)
    this.decorGraphics.lineTo(lightX + 85, wallH + 60)
    this.decorGraphics.lineTo(lightX + 30, 28)
    this.decorGraphics.closePath()
    this.decorGraphics.fill({ color: PALETTE.lightWarm, alpha: 0.06 })

    // === LEFT SHELF ===
    const shelfX = 18
    const shelfY = 125
    const shelfW = 55
    const shelfH = 75
    // Shadow
    this.decorGraphics.rect(shelfX + 2, shelfY + 2, shelfW, shelfH)
    this.decorGraphics.fill({ color: 0x000000, alpha: 0.06 })
    // Frame
    this.decorGraphics.rect(shelfX, shelfY, shelfW, shelfH)
    this.decorGraphics.fill({ color: PALETTE.shelfWood })
    this.decorGraphics.rect(shelfX + 3, shelfY + 3, shelfW - 6, shelfH - 6)
    this.decorGraphics.fill({ color: PALETTE.shelfDark })
    // Shelves
    this.decorGraphics.rect(shelfX + 4, shelfY + 22, shelfW - 8, 3)
    this.decorGraphics.fill({ color: PALETTE.shelfWood })
    this.decorGraphics.rect(shelfX + 4, shelfY + 48, shelfW - 8, 3)
    this.decorGraphics.fill({ color: PALETTE.shelfWood })
    // Books top shelf
    const bookColors = [0xe11d48, 0x2563eb, 0x059669, 0xd97706, 0x7c3aed]
    let bx = shelfX + 7
    bookColors.forEach((c, i) => {
      const bw = 5 + (i % 3) * 2
      const bh = 14 + (i % 2) * 3
      this.decorGraphics.roundRect(bx, shelfY + 22 - bh, bw, bh, 1)
      this.decorGraphics.fill({ color: c, alpha: 0.85 })
      bx += bw + 2
    })
    // Plant bottom shelf
    const px = shelfX + 32
    const py = shelfY + 48
    this.decorGraphics.ellipse(px, py - 2, 9, 5)
    this.decorGraphics.fill({ color: PALETTE.plantDark })
    this.decorGraphics.ellipse(px - 5, py - 8, 5, 9)
    this.decorGraphics.fill({ color: PALETTE.plantGreen })
    this.decorGraphics.ellipse(px + 5, py - 8, 5, 9)
    this.decorGraphics.fill({ color: PALETTE.plantGreen })
    this.decorGraphics.ellipse(px, py - 12, 4, 8)
    this.decorGraphics.fill({ color: 0x6bc77d })
    // Pot
    this.decorGraphics.roundRect(px - 5, py - 4, 10, 6, 2)
    this.decorGraphics.fill({ color: 0xc4a882 })

    // === CLOCK on right wall ===
    const clockX = this.widthPx - 50
    const clockY = 156
    // Shadow
    this.decorGraphics.circle(clockX + 1, clockY + 1, 20)
    this.decorGraphics.fill({ color: 0x000000, alpha: 0.06 })
    // Body
    this.decorGraphics.circle(clockX, clockY, 20)
    this.decorGraphics.fill({ color: PALETTE.clockFace })
    this.decorGraphics.circle(clockX, clockY, 20)
    this.decorGraphics.stroke({ color: PALETTE.baseboard, width: 2.5 })
    // Center
    this.decorGraphics.circle(clockX, clockY, 2.5)
    this.decorGraphics.fill({ color: PALETTE.shelfWood })
    // Hands (10:10)
    this.decorGraphics.moveTo(clockX, clockY)
    this.decorGraphics.lineTo(clockX - 6, clockY - 10)
    this.decorGraphics.stroke({ color: PALETTE.shelfWood, width: 2, cap: 'round' })
    this.decorGraphics.moveTo(clockX, clockY)
    this.decorGraphics.lineTo(clockX + 8, clockY - 3)
    this.decorGraphics.stroke({ color: PALETTE.shelfWood, width: 1.5, cap: 'round' })
    // Ticks
    for (let i = 0; i < 12; i++) {
      const angle = (i * 30 * Math.PI) / 180
      const r1 = 16
      const r2 = i % 3 === 0 ? 13 : 15
      this.decorGraphics.moveTo(clockX + Math.cos(angle) * r1, clockY + Math.sin(angle) * r1)
      this.decorGraphics.lineTo(clockX + Math.cos(angle) * r2, clockY + Math.sin(angle) * r2)
      this.decorGraphics.stroke({ color: PALETTE.baseboard, width: i % 3 === 0 ? 1.5 : 0.8 })
    }

    // === MAP / POSTER left of board ===
    if (this.widthPx > 500) {
      const posterX = this.widthPx * 0.15
      const posterY = 45
      this.decorGraphics.rect(posterX + 1, posterY + 1, 45, 55)
      this.decorGraphics.fill({ color: 0x000000, alpha: 0.05 })
      this.decorGraphics.rect(posterX, posterY, 45, 55)
      this.decorGraphics.fill({ color: 0xfaf6ed })
      this.decorGraphics.rect(posterX, posterY, 45, 55)
      this.decorGraphics.stroke({ color: 0xc4b494, width: 1 })
      // Simple map lines
      this.decorGraphics.moveTo(posterX + 5, posterY + 15)
      this.decorGraphics.lineTo(posterX + 40, posterY + 15)
      this.decorGraphics.stroke({ color: 0x94a3b8, width: 0.8 })
      this.decorGraphics.moveTo(posterX + 5, posterY + 30)
      this.decorGraphics.lineTo(posterX + 35, posterY + 30)
      this.decorGraphics.stroke({ color: 0x94a3b8, width: 0.8 })
      this.decorGraphics.moveTo(posterX + 5, posterY + 45)
      this.decorGraphics.lineTo(posterX + 30, posterY + 45)
      this.decorGraphics.stroke({ color: 0x94a3b8, width: 0.8 })
      // Pin
      this.decorGraphics.circle(posterX + 22, posterY + 2, 2)
      this.decorGraphics.fill({ color: 0xe11d48 })
    }
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
        // Add above decor but below lighting
        const decorIdx = this.getChildIndex(this.lightingEffects)
        this.addChildAt(avatar, decorIdx)
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
