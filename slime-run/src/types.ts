export interface Platform {
  x: number
  y: number
  width: number
  height: number
  moving?: boolean
  moveRange?: number
  moveSpeed?: number
  moveAxis?: 'x' | 'y'
  originalX?: number
  originalY?: number
}

export interface Enemy {
  x: number
  y: number
  width: number
  height: number
  type: 'direwolf' | 'orc' | 'shadow'
  emoji: string
  speed: number
  patrolRange: number
  originalX: number
  direction: number
  alive: boolean
}

export interface Collectible {
  x: number
  y: number
  width: number
  height: number
  type: 'crystal' | 'heart'
  emoji: string
  collected: boolean
}

export interface Projectile {
  x: number
  y: number
  vx: number
  vy: number
  width: number
  height: number
}

export interface LevelData {
  id: number
  name: string
  bgGradient: [string, string]
  platforms: Platform[]
  enemies: Enemy[]
  collectibles: Collectible[]
  flagX: number
  flagY: number
  levelWidth: number
  hasProjectiles?: boolean
}

export interface Player {
  x: number
  y: number
  vx: number
  vy: number
  width: number
  height: number
  onGround: boolean
  jumpsLeft: number
  hp: number
  maxHp: number
  invincible: number
  dead: boolean
  facingRight: boolean
}

export interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  maxLife: number
  color: string
  size: number
}

export interface Camera {
  x: number
  y: number
}

export interface GameState {
  screen: 'title' | 'game' | 'victory' | 'gameover'
  currentLevel: number
  score: number
  levelsUnlocked: number
  setScreen: (screen: GameState['screen']) => void
  setCurrentLevel: (level: number) => void
  addScore: (points: number) => void
  unlockLevel: (level: number) => void
  resetScore: () => void
}
