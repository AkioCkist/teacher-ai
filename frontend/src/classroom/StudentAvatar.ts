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

export class StudentAvatar extends PIXI.Container {
  public student: StudentData
  private deskGraphics: PIXI.Graphics
  private bodyGraphics: PIXI.Graphics
  private headGraphics: PIXI.Graphics
  private handGraphics: PIXI.Graphics
  private bubbleContainer: PIXI.Container
  private nameLabelContainer: PIXI.Container
  private glowGraphics: PIXI.Graphics
  private animTick: number = Math.random() * 100

  private onSelectCallback: (student: StudentData) => void

  constructor(student: StudentData, onSelect: (student: StudentData) => void) {
    super()
    this.student = student
    this.onSelectCallback = onSelect
    this.eventMode = 'static'
    this.cursor = 'pointer'

    this.glowGraphics = new PIXI.Graphics()
    this.deskGraphics = new PIXI.Graphics()
    this.bodyGraphics = new PIXI.Graphics()
    this.headGraphics = new PIXI.Graphics()
    this.handGraphics = new PIXI.Graphics()
    this.bubbleContainer = new PIXI.Container()
    this.nameLabelContainer = new PIXI.Container()

    this.addChild(this.glowGraphics)
    this.addChild(this.bodyGraphics)
    this.addChild(this.headGraphics)
    this.addChild(this.handGraphics)
    this.addChild(this.deskGraphics)
    this.addChild(this.nameLabelContainer)
    this.addChild(this.bubbleContainer)

    this.drawAvatar()
    this.drawNameTag()

    this.on('pointertap', () => {
      this.onSelectCallback(this.student)
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

    // Idle breathing movement
    const breathY = Math.sin(this.animTick) * 1.5
    this.headGraphics.y = breathY
    this.bodyGraphics.y = breathY * 0.5

    // Hand raise animation
    if (this.student.isHandRaised || this.student.isSpeaking) {
      const handWave = Math.sin(this.animTick * 3) * 3
      this.handGraphics.y = -22 + handWave
      this.handGraphics.visible = true
    } else {
      this.handGraphics.visible = false
    }

    // Glow highlight animation (Amber/Orange theme)
    this.glowGraphics.clear()
    if (this.student.isSelected) {
      this.glowGraphics.rect(-45, -55, 90, 100)
      this.glowGraphics.fill({ color: 0xd97706, alpha: 0.25 })
      this.glowGraphics.stroke({ color: 0xd97706, width: 3, alpha: 0.9 })
    } else if (this.student.isSpeaking) {
      this.glowGraphics.rect(-42, -52, 84, 96)
      this.glowGraphics.fill({ color: 0xf59e0b, alpha: 0.2 })
      this.glowGraphics.stroke({ color: 0xd97706, width: 2.5, alpha: 0.8 })
    }
  }

  private drawAvatar() {
    const style = this.student.avatarStyle

    // 1. Desk & Chair (Warm Amber Wood)
    this.deskGraphics.clear()
    // Chair back
    this.deskGraphics.roundRect(-22, -15, 44, 25, 4)
    this.deskGraphics.fill({ color: 0x92400e })
    // Wooden Desk Top
    this.deskGraphics.roundRect(-36, 12, 72, 28, 6)
    this.deskGraphics.fill({ color: 0xf59e0b })
    this.deskGraphics.stroke({ color: 0xd97706, width: 2 })
    // Desk lip
    this.deskGraphics.rect(-34, 35, 68, 4)
    this.deskGraphics.fill({ color: 0xb45309 })

    // 2. Student Body (Torso & Shoulders)
    this.bodyGraphics.clear()
    this.bodyGraphics.roundRect(-18, -10, 36, 26, 8)
    this.bodyGraphics.fill({ color: style.shirtColor })
    // Collar/Neck
    this.bodyGraphics.rect(-5, -14, 10, 6)
    this.bodyGraphics.fill({ color: style.skinColor })

    // 3. Head & Face
    this.headGraphics.clear()
    // Head base
    this.headGraphics.circle(0, -28, 16)
    this.headGraphics.fill({ color: style.skinColor })

    // Ears
    this.headGraphics.circle(-16, -28, 3.5)
    this.headGraphics.fill({ color: style.skinColor })
    this.headGraphics.circle(16, -28, 3.5)
    this.headGraphics.fill({ color: style.skinColor })

    // Eyes
    this.headGraphics.circle(-5, -29, 2)
    this.headGraphics.fill({ color: 0x1e293b })
    this.headGraphics.circle(5, -29, 2)
    this.headGraphics.fill({ color: 0x1e293b })

    // Smile / Mouth
    this.headGraphics.moveTo(-4, -22)
    this.headGraphics.quadraticCurveTo(0, -19, 4, -22)
    this.headGraphics.stroke({ color: 0x78350f, width: 1.5 })

    // Hair
    this.headGraphics.circle(0, -34, 15)
    this.headGraphics.fill({ color: style.hairColor })
    if (style.hairStyle === 'spiky') {
      this.headGraphics.poly([-12, -35, -8, -43, -4, -35, 0, -45, 4, -35, 8, -43, 12, -35])
      this.headGraphics.fill({ color: style.hairColor })
    } else if (style.hairStyle === 'long' || style.hairStyle === 'bob') {
      this.headGraphics.roundRect(-17, -35, 34, 20, 4)
      this.headGraphics.fill({ color: style.hairColor })
    }

    // Glasses
    if (style.glasses) {
      this.headGraphics.rect(-9, -32, 7, 6)
      this.headGraphics.stroke({ color: 0x334155, width: 1.5 })
      this.headGraphics.rect(2, -32, 7, 6)
      this.headGraphics.stroke({ color: 0x334155, width: 1.5 })
      this.headGraphics.moveTo(-2, -29)
      this.headGraphics.lineTo(2, -29)
      this.headGraphics.stroke({ color: 0x334155, width: 1.5 })
    }

    // Hand (for raising hand)
    this.handGraphics.clear()
    this.handGraphics.circle(18, 0, 6)
    this.handGraphics.fill({ color: style.skinColor })
    this.handGraphics.rect(15, 4, 6, 12)
    this.handGraphics.fill({ color: style.shirtColor })
  }

  private drawNameTag() {
    this.nameLabelContainer.removeChildren()

    const labelBg = new PIXI.Graphics()

    // High quality canvas text rendering for name tag
    const nameText = new PIXI.Text({
      text: this.student.name,
      style: {
        fontFamily: 'Be Vietnam Pro, system-ui, sans-serif',
        fontSize: 11,
        fontWeight: '600',
        fill: 0x1e293b,
      },
    })

    const padX = 8
    const padY = 3
    const width = Math.max(60, nameText.width + padX * 2)
    const height = nameText.height + padY * 2

    labelBg.roundRect(-width / 2, 22, width, height, 6)
    labelBg.fill({ color: 0xffffff })
    labelBg.stroke({ color: 0xd97706, width: 1.5 })

    nameText.x = -nameText.width / 2
    nameText.y = 22 + padY

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
        fill: 0x0f172a,
        wordWrap: true,
        wordWrapWidth: 160,
        align: 'center',
      },
    })

    const bw = Math.max(90, bubbleText.width + 16)
    const bh = bubbleText.height + 14

    // Speech bubble box
    bubbleBg.roundRect(-bw / 2, -48 - bh, bw, bh, 8)
    bubbleBg.fill({ color: 0xffffff })
    bubbleBg.stroke({ color: 0xd97706, width: 2 })

    // Speech pointer tail
    bubbleBg.poly([
      -6, -48,
      0, -41,
      6, -48
    ])
    bubbleBg.fill({ color: 0xffffff })

    bubbleText.x = -bubbleText.width / 2
    bubbleText.y = -48 - bh + 7

    this.bubbleContainer.addChild(bubbleBg)
    this.bubbleContainer.addChild(bubbleText)
    this.bubbleContainer.visible = true
  }

  public hideSpeechBubble() {
    this.bubbleContainer.visible = false
    this.bubbleContainer.removeChildren()
  }
}
