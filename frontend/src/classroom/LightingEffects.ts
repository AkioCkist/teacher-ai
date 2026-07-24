import * as PIXI from 'pixi.js'

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  size: number
  alpha: number
  phase: number
  speed: number
}

export class LightingEffects extends PIXI.Container {
  private particles: Particle[] = []
  private particleGraphics: PIXI.Graphics
  private widthPx: number = 800
  private heightPx: number = 600
  private animTick: number = 0

  constructor() {
    super()
    this.particleGraphics = new PIXI.Graphics()
    this.addChild(this.particleGraphics)
    this.initParticles()
  }

  private initParticles() {
    this.particles = []
    for (let i = 0; i < 18; i++) {
      this.particles.push(this.createParticle())
    }
  }

  private createParticle(): Particle {
    return {
      x: Math.random() * this.widthPx,
      y: Math.random() * this.heightPx * 0.6,
      vx: (Math.random() - 0.5) * 0.3,
      vy: -0.1 - Math.random() * 0.25,
      size: 1.2 + Math.random() * 2.5,
      alpha: 0.15 + Math.random() * 0.35,
      phase: Math.random() * Math.PI * 2,
      speed: 0.5 + Math.random() * 1.5,
    }
  }

  public updateLayout(width: number, height: number) {
    this.widthPx = width
    this.heightPx = height
    // Reset particles that are out of bounds
    this.particles.forEach(p => {
      if (p.x > width || p.x < 0 || p.y < 0 || p.y > height) {
        Object.assign(p, this.createParticle())
      }
    })
  }

  public updateAnimation(delta: number) {
    this.animTick += delta * 0.02
    this.particleGraphics.clear()

    this.particles.forEach(p => {
      // Update position
      p.x += p.vx * delta * 0.5
      p.y += p.vy * delta * 0.5
      p.phase += delta * 0.03 * p.speed

      // Floating oscillation
      const oscX = Math.sin(p.phase) * 0.8
      const oscY = Math.cos(p.phase * 0.7) * 0.5

      // Pulsing alpha
      const pulseAlpha = p.alpha * (0.6 + 0.4 * Math.sin(p.phase * 2))

      // Draw particle
      const drawX = p.x + oscX
      const drawY = p.y + oscY

      // Soft glow
      this.particleGraphics.circle(drawX, drawY, p.size * 2)
      this.particleGraphics.fill({ color: 0xfff8e7, alpha: pulseAlpha * 0.2 })
      // Core
      this.particleGraphics.circle(drawX, drawY, p.size)
      this.particleGraphics.fill({ color: 0xfff8e7, alpha: pulseAlpha * 0.6 })
      // Bright center
      this.particleGraphics.circle(drawX, drawY, p.size * 0.4)
      this.particleGraphics.fill({ color: 0xffffff, alpha: pulseAlpha * 0.9 })

      // Reset if out of bounds
      if (p.y < -10 || p.x < -20 || p.x > this.widthPx + 20) {
        Object.assign(p, this.createParticle())
        p.y = this.heightPx + 10
      }
    })
  }
}
