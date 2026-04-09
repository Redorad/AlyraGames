export interface Paddle {
  x: number
  y: number
  width: number
  height: number
  baseWidth: number
}

export interface Ball {
  x: number
  y: number
  vx: number
  vy: number
  radius: number
  speed: number
  active: boolean
}

export interface Brick {
  x: number
  y: number
  width: number
  height: number
  hits: number
  maxHits: number
  color: string
  glowColor: string
  alive: boolean
}

export type PowerUpType = 'wide' | 'multi' | 'slow'

export interface PowerUp {
  x: number
  y: number
  width: number
  height: number
  vy: number
  type: PowerUpType
  active: boolean
}

export interface LevelDef {
  name: string
  layout: number[][] // 0=empty, 1=1hit, 2=2hit, 3=3hit
}

export interface GameState {
  score: number
  lives: number
  level: number
  highScore: number
  status: 'menu' | 'playing' | 'paused' | 'gameover' | 'levelcomplete' | 'win'
}
