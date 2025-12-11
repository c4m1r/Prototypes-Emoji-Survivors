export interface Vector2 {
  x: number;
  y: number;
}

export interface Hero {
  emoji: string;
  name: string;
  nameRu: string;
  nameEn: string;
  nameEs: string;
  nameZh: string;
  unlockCondition: string;
  passive: string;
  passiveRu: string;
  passiveEn: string;
  passiveEs: string;
  passiveZh: string;
  bonuses: HeroBonuses;
}

export interface HeroBonuses {
  xpBonus?: number;
  speedBonus?: number;
  magicDamageBonus?: number;
  doubleJump?: boolean;
  doubleDamageChance?: number;
  invulnerabilityOnHit?: number;
  baseHPBonus?: number;
  musicWave?: boolean;
}

export interface Enemy {
  id: string;
  emoji: string;
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  speed: number;
  damage: number;
  pattern: string;
  elite?: string;
  angle?: number;
}

export interface Boss {
  id: string;
  emoji: string;
  name: string;
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  speed: number;
  damage: number;
  phase: number;
}

export interface Weapon {
  id: string;
  emoji: string;
  name: string;
  level: number;
  damage: number;
  cooldown: number;
  lastFired: number;
  projectiles?: Projectile[];
  radius?: number;
  angle?: number;
  orbitalAngle?: number;
}

export interface Projectile {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  emoji: string;
  damage: number;
  bounces: number;
  maxBounces: number;
  targetId?: string;
}

export interface Particle {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  emoji: string;
  life: number;
  maxLife: number;
  size: number;
}

export interface Tile {
  emoji: string;
  passable: boolean;
  damage?: number;
}

export interface MapTheme {
  name: string;
  tiles: {
    grass: string;
    dirt: string;
    tree: string;
    rock: string;
    water: string;
    lava: string;
    wall: string;
    fog: string;
  };
  background: string;
}

export interface Upgrade {
  id: string;
  emoji: string;
  name: string;
  description: string;
  type: 'weapon' | 'stat' | 'new_weapon';
  weaponId?: string;
  stat?: string;
  value?: number;
}

export interface GameState {
  player: {
    x: number;
    y: number;
    hp: number;
    maxHp: number;
    level: number;
    xp: number;
    xpToLevel: number;
    speed: number;
    hero: string;
  };
  enemies: Enemy[];
  boss: Boss | null;
  weapons: Weapon[];
  projectiles: Projectile[];
  particles: Particle[];
  loot: Loot[];
  map: Tile[][];
  theme: MapTheme;
  seed: string;
  wave: number;
  time: number;
  coins: number;
  kills: number;
  damage: number;
  isPaused: boolean;
  isUpgrading: boolean;
  availableUpgrades: Upgrade[];
  mazeLevel?: number;
  gameMode?: string;
}

export interface Loot {
  id: string;
  x: number;
  y: number;
  type: 'coin' | 'health' | 'xp' | 'gem';
  emoji: string;
  value: number;
}

export interface GameMode {
  id: string;
  emoji: string;
  name: string;
  description: string;
}

export interface PlayerProfile {
  id: string;
  playerName: string;
  language: string;
  totalCoins: number;
  totalDeaths: number;
  totalDamageDealt: number;
  maxSurvivalTime: number;
  bossDefeated: boolean;
  maxUpgradesInRun: number;
  unlockedHeroes: string[];
  selectedHero: string;
}

export interface GameHistory {
  id: string;
  seed: string;
  gameMode: string;
  heroUsed: string;
  durationSeconds: number;
  levelReached: number;
  coinsEarned: number;
  enemiesKilled: number;
  damageDealt: number;
  playedAt: string;
}
