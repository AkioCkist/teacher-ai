import * as PIXI from 'pixi.js'
import type { StudentData } from './Types'

const COLOR_PALETTE = {
  skin: [0xffdbac, 0xf1c27d, 0xe0ac69, 0xc68642, 0x8d5524],
  hair: [0x2c1608, 0x4a2e12, 0x9a5214, 0xd4a373, 0x1a1a1a, 0xcc3333, 0xe6b800],
  shirt: [0xe11d48, 0x059669, 0xd97706, 0x2563eb, 0x7c3aed, 0x0891b2, 0x4f46e5, 0xca8a04],
}

export function generateAvatarStyle(index: number) {
  const skinColor = COLOR_PALETTE.skin[index % COLOR_PALETTE.skin.length]
  const hairColor = COLOR_PALETTE.hair[(index * 3) % COLOR_PALETTE.hair.length]
  const shirtColor = COLOR_PALETTE.shirt[(index * 5) % COLOR_PALETTE.shirt.length]
  const hairStyles: Array<'short' | 'long' | 'curly' | 'spiky' | 'bob'> = ['short', 'long', 'curly', 'spiky', 'bob']
  const hairStyle = hairStyles[index % hairStyles.length]
  const glasses = (index * 7) % 3 === 0
  const accessories: Array<'bow' | 'cap' | 'headband' | 'none'> = ['none', 'bow', 'cap', 'headband']
  const accessory = accessories[index % accessories.length]

  return { skinColor, hairColor, hairStyle, shirtColor, glasses, accessory }
}

// ───────────────────────────────────────────────
// Expression config for each personality type
// All 20 types from PERSONALITY_TYPES + default fallback
// ───────────────────────────────────────────────
interface ExpressionConfig {
  eyeY: number
  eyeRx: number
  eyeRy: number
  eyeOffsetX: number
  mouth: 'smile' | 'sad' | 'o' | 'flat' | 'shy' | 'grin' | 'worry' | 'smirk'
  blush: boolean
  sweat: boolean
  browTilt: 'none' | 'sad' | 'angry' | 'worried'
  zzz: boolean
}

const DEFAULT_EXPRESSION: ExpressionConfig = {
  eyeY: -33,
  eyeRx: 4.2,
  eyeRy: 4.8,
  eyeOffsetX: 0,
  mouth: 'smile',
  blush: false,
  sweat: false,
  browTilt: 'none',
  zzz: false,
}

const EXPRESSIONS: Record<string, ExpressionConfig> = {
  // 🟢 Emerald group — positive, confident
  excellent:   { eyeY: -34, eyeRx: 5.2, eyeRy: 6.2, eyeOffsetX: 0, mouth: 'grin',   blush: true,  sweat: false, browTilt: 'none',    zzz: false },
  good:        { eyeY: -34, eyeRx: 4.8, eyeRy: 5.8, eyeOffsetX: 0, mouth: 'smile',  blush: true,  sweat: false, browTilt: 'none',    zzz: false },
  leader:      { eyeY: -34, eyeRx: 4.6, eyeRy: 5.5, eyeOffsetX: 0, mouth: 'smile',  blush: false, sweat: false, browTilt: 'none',    zzz: false },

  // 🟡 Amber group — neutral / mixed
  average:     { eyeY: -33, eyeRx: 4.2, eyeRy: 4.8, eyeOffsetX: 0, mouth: 'smile',  blush: false, sweat: false, browTilt: 'none',    zzz: false },
  understands_cant_express: { eyeY: -33, eyeRx: 4.0, eyeRy: 4.2, eyeOffsetX: 0, mouth: 'flat',   blush: true,  sweat: true,  browTilt: 'worried', zzz: false },
  creative:    { eyeY: -34, eyeRx: 5.0, eyeRy: 6.0, eyeOffsetX: 0, mouth: 'grin',   blush: true,  sweat: false, browTilt: 'none',    zzz: false },
  curious:     { eyeY: -34, eyeRx: 5.2, eyeRy: 6.2, eyeOffsetX: 0, mouth: 'o',      blush: true,  sweat: false, browTilt: 'none',    zzz: false },
  visual:      { eyeY: -33, eyeRx: 4.5, eyeRy: 5.2, eyeOffsetX: 0, mouth: 'smile',  blush: true,  sweat: false, browTilt: 'none',    zzz: false },
  humorous:    { eyeY: -34, eyeRx: 4.5, eyeRy: 5.5, eyeOffsetX: 0, mouth: 'grin',   blush: false, sweat: false, browTilt: 'none',    zzz: false },

  // 🔴 Rose group — needs support / challenging
  weak:        { eyeY: -32, eyeRx: 3.8, eyeRy: 3.8, eyeOffsetX: 0, mouth: 'sad',    blush: false, sweat: false, browTilt: 'sad',     zzz: false },
  shy:         { eyeY: -31, eyeRx: 3.8, eyeRy: 3.0, eyeOffsetX: 0, mouth: 'shy',    blush: true,  sweat: true,  browTilt: 'worried', zzz: false },
  inattentive: { eyeY: -33, eyeRx: 4.5, eyeRy: 5.0, eyeOffsetX: 3, mouth: 'o',      blush: false, sweat: false, browTilt: 'none',    zzz: true  },
  limited_vocabulary: { eyeY: -32, eyeRx: 3.8, eyeRy: 3.8, eyeOffsetX: 0, mouth: 'worry',  blush: false, sweat: true,  browTilt: 'worried', zzz: false },
  confidently_wrong: { eyeY: -34, eyeRx: 4.8, eyeRy: 5.5, eyeOffsetX: 0, mouth: 'smirk',  blush: false, sweat: false, browTilt: 'none',    zzz: false },
  random_guess:{ eyeY: -33, eyeRx: 4.5, eyeRy: 5.0, eyeOffsetX: 2, mouth: 'o',      blush: false, sweat: true,  browTilt: 'worried', zzz: false },
  quiet:       { eyeY: -31, eyeRx: 3.6, eyeRy: 2.8, eyeOffsetX: 0, mouth: 'flat',   blush: true,  sweat: false, browTilt: 'none',    zzz: false },
  competitive: { eyeY: -34, eyeRx: 4.6, eyeRy: 5.2, eyeOffsetX: 0, mouth: 'smirk',  blush: false, sweat: false, browTilt: 'angry',   zzz: false },
  careless:    { eyeY: -33, eyeRx: 4.2, eyeRy: 4.5, eyeOffsetX: 1, mouth: 'smile',  blush: false, sweat: false, browTilt: 'none',    zzz: false },
  slow_learner:{ eyeY: -32, eyeRx: 3.8, eyeRy: 3.8, eyeOffsetX: 0, mouth: 'flat',   blush: false, sweat: true,  browTilt: 'worried', zzz: false },
  perfectionist:{ eyeY: -33, eyeRx: 4.0, eyeRy: 4.5, eyeOffsetX: 0, mouth: 'flat',   blush: false, sweat: true,  browTilt: 'worried', zzz: false },
}

function getExpression(type: string): ExpressionConfig {
  return EXPRESSIONS[type] || DEFAULT_EXPRESSION
}

export class StudentAvatar extends PIXI.Container {
  public student: StudentData
  private deskGraphics: PIXI.Graphics
  private bodyGraphics: PIXI.Graphics
  private headGraphics: PIXI.Graphics
  private hairGraphics: PIXI.Graphics
  private faceGraphics: PIXI.Graphics
  private handGraphics: PIXI.Graphics
  private bubbleContainer: PIXI.Container
  private nameLabelContainer: PIXI.Container
  private glowGraphics: PIXI.Graphics
  private shadowGraphics: PIXI.Graphics
  private zzzContainer: PIXI.Container
  private animTick: number = Math.random() * 100
  private bounceOffset: number = 0

  private onSelectCallback: (student: StudentData) => void

  constructor(student: StudentData, onSelect: (student: StudentData) => void) {
    super()
    this.student = student
    this.onSelectCallback = onSelect
    this.eventMode = 'static'
    this.cursor = 'pointer'

    this.shadowGraphics = new PIXI.Graphics()
    this.glowGraphics = new PIXI.Graphics()
    this.deskGraphics = new PIXI.Graphics()
    this.bodyGraphics = new PIXI.Graphics()
    this.headGraphics = new PIXI.Graphics()
    this.hairGraphics = new PIXI.Graphics()
    this.faceGraphics = new PIXI.Graphics()
    this.handGraphics = new PIXI.Graphics()
    this.zzzContainer = new PIXI.Container()
    this.bubbleContainer = new PIXI.Container()
    this.nameLabelContainer = new PIXI.Container()

    this.addChild(this.shadowGraphics)
    this.addChild(this.glowGraphics)
    this.addChild(this.deskGraphics)
    this.addChild(this.bodyGraphics)
    this.addChild(this.headGraphics)
    this.addChild(this.hairGraphics)
    this.addChild(this.faceGraphics)
    this.addChild(this.handGraphics)
    this.addChild(this.zzzContainer)
    this.addChild(this.nameLabelContainer)
    this.addChild(this.bubbleContainer)

    this.drawAvatar()
    this.drawNameTag()

    this.on('pointertap', () => {
      this.onSelectCallback(this.student)
    })

    this.on('pointerover', () => {
      this.scale.set(1.08)
    })
    this.on('pointerout', () => {
      this.scale.set(1)
    })
  }

  public updateStudentData(updated: Partial<StudentData>) {
    this.student = { ...this.student, ...updated }
    this.drawAvatar()
    this.drawNameTag()
    if (this.student.lastResponse && (this.student.isSpeaking || this.student.isHandRaised)) {
      this.showSpeechBubble(this.student.lastResponse)
    } else if (!this.student.isSpeaking && !this.student.isHandRaised) {
      this.hideSpeechBubble()
    }
  }

  public updateAnimation(delta: number) {
    this.animTick += delta * 0.05

    // Idle breathing / bouncing (chibi style)
    const breathY = Math.sin(this.animTick) * 2.2
    this.bounceOffset = breathY
    this.headGraphics.y = breathY
    this.hairGraphics.y = breathY
    this.faceGraphics.y = breathY
    this.bodyGraphics.y = breathY * 0.4

    // Hand raise animation with wave
    if (this.student.isHandRaised || this.student.isSpeaking) {
      const handWave = Math.sin(this.animTick * 3.5) * 4
      this.handGraphics.y = -26 + handWave
      this.handGraphics.visible = true
      this.handGraphics.rotation = Math.sin(this.animTick * 2) * 0.15
    } else {
      this.handGraphics.visible = false
      this.handGraphics.rotation = 0
    }

    // Zzz animation for inattentive
    const expr = getExpression(this.student.type)
    if (expr.zzz && !this.student.isSpeaking && !this.student.isHandRaised) {
      this.drawZzz()
    } else {
      this.zzzContainer.removeChildren()
      this.zzzContainer.visible = false
    }

    // Glow highlight with pulse
    this.glowGraphics.clear()
    if (this.student.isSelected) {
      const pulse = 0.6 + Math.sin(this.animTick * 2) * 0.15
      this.glowGraphics.roundRect(-48, -62, 96, 112, 16)
      this.glowGraphics.fill({ color: 0xfbbf24, alpha: 0.15 })
      this.glowGraphics.roundRect(-48, -62, 96, 112, 16)
      this.glowGraphics.stroke({ color: 0xfbbf24, width: 2.5, alpha: pulse })
    } else if (this.student.isSpeaking) {
      const pulse = 0.35 + Math.sin(this.animTick * 3) * 0.1
      this.glowGraphics.roundRect(-46, -60, 92, 108, 14)
      this.glowGraphics.fill({ color: 0xfbbf24, alpha: 0.08 })
      this.glowGraphics.roundRect(-46, -60, 92, 108, 14)
      this.glowGraphics.stroke({ color: 0xfbbf24, width: 1.5, alpha: pulse })
    }

    // Shadow scales with bounce
    const shadowScale = 1 - (this.bounceOffset + 2.2) / 30
    this.shadowGraphics.scale.set(Math.max(0.7, shadowScale))
    this.shadowGraphics.alpha = 0.08 + (1 - shadowScale) * 0.05
  }

  private drawAvatar() {
    const style = this.student.avatarStyle
    const expr = getExpression(this.student.type)

    // === 0. Drop shadow under desk ===
    this.shadowGraphics.clear()
    this.shadowGraphics.ellipse(0, 40, 40, 8)
    this.shadowGraphics.fill({ color: 0x000000, alpha: 0.12 })

    // === 1. Desk & Chair ===
    this.deskGraphics.clear()
    // Chair back
    this.deskGraphics.roundRect(-24, -18, 48, 28, 6)
    this.deskGraphics.fill({ color: 0x7a6548 })
    this.deskGraphics.roundRect(-24, -18, 48, 28, 6)
    this.deskGraphics.stroke({ color: 0x6b5a45, width: 1 })
    this.deskGraphics.roundRect(-22, -16, 44, 4, 2)
    this.deskGraphics.fill({ color: 0x8b7355, alpha: 0.4 })

    // Desk top with 3D effect
    this.deskGraphics.roundRect(-38, 12, 76, 30, 10)
    this.deskGraphics.fill({ color: 0xbf9f6a })
    this.deskGraphics.roundRect(-38, 12, 76, 30, 10)
    this.deskGraphics.stroke({ color: 0xaf8f5a, width: 1.5 })
    this.deskGraphics.roundRect(-36, 13, 72, 6, 3)
    this.deskGraphics.fill({ color: 0xd4b88a, alpha: 0.4 })
    this.deskGraphics.rect(-36, 38, 72, 5)
    this.deskGraphics.fill({ color: 0x9a7a50 })
    this.deskGraphics.rect(-32, 42, 5, 6)
    this.deskGraphics.fill({ color: 0x8b7355, alpha: 0.5 })
    this.deskGraphics.rect(27, 42, 5, 6)
    this.deskGraphics.fill({ color: 0x8b7355, alpha: 0.5 })

    // === 2. Body (Chibi — small body) ===
    this.bodyGraphics.clear()
    this.bodyGraphics.roundRect(-20, -10, 40, 26, 10)
    this.bodyGraphics.fill({ color: style.shirtColor })
    this.bodyGraphics.roundRect(-18, -8, 36, 6, 3)
    this.bodyGraphics.fill({ color: 0xffffff, alpha: 0.12 })
    this.bodyGraphics.roundRect(-6, -15, 12, 8, 3)
    this.bodyGraphics.fill({ color: style.skinColor })
    this.bodyGraphics.roundRect(-24, -6, 8, 14, 4)
    this.bodyGraphics.fill({ color: style.shirtColor })
    this.bodyGraphics.roundRect(16, -6, 8, 14, 4)
    this.bodyGraphics.fill({ color: style.shirtColor })

    // === 3. Head (Chibi — radius 20) ===
    this.headGraphics.clear()
    this.headGraphics.circle(0, -30, 20)
    this.headGraphics.fill({ color: style.skinColor })
    this.headGraphics.ellipse(-6, -38, 10, 6)
    this.headGraphics.fill({ color: 0xffffff, alpha: 0.1 })

    // Ears
    this.headGraphics.circle(-18, -30, 4)
    this.headGraphics.fill({ color: style.skinColor })
    this.headGraphics.circle(18, -30, 4)
    this.headGraphics.fill({ color: style.skinColor })

    // === 4. Hair ===
    this.hairGraphics.clear()
    const hairTopY = -46
    const hairH = 18

    if (style.hairStyle === 'spiky') {
      this.hairGraphics.poly([
        -18, hairTopY + 4,
        -14, hairTopY - 10,
        -8, hairTopY - 2,
        -4, hairTopY - 12,
        0, hairTopY - 4,
        4, hairTopY - 12,
        8, hairTopY - 2,
        14, hairTopY - 10,
        18, hairTopY + 4,
        20, hairTopY + 10,
        0, hairTopY + 6,
        -20, hairTopY + 10,
      ])
      this.hairGraphics.fill({ color: style.hairColor })
    } else if (style.hairStyle === 'long') {
      this.hairGraphics.roundRect(-20, hairTopY, 40, hairH, 10)
      this.hairGraphics.fill({ color: style.hairColor })
      this.hairGraphics.roundRect(-22, hairTopY - 2, 8, hairH + 22, 4)
      this.hairGraphics.fill({ color: style.hairColor })
      this.hairGraphics.roundRect(14, hairTopY - 2, 8, hairH + 22, 4)
      this.hairGraphics.fill({ color: style.hairColor })
      this.hairGraphics.roundRect(-18, hairTopY + 2, 36, 8, 4)
      this.hairGraphics.fill({ color: style.hairColor, alpha: 0.8 })
    } else if (style.hairStyle === 'bob') {
      this.hairGraphics.roundRect(-20, hairTopY, 40, hairH, 10)
      this.hairGraphics.fill({ color: style.hairColor })
      this.hairGraphics.roundRect(-21, hairTopY - 2, 10, hairH + 14, 4)
      this.hairGraphics.fill({ color: style.hairColor })
      this.hairGraphics.roundRect(11, hairTopY - 2, 10, hairH + 14, 4)
      this.hairGraphics.fill({ color: style.hairColor })
    } else if (style.hairStyle === 'curly') {
      const curls = [-14, -7, 0, 7, 14]
      curls.forEach((cx, i) => {
        const cy = hairTopY - 4 + (i % 2) * 3
        this.hairGraphics.circle(cx, cy, 7)
        this.hairGraphics.fill({ color: style.hairColor })
      })
      this.hairGraphics.roundRect(-18, hairTopY + 2, 36, 10, 5)
      this.hairGraphics.fill({ color: style.hairColor })
    } else {
      this.hairGraphics.roundRect(-19, hairTopY, 38, hairH, 9)
      this.hairGraphics.fill({ color: style.hairColor })
    }

    // Hair shine
    this.hairGraphics.ellipse(-8, hairTopY + 2, 6, 3)
    this.hairGraphics.fill({ color: 0xffffff, alpha: 0.15 })

    // === 5. Face ===
    this.faceGraphics.clear()

    // Blush
    if (expr.blush) {
      this.faceGraphics.ellipse(-13, -24, 5, 3)
      this.faceGraphics.fill({ color: 0xff8fa3, alpha: 0.45 })
      this.faceGraphics.ellipse(13, -24, 5, 3)
      this.faceGraphics.fill({ color: 0xff8fa3, alpha: 0.45 })
    }

    // Sweat drop (for worried/nervous types)
    if (expr.sweat) {
      this.faceGraphics.ellipse(16, -40, 2.5, 4)
      this.faceGraphics.fill({ color: 0x93c5fd, alpha: 0.6 })
      this.faceGraphics.circle(16, -43, 1.2)
      this.faceGraphics.fill({ color: 0x93c5fd, alpha: 0.6 })
    }

    // Eyebrows (brow tilt)
    if (expr.browTilt === 'sad') {
      this.faceGraphics.moveTo(-11, -40)
      this.faceGraphics.lineTo(-4, -37)
      this.faceGraphics.stroke({ color: 0x5c3a21, width: 1.5, cap: 'round' })
      this.faceGraphics.moveTo(4, -37)
      this.faceGraphics.lineTo(11, -40)
      this.faceGraphics.stroke({ color: 0x5c3a21, width: 1.5, cap: 'round' })
    } else if (expr.browTilt === 'worried') {
      this.faceGraphics.moveTo(-11, -39)
      this.faceGraphics.lineTo(-4, -38)
      this.faceGraphics.stroke({ color: 0x5c3a21, width: 1.5, cap: 'round' })
      this.faceGraphics.moveTo(4, -38)
      this.faceGraphics.lineTo(11, -39)
      this.faceGraphics.stroke({ color: 0x5c3a21, width: 1.5, cap: 'round' })
    } else if (expr.browTilt === 'angry') {
      this.faceGraphics.moveTo(-11, -38)
      this.faceGraphics.lineTo(-4, -40)
      this.faceGraphics.stroke({ color: 0x5c3a21, width: 1.8, cap: 'round' })
      this.faceGraphics.moveTo(4, -40)
      this.faceGraphics.lineTo(11, -38)
      this.faceGraphics.stroke({ color: 0x5c3a21, width: 1.8, cap: 'round' })
    }

    // Eyes
    const eyeY = expr.eyeY
    const eyeRx = expr.eyeRx
    const eyeRy = expr.eyeRy
    const offX = expr.eyeOffsetX

    // Left eye
    this.faceGraphics.ellipse(-7 + offX, eyeY, eyeRx, eyeRy)
    this.faceGraphics.fill({ color: 0x1e293b })
    // Eye highlight 1
    this.faceGraphics.circle(-5.5 + offX, eyeY - 2.5, 2)
    this.faceGraphics.fill({ color: 0xffffff })
    // Eye highlight 2
    this.faceGraphics.circle(-7.5 + offX, eyeY + 1, 1)
    this.faceGraphics.fill({ color: 0xffffff, alpha: 0.6 })

    // Right eye
    this.faceGraphics.ellipse(7 + offX, eyeY, eyeRx, eyeRy)
    this.faceGraphics.fill({ color: 0x1e293b })
    this.faceGraphics.circle(8.5 + offX, eyeY - 2.5, 2)
    this.faceGraphics.fill({ color: 0xffffff })
    this.faceGraphics.circle(6.5 + offX, eyeY + 1, 1)
    this.faceGraphics.fill({ color: 0xffffff, alpha: 0.6 })

    // Mouth
    if (expr.mouth === 'smile') {
      this.faceGraphics.moveTo(-5, -21)
      this.faceGraphics.quadraticCurveTo(0, -17, 5, -21)
      this.faceGraphics.stroke({ color: 0xbe123c, width: 1.8, cap: 'round' })
      this.faceGraphics.moveTo(-2, -19)
      this.faceGraphics.quadraticCurveTo(0, -17, 2, -19)
      this.faceGraphics.stroke({ color: 0xf43f5e, width: 1, cap: 'round' })
    } else if (expr.mouth === 'grin') {
      this.faceGraphics.moveTo(-6, -21)
      this.faceGraphics.quadraticCurveTo(0, -15, 6, -21)
      this.faceGraphics.stroke({ color: 0xbe123c, width: 2, cap: 'round' })
      this.faceGraphics.moveTo(-3, -19)
      this.faceGraphics.quadraticCurveTo(0, -17, 3, -19)
      this.faceGraphics.stroke({ color: 0xf43f5e, width: 1.2, cap: 'round' })
    } else if (expr.mouth === 'sad') {
      this.faceGraphics.moveTo(-4, -19)
      this.faceGraphics.quadraticCurveTo(0, -22, 4, -19)
      this.faceGraphics.stroke({ color: 0xbe123c, width: 1.5, cap: 'round' })
    } else if (expr.mouth === 'worry') {
      this.faceGraphics.moveTo(-3, -20)
      this.faceGraphics.quadraticCurveTo(0, -22, 3, -20)
      this.faceGraphics.stroke({ color: 0xbe123c, width: 1.5, cap: 'round' })
    } else if (expr.mouth === 'o') {
      this.faceGraphics.ellipse(0, -21, 3, 3.5)
      this.faceGraphics.fill({ color: 0xbe123c })
      this.faceGraphics.ellipse(0, -20, 1.5, 2)
      this.faceGraphics.fill({ color: 0xf43f5e })
    } else if (expr.mouth === 'flat') {
      this.faceGraphics.moveTo(-4, -20)
      this.faceGraphics.lineTo(4, -20)
      this.faceGraphics.stroke({ color: 0x78350f, width: 1.5, cap: 'round' })
    } else if (expr.mouth === 'shy') {
      this.faceGraphics.moveTo(-3, -20)
      this.faceGraphics.quadraticCurveTo(0, -18, 3, -20)
      this.faceGraphics.stroke({ color: 0xbe123c, width: 1.5, cap: 'round' })
    } else if (expr.mouth === 'smirk') {
      this.faceGraphics.moveTo(-4, -20)
      this.faceGraphics.quadraticCurveTo(0, -19, 4, -22)
      this.faceGraphics.stroke({ color: 0xbe123c, width: 1.8, cap: 'round' })
    }

    // Glasses
    if (style.glasses) {
      this.faceGraphics.rect(-10, eyeY - 4, 8, 7)
      this.faceGraphics.stroke({ color: 0x475569, width: 1.5 })
      this.faceGraphics.rect(2, eyeY - 4, 8, 7)
      this.faceGraphics.stroke({ color: 0x475569, width: 1.5 })
      this.faceGraphics.moveTo(-2, eyeY - 1)
      this.faceGraphics.lineTo(2, eyeY - 1)
      this.faceGraphics.stroke({ color: 0x475569, width: 1.5 })
      this.faceGraphics.moveTo(-8, eyeY - 2)
      this.faceGraphics.lineTo(-6, eyeY - 2)
      this.faceGraphics.stroke({ color: 0xffffff, width: 1, alpha: 0.5 })
    }

    // Accessories
    if (style.accessory === 'bow') {
      this.hairGraphics.moveTo(-2, -54)
      this.hairGraphics.lineTo(-10, -60)
      this.hairGraphics.lineTo(-6, -52)
      this.hairGraphics.lineTo(-10, -46)
      this.hairGraphics.closePath()
      this.hairGraphics.fill({ color: 0xe11d48 })
      this.hairGraphics.moveTo(2, -54)
      this.hairGraphics.lineTo(10, -60)
      this.hairGraphics.lineTo(6, -52)
      this.hairGraphics.lineTo(10, -46)
      this.hairGraphics.closePath()
      this.hairGraphics.fill({ color: 0xe11d48 })
      this.hairGraphics.circle(0, -53, 3)
      this.hairGraphics.fill({ color: 0xbe123c })
    } else if (style.accessory === 'cap') {
      this.hairGraphics.moveTo(-20, -42)
      this.hairGraphics.lineTo(20, -42)
      this.hairGraphics.lineTo(24, -38)
      this.hairGraphics.lineTo(-24, -38)
      this.hairGraphics.closePath()
      this.hairGraphics.fill({ color: 0xca8a04 })
      this.hairGraphics.moveTo(-18, -46)
      this.hairGraphics.lineTo(18, -46)
      this.hairGraphics.lineTo(20, -42)
      this.hairGraphics.lineTo(-20, -42)
      this.hairGraphics.closePath()
      this.hairGraphics.fill({ color: 0xd97706 })
    } else if (style.accessory === 'headband') {
      this.hairGraphics.roundRect(-20, -48, 40, 5, 2)
      this.hairGraphics.fill({ color: 0x0891b2 })
      this.hairGraphics.moveTo(14, -48)
      this.hairGraphics.lineTo(22, -54)
      this.hairGraphics.lineTo(18, -46)
      this.hairGraphics.lineTo(22, -42)
      this.hairGraphics.closePath()
      this.hairGraphics.fill({ color: 0x0891b2 })
    }

    // === 6. Hand ===
    this.handGraphics.clear()
    this.handGraphics.roundRect(14, -2, 8, 14, 3)
    this.handGraphics.fill({ color: style.shirtColor })
    this.handGraphics.circle(18, -6, 7)
    this.handGraphics.fill({ color: style.skinColor })
    this.handGraphics.moveTo(15, -9)
    this.handGraphics.lineTo(13, -12)
    this.handGraphics.stroke({ color: style.skinColor, width: 2.5, cap: 'round' })
    this.handGraphics.moveTo(18, -11)
    this.handGraphics.lineTo(18, -14)
    this.handGraphics.stroke({ color: style.skinColor, width: 2.5, cap: 'round' })
    this.handGraphics.moveTo(21, -9)
    this.handGraphics.lineTo(23, -12)
    this.handGraphics.stroke({ color: style.skinColor, width: 2.5, cap: 'round' })
  }

  private drawZzz() {
    this.zzzContainer.removeChildren()
    this.zzzContainer.visible = true

    const z1 = new PIXI.Text({
      text: 'Z',
      style: {
        fontFamily: 'system-ui, sans-serif',
        fontSize: 12,
        fontWeight: '700',
        fontStyle: 'italic',
        fill: 0x94a3b8,
      },
    })
    z1.x = 28
    z1.y = -55 + Math.sin(this.animTick * 2) * 2
    z1.alpha = 0.5 + Math.sin(this.animTick * 3) * 0.2

    const z2 = new PIXI.Text({
      text: 'z',
      style: {
        fontFamily: 'system-ui, sans-serif',
        fontSize: 9,
        fontWeight: '700',
        fontStyle: 'italic',
        fill: 0x94a3b8,
      },
    })
    z2.x = 36
    z2.y = -62 + Math.sin(this.animTick * 2 + 1) * 2
    z2.alpha = 0.4 + Math.sin(this.animTick * 3 + 1) * 0.15

    const z3 = new PIXI.Text({
      text: 'z',
      style: {
        fontFamily: 'system-ui, sans-serif',
        fontSize: 7,
        fontWeight: '700',
        fontStyle: 'italic',
        fill: 0x94a3b8,
      },
    })
    z3.x = 42
    z3.y = -68 + Math.sin(this.animTick * 2 + 2) * 2
    z3.alpha = 0.3 + Math.sin(this.animTick * 3 + 2) * 0.1

    this.zzzContainer.addChild(z1, z2, z3)
  }

  private drawNameTag() {
    this.nameLabelContainer.removeChildren()

    const labelBg = new PIXI.Graphics()

    const nameText = new PIXI.Text({
      text: this.student.name,
      style: {
        fontFamily: 'Be Vietnam Pro, system-ui, sans-serif',
        fontSize: 11,
        fontWeight: '600',
        fill: 0x334155,
      },
    })

    const padX = 10
    const padY = 4
    const width = Math.max(68, nameText.width + padX * 2)
    const height = nameText.height + padY * 2

    labelBg.roundRect(-width / 2 + 1, 48 + 1, width, height, 6)
    labelBg.fill({ color: 0x000000, alpha: 0.06 })
    labelBg.roundRect(-width / 2, 48, width, height, 6)
    labelBg.fill({ color: 0xffffff })
    labelBg.roundRect(-width / 2, 48, width, height, 6)
    labelBg.stroke({ color: 0xe2e8f0, width: 1 })

    const colorMap: Record<string, number> = {
      emerald: 0x059669,
      amber: 0xd97706,
      rose: 0xe11d48,
    }
    const accentColor = colorMap[this.student.color] || 0x94a3b8
    labelBg.roundRect(-width / 2, 48, width, 3, 3)
    labelBg.fill({ color: accentColor, alpha: 0.6 })

    nameText.x = -nameText.width / 2
    nameText.y = 48 + padY + 1.5

    this.nameLabelContainer.addChild(labelBg)
    this.nameLabelContainer.addChild(nameText)
  }

  public showSpeechBubble(text: string) {
    this.bubbleContainer.removeChildren()
    if (!text.trim()) return

    const truncated = text.length > 75 ? text.substring(0, 72) + '...' : text

    const bubbleBg = new PIXI.Graphics()
    const bubbleText = new PIXI.Text({
      text: truncated,
      style: {
        fontFamily: 'Be Vietnam Pro, system-ui, sans-serif',
        fontSize: 11,
        fontWeight: '500',
        fill: 0x1e293b,
        wordWrap: true,
        wordWrapWidth: 170,
        align: 'center',
        lineHeight: 16,
      },
    })

    const bw = Math.max(95, bubbleText.width + 20)
    const bh = bubbleText.height + 16
    const bubbleY = -52 - bh

    bubbleBg.roundRect(-bw / 2 + 1, bubbleY + 2, bw, bh, 8)
    bubbleBg.fill({ color: 0x000000, alpha: 0.06 })
    bubbleBg.roundRect(-bw / 2, bubbleY, bw, bh, 8)
    bubbleBg.fill({ color: 0xffffff })
    bubbleBg.roundRect(-bw / 2, bubbleY, bw, bh, 8)
    bubbleBg.stroke({ color: 0xe2e8f0, width: 1 })
    bubbleBg.roundRect(-bw / 2, bubbleY, bw, 3, 3)
    bubbleBg.fill({ color: 0xfbbf24, alpha: 0.5 })

    bubbleBg.poly([-7, bubbleY + bh, 0, bubbleY + bh + 7, 7, bubbleY + bh])
    bubbleBg.fill({ color: 0xe2e8f0 })
    bubbleBg.poly([-5.5, bubbleY + bh - 0.5, 0, bubbleY + bh + 5, 5.5, bubbleY + bh - 0.5])
    bubbleBg.fill({ color: 0xffffff })

    bubbleText.x = -bubbleText.width / 2
    bubbleText.y = bubbleY + 8

    this.bubbleContainer.addChild(bubbleBg)
    this.bubbleContainer.addChild(bubbleText)
    this.bubbleContainer.visible = true
  }

  public hideSpeechBubble() {
    this.bubbleContainer.visible = false
    this.bubbleContainer.removeChildren()
  }
}
