import { useEffect, useRef, useState } from 'react';
import { GameState, Enemy, Projectile, Particle, Loot, Boss, Weapon, Upgrade } from '../types/game';
import { generateMap, seededRandom, generateSeed } from '../utils/mapGenerator';
import { heroes } from '../data/heroes';
import { UpgradeCard } from './UpgradeCard';

const TILE_SIZE = 48;
const CANVAS_WIDTH = 960;
const CANVAS_HEIGHT = 640;
const MAP_WIDTH = 60;
const MAP_HEIGHT = 45;

interface GameEngineProps {
  heroEmoji: string;
  gameMode: string;
  seed?: string;
  onGameEnd: (stats: any) => void;
  language: string;
}

export function GameEngine({ heroEmoji, gameMode, seed, onGameEnd, language }: GameEngineProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [shake, setShake] = useState(0);
  const gameLoopRef = useRef<number>();
  const keysRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const gameSeed = seed || generateSeed();
    const { map, theme } = generateMap(gameSeed, MAP_WIDTH, MAP_HEIGHT, gameMode, 0);
    const hero = heroes.find(h => h.emoji === heroEmoji)!;

    const initialState: GameState = {
      player: {
        x: MAP_WIDTH * TILE_SIZE / 2,
        y: MAP_HEIGHT * TILE_SIZE / 2,
        hp: 100 + (hero.bonuses.baseHPBonus || 0),
        maxHp: 100 + (hero.bonuses.baseHPBonus || 0),
        level: 1,
        xp: 0,
        xpToLevel: 100,
        speed: 3 * (1 + (hero.bonuses.speedBonus || 0)),
        hero: heroEmoji,
      },
      enemies: [],
      boss: null,
      weapons: [createWeapon('🌀', 'autoBullet', 1)],
      projectiles: [],
      particles: [],
      loot: [],
      map,
      theme,
      seed: gameSeed,
      wave: 1,
      time: 0,
      coins: 0,
      kills: 0,
      damage: 0,
      isPaused: false,
      isUpgrading: false,
      availableUpgrades: [],
      mazeLevel: gameMode === 'maze' ? 1 : 0,
      gameMode,
    };

    setGameState(initialState);

    const handleKeyDown = (e: KeyboardEvent) => {
      keysRef.current.add(e.key.toLowerCase());
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysRef.current.delete(e.key.toLowerCase());
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
      }
    };
  }, [heroEmoji, gameMode, seed]);

  useEffect(() => {
    if (!gameState || gameState.isPaused || gameState.isUpgrading) return;

    let lastTime = Date.now();
    const gameLoop = () => {
      const now = Date.now();
      const deltaTime = (now - lastTime) / 1000;
      lastTime = now;

      setGameState(prevState => {
        if (!prevState) return prevState;
        return updateGame(prevState, deltaTime, keysRef.current);
      });

      gameLoopRef.current = requestAnimationFrame(gameLoop);
    };

    gameLoopRef.current = requestAnimationFrame(gameLoop);

    return () => {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
      }
    };
  }, [gameState?.isPaused, gameState?.isUpgrading]);

  useEffect(() => {
    if (!gameState || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d')!;

    renderGame(ctx, gameState, shake);
  }, [gameState, shake]);

  const handleUpgradeChoice = (upgrade: Upgrade) => {
    setGameState(prev => {
      if (!prev) return prev;

      let newState = { ...prev };
      newState.isUpgrading = false;
      newState.availableUpgrades = [];

      if (upgrade.type === 'new_weapon' && upgrade.weaponId) {
        const weaponData = getWeaponData(upgrade.weaponId);
        newState.weapons = [...newState.weapons, weaponData];
      } else if (upgrade.type === 'weapon' && upgrade.weaponId) {
        newState.weapons = newState.weapons.map(w => {
          if (w.id === upgrade.weaponId) {
            return { ...w, level: w.level + 1 };
          }
          return w;
        });
      } else if (upgrade.type === 'stat') {
        if (upgrade.stat === 'hp') {
          newState.player.maxHp += upgrade.value || 0;
          newState.player.hp = Math.min(newState.player.hp + (upgrade.value || 0), newState.player.maxHp);
        }
      }

      return newState;
    });
  };

  if (!gameState) return null;

  return (
    <div className="relative w-full h-screen overflow-hidden" style={{ background: gameState.theme.background }}>
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/10 to-black/30 pointer-events-none" />

      <div
        className="absolute inset-0 flex items-center justify-center"
        style={{ transform: `translate(${shake}px, ${shake}px)` }}
      >
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          className="border-4 border-black/50 shadow-2xl"
          style={{ imageRendering: 'pixelated' }}
        />
      </div>

      <div className="absolute top-4 left-4 bg-black/70 text-white px-4 py-2 rounded-lg font-mono text-sm backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <span>{gameState.player.hero}</span>
          <span>HP: {Math.max(0, gameState.player.hp)}/{gameState.player.maxHp}</span>
        </div>
        <div>LVL {gameState.player.level} | XP: {gameState.player.xp}/{gameState.player.xpToLevel}</div>
        <div>💰 {gameState.coins} | ⏱ {Math.floor(gameState.time)}s | 👾 {gameState.kills}</div>
        <div>Wave {gameState.wave}</div>
      </div>

      {gameState.isUpgrading && (
        <div className="absolute inset-0 bg-black/90 flex items-center justify-center backdrop-blur-md">
          <div className="bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-12 rounded-3xl shadow-2xl max-w-2xl border-2 border-purple-500/50">
            <h2 className="text-4xl font-bold bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent text-center mb-8">
              Choose Power
            </h2>
            <div className="flex justify-center gap-8">
              {gameState.availableUpgrades.map(upgrade => (
                <UpgradeCard
                  key={upgrade.id}
                  upgrade={upgrade}
                  onClick={handleUpgradeChoice}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {gameState.player.hp <= 0 && (
        <div className="absolute inset-0 bg-black/90 flex items-center justify-center backdrop-blur-sm">
          <div className="bg-gradient-to-br from-red-900 to-gray-900 p-12 rounded-2xl shadow-2xl text-center">
            <h2 className="text-5xl font-bold text-white mb-4">💀 Game Over</h2>
            <div className="text-white text-xl space-y-2 mb-6">
              <p>Survived: {Math.floor(gameState.time)}s</p>
              <p>Level: {gameState.player.level}</p>
              <p>Kills: {gameState.kills}</p>
              <p>Coins: {gameState.coins}</p>
            </div>
            <button
              onClick={() => onGameEnd({
                time: gameState.time,
                level: gameState.player.level,
                kills: gameState.kills,
                coins: gameState.coins,
                damage: gameState.damage,
                seed: gameState.seed,
              })}
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg text-xl font-bold transition-colors"
            >
              Return to Menu
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function createWeapon(emoji: string, id: string, level: number): Weapon {
  return {
    id,
    emoji,
    name: id,
    level,
    damage: 10,
    cooldown: 1000,
    lastFired: 0,
    projectiles: [],
    angle: 0,
  };
}

function getWeaponData(id: string): Weapon {
  const weapons: Record<string, Weapon> = {
    autoBullet: { id: 'autoBullet', emoji: '🌀', name: 'Auto Bullet', level: 1, damage: 10, cooldown: 1000, lastFired: 0 },
    fireRing: { id: 'fireRing', emoji: '🔥', name: 'Fire Ring', level: 1, damage: 8, cooldown: 100, lastFired: 0, radius: 80, angle: 0 },
    magicCharge: { id: 'magicCharge', emoji: '🌟', name: 'Magic Charge', level: 1, damage: 25, cooldown: 2000, lastFired: 0 },
    radioWave: { id: 'radioWave', emoji: '📡', name: 'Radio Wave', level: 1, damage: 15, cooldown: 3000, lastFired: 0 },
    birdAttack: { id: 'birdAttack', emoji: '🐦', name: 'Birds', level: 1, damage: 12, cooldown: 1500, lastFired: 0, orbitalAngle: 0 },
  };
  return weapons[id] || weapons.autoBullet;
}

function updateGame(state: GameState, deltaTime: number, keys: Set<string>): GameState {
  const newState = { ...state };
  newState.time += deltaTime;

  const moveSpeed = newState.player.speed;
  let dx = 0;
  let dy = 0;

  if (keys.has('w') || keys.has('arrowup')) dy -= moveSpeed;
  if (keys.has('s') || keys.has('arrowdown')) dy += moveSpeed;
  if (keys.has('a') || keys.has('arrowleft')) dx -= moveSpeed;
  if (keys.has('d') || keys.has('arrowright')) dx += moveSpeed;

  if (dx !== 0 && dy !== 0) {
    dx *= 0.707;
    dy *= 0.707;
  }

  const newX = newState.player.x + dx;
  const newY = newState.player.y + dy;
  const tileX = Math.floor(newX / TILE_SIZE);
  const tileY = Math.floor(newY / TILE_SIZE);

  if (tileX >= 0 && tileX < MAP_WIDTH && tileY >= 0 && tileY < MAP_HEIGHT) {
    const tile = newState.map[tileY][tileX];
    if (tile.passable) {
      newState.player.x = Math.max(20, Math.min(MAP_WIDTH * TILE_SIZE - 20, newX));
      newState.player.y = Math.max(20, Math.min(MAP_HEIGHT * TILE_SIZE - 20, newY));
    }
  }

  if (Math.floor(newState.time) % 5 === 0 && Math.floor(newState.time) !== Math.floor(state.time)) {
    spawnEnemies(newState);
  }

  if (Math.floor(newState.time) % 72 === 0 && Math.floor(newState.time) !== 0 && Math.floor(newState.time) !== Math.floor(state.time)) {
    newState.wave++;
    spawnBoss(newState);
  }

  updateEnemies(newState, deltaTime);
  updateWeapons(newState, deltaTime);
  updateProjectiles(newState, deltaTime);
  updateParticles(newState, deltaTime);
  updateLoot(newState, deltaTime);
  checkCollisions(newState);

  if (newState.player.xp >= newState.player.xpToLevel) {
    newState.player.level++;
    newState.player.xp = 0;
    newState.player.xpToLevel = Math.floor(newState.player.xpToLevel * 1.5);
    newState.isUpgrading = true;
    newState.availableUpgrades = generateUpgrades(newState);
  }

  if (newState.gameMode === 'maze') {
    const exitMargin = 100;
    const isNearExit =
      (newState.player.x < exitMargin && newState.player.y < exitMargin) ||
      (newState.player.x > MAP_WIDTH * TILE_SIZE - exitMargin && newState.player.y < exitMargin) ||
      (newState.player.x < exitMargin && newState.player.y > MAP_HEIGHT * TILE_SIZE - exitMargin) ||
      (newState.player.x > MAP_WIDTH * TILE_SIZE - exitMargin && newState.player.y > MAP_HEIGHT * TILE_SIZE - exitMargin);

    if (isNearExit && newState.enemies.length === 0) {
      newState.mazeLevel = (newState.mazeLevel || 0) + 1;
      const newSeed = newState.seed + newState.mazeLevel;
      const { map, theme } = generateMap(newSeed, MAP_WIDTH, MAP_HEIGHT, 'maze', newState.mazeLevel);
      newState.map = map;
      newState.theme = theme;
      newState.player.x = MAP_WIDTH * TILE_SIZE / 2;
      newState.player.y = MAP_HEIGHT * TILE_SIZE / 2;
      newState.wave++;
    }
  }

  return newState;
}

function spawnEnemies(state: GameState) {
  const enemyTypes = ['🐀', '🧟', '🦇', '🐉', '🤖', '👾'];
  const count = 3 + Math.floor(state.wave / 2);

  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const distance = 600 + Math.random() * 300;
    const x = Math.max(50, Math.min(MAP_WIDTH * TILE_SIZE - 50, state.player.x + Math.cos(angle) * distance));
    const y = Math.max(50, Math.min(MAP_HEIGHT * TILE_SIZE - 50, state.player.y + Math.sin(angle) * distance));

    const emoji = enemyTypes[Math.floor(seededRandom(state.seed, state.time * 1000 + i) * enemyTypes.length)];
    const baseHp = 20 + state.wave * 2;
    const baseSpeed = 1 + state.wave * 0.07;

    state.enemies.push({
      id: `enemy-${Date.now()}-${i}`,
      emoji,
      x,
      y,
      hp: baseHp,
      maxHp: baseHp,
      speed: baseSpeed,
      damage: 10 + state.wave,
      pattern: 'chase',
    });
  }
}

function spawnBoss(state: GameState) {
  const bosses = ['💀', '🐲', '🤖', '👾', '🔥'];
  const emoji = bosses[Math.floor(seededRandom(state.seed, state.wave) * bosses.length)];

  state.boss = {
    id: `boss-${Date.now()}`,
    emoji,
    name: 'Boss',
    x: state.player.x + 300,
    y: state.player.y,
    hp: 500 * state.wave,
    maxHp: 500 * state.wave,
    speed: 0.5,
    damage: 20 * state.wave,
    phase: 1,
  };
}

function updateEnemies(state: GameState, deltaTime: number) {
  state.enemies.forEach(enemy => {
    const dx = state.player.x - enemy.x;
    const dy = state.player.y - enemy.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist > 0) {
      enemy.x += (dx / dist) * enemy.speed;
      enemy.y += (dy / dist) * enemy.speed;
    }
  });

  if (state.boss) {
    const dx = state.player.x - state.boss.x;
    const dy = state.player.y - state.boss.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist > 0) {
      state.boss.x += (dx / dist) * state.boss.speed;
      state.boss.y += (dy / dist) * state.boss.speed;
    }
  }
}

function updateWeapons(state: GameState, deltaTime: number) {
  const now = Date.now();

  state.weapons.forEach(weapon => {
    if (now - weapon.lastFired >= weapon.cooldown) {
      if (weapon.id === 'autoBullet') {
        fireAutoBullet(state, weapon);
        weapon.lastFired = now;
      } else if (weapon.id === 'fireRing') {
        fireFireRing(state, weapon);
        weapon.lastFired = now;
      } else if (weapon.id === 'magicCharge') {
        fireMagicCharge(state, weapon);
        weapon.lastFired = now;
      } else if (weapon.id === 'radioWave') {
        fireRadioWave(state, weapon);
        weapon.lastFired = now;
      } else if (weapon.id === 'birdAttack') {
        fireBirdAttack(state, weapon);
        weapon.lastFired = now;
      }
    }

    if (weapon.id === 'fireRing') {
      weapon.angle = (weapon.angle || 0) + 0.05;
    }
  });
}

function fireAutoBullet(state: GameState, weapon: Weapon) {
  if (state.enemies.length === 0 && !state.boss) return;

  let target = state.boss || state.enemies[0];
  let minDist = Infinity;

  state.enemies.forEach(enemy => {
    const dist = Math.hypot(enemy.x - state.player.x, enemy.y - state.player.y);
    if (dist < minDist) {
      minDist = dist;
      target = enemy;
    }
  });

  const dx = target.x - state.player.x;
  const dy = target.y - state.player.y;
  const dist = Math.sqrt(dx * dx + dy * dy);

  state.projectiles.push({
    id: `proj-${Date.now()}`,
    x: state.player.x,
    y: state.player.y,
    vx: (dx / dist) * 8,
    vy: (dy / dist) * 8,
    emoji: weapon.emoji,
    damage: weapon.damage * weapon.level,
    bounces: 0,
    maxBounces: weapon.level + 1,
  });
}

function fireFireRing(state: GameState, weapon: Weapon) {
  let segments = 2;
  let cooldown = 5000;

  if (weapon.level >= 2) segments = 4;
  if (weapon.level >= 3) segments = 6;
  if (weapon.level >= 4) segments = 8;

  if (weapon.level >= 2) cooldown = 4000;
  if (weapon.level >= 3) cooldown = 3500;
  if (weapon.level >= 4) cooldown = 3000;

  weapon.cooldown = cooldown;

  const radius = 60;

  for (let i = 0; i < segments; i++) {
    const angle = (Math.PI * 2 * i) / segments + (weapon.angle || 0);
    const x = state.player.x + Math.cos(angle) * radius;
    const y = state.player.y + Math.sin(angle) * radius;

    state.projectiles.push({
      id: `proj-${Date.now()}-${i}`,
      x,
      y,
      vx: Math.cos(angle) * 4,
      vy: Math.sin(angle) * 4,
      emoji: weapon.emoji,
      damage: weapon.damage * weapon.level,
      bounces: 0,
      maxBounces: 0,
    });
  }
}

function fireMagicCharge(state: GameState, weapon: Weapon) {
  if (state.enemies.length === 0 && !state.boss) return;

  let target = state.boss || state.enemies[0];
  let minDist = Infinity;

  state.enemies.forEach(enemy => {
    const dist = Math.hypot(enemy.x - state.player.x, enemy.y - state.player.y);
    if (dist < minDist) {
      minDist = dist;
      target = enemy;
    }
  });

  const dx = target.x - state.player.x;
  const dy = target.y - state.player.y;
  const dist = Math.sqrt(dx * dx + dy * dy);

  state.projectiles.push({
    id: `proj-${Date.now()}`,
    x: state.player.x,
    y: state.player.y,
    vx: (dx / dist) * 5,
    vy: (dy / dist) * 5,
    emoji: weapon.emoji,
    damage: weapon.damage * weapon.level,
    bounces: 0,
    maxBounces: weapon.level >= 5 ? 10 : 0,
  });
}

function fireRadioWave(state: GameState, weapon: Weapon) {
  const waves = weapon.level >= 4 ? 2 : 1;

  for (let w = 0; w < waves; w++) {
    const segments = 12;
    const baseRadius = 50 + w * 30;

    for (let i = 0; i < segments; i++) {
      const angle = (Math.PI * 2 * i) / segments;
      const x = state.player.x + Math.cos(angle) * baseRadius;
      const y = state.player.y + Math.sin(angle) * baseRadius;

      state.projectiles.push({
        id: `proj-${Date.now()}-${w}-${i}`,
        x,
        y,
        vx: Math.cos(angle) * 4,
        vy: Math.sin(angle) * 4,
        emoji: weapon.emoji,
        damage: weapon.damage * weapon.level,
        bounces: 0,
        maxBounces: 0,
      });
    }
  }
}

function fireBirdAttack(state: GameState, weapon: Weapon) {
  weapon.orbitalAngle = (weapon.orbitalAngle || 0) + 0.15;
}

function updateProjectiles(state: GameState, deltaTime: number) {
  state.projectiles = state.projectiles.filter(proj => {
    proj.x += proj.vx;
    proj.y += proj.vy;

    if (proj.x < 0 || proj.x > MAP_WIDTH * TILE_SIZE || proj.y < 0 || proj.y > MAP_HEIGHT * TILE_SIZE) {
      return false;
    }

    return true;
  });
}

function updateParticles(state: GameState, deltaTime: number) {
  state.particles = state.particles.filter(particle => {
    particle.x += particle.vx;
    particle.y += particle.vy;
    particle.life -= deltaTime * 1000;
    return particle.life > 0;
  });
}

function updateLoot(state: GameState, deltaTime: number) {
  state.loot = state.loot.filter(loot => {
    const dx = state.player.x - loot.x;
    const dy = state.player.y - loot.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < 30) {
      if (loot.type === 'coin') state.coins += loot.value;
      if (loot.type === 'xp') state.player.xp += loot.value;
      if (loot.type === 'health') state.player.hp = Math.min(state.player.hp + loot.value, state.player.maxHp);
      return false;
    }

    if (dist < 100) {
      loot.x += (dx / dist) * 2;
      loot.y += (dy / dist) * 2;
    }

    return true;
  });
}

function checkCollisions(state: GameState) {
  state.projectiles = state.projectiles.filter(proj => {
    let hit = false;

    state.enemies = state.enemies.filter(enemy => {
      const dist = Math.hypot(proj.x - enemy.x, proj.y - enemy.y);
      if (dist < 25) {
        enemy.hp -= proj.damage;
        state.damage += proj.damage;
        hit = true;

        if (enemy.hp <= 0) {
          state.kills++;
          dropLoot(state, enemy.x, enemy.y);
          createParticles(state, enemy.x, enemy.y, enemy.emoji);
          return false;
        }

        if (proj.bounces < proj.maxBounces) {
          proj.bounces++;
          return true;
        }
      }
      return true;
    });

    if (state.boss && !hit) {
      const dist = Math.hypot(proj.x - state.boss.x, proj.y - state.boss.y);
      if (dist < 40) {
        state.boss.hp -= proj.damage;
        state.damage += proj.damage;
        hit = true;

        if (state.boss.hp <= 0) {
          state.kills++;
          dropLoot(state, state.boss.x, state.boss.y, true);
          createParticles(state, state.boss.x, state.boss.y, state.boss.emoji);
          state.boss = null;
        }
      }
    }

    return !hit || proj.bounces < proj.maxBounces;
  });

  state.enemies.forEach(enemy => {
    const dist = Math.hypot(enemy.x - state.player.x, enemy.y - state.player.y);
    if (dist < 30) {
      state.player.hp -= 0.5;
    }
  });

  if (state.boss) {
    const dist = Math.hypot(state.boss.x - state.player.x, state.boss.y - state.player.y);
    if (dist < 40) {
      state.player.hp -= 1;
    }
  }
}

function dropLoot(state: GameState, x: number, y: number, isBoss: boolean = false) {
  const types: Array<'coin' | 'xp' | 'health'> = ['coin', 'coin', 'xp', 'xp', 'xp'];
  if (isBoss) types.push('health', 'coin', 'coin');

  const type = types[Math.floor(Math.random() * types.length)];
  const emojis = { coin: '💰', xp: '⭐', health: '❤️' };

  state.loot.push({
    id: `loot-${Date.now()}`,
    x,
    y,
    type,
    emoji: emojis[type],
    value: type === 'coin' ? 10 : type === 'xp' ? 20 : 30,
  });
}

function createParticles(state: GameState, x: number, y: number, emoji: string) {
  for (let i = 0; i < 5; i++) {
    const angle = (Math.PI * 2 * i) / 5;
    state.particles.push({
      id: `particle-${Date.now()}-${i}`,
      x,
      y,
      vx: Math.cos(angle) * 3,
      vy: Math.sin(angle) * 3,
      emoji,
      life: 500,
      maxLife: 500,
      size: 20,
    });
  }
}

function generateUpgrades(state: GameState): Upgrade[] {
  const possible: Upgrade[] = [
    { id: 'dmg', emoji: '🔥', name: '+15% Damage', description: 'Increase all damage', type: 'stat', stat: 'damage', value: 0.15 },
    { id: 'hp', emoji: '❤️', name: '+30 HP', description: 'Increase max health', type: 'stat', stat: 'hp', value: 30 },
    { id: 'spd', emoji: '⚡', name: '+10% Speed', description: 'Move faster', type: 'stat', stat: 'speed', value: 0.1 },
  ];

  state.weapons.forEach(weapon => {
    if (weapon.level < 5) {
      possible.push({
        id: `upgrade-${weapon.id}`,
        emoji: weapon.emoji,
        name: `Upgrade ${weapon.name}`,
        description: `Level ${weapon.level} → ${weapon.level + 1}`,
        type: 'weapon',
        weaponId: weapon.id,
      });
    }
  });

  if (state.weapons.length < 5) {
    const newWeapons = ['fireRing', 'magicCharge', 'radioWave', 'birdAttack'];
    newWeapons.forEach(w => {
      if (!state.weapons.find(weapon => weapon.id === w)) {
        const data = getWeaponData(w);
        possible.push({
          id: `new-${w}`,
          emoji: data.emoji,
          name: `New: ${data.name}`,
          description: 'Unlock this weapon',
          type: 'new_weapon',
          weaponId: w,
        });
      }
    });
  }

  const shuffled = possible.sort(() => Math.random() - 0.5);
  return shuffled.slice(0, 3);
}

function renderGame(ctx: CanvasRenderingContext2D, state: GameState, shake: number) {
  ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  const offsetX = CANVAS_WIDTH / 2 - state.player.x;
  const offsetY = CANVAS_HEIGHT / 2 - state.player.y;

  ctx.save();
  ctx.translate(offsetX, offsetY);

  const startX = Math.max(0, Math.floor(-offsetX / TILE_SIZE) - 2);
  const startY = Math.max(0, Math.floor(-offsetY / TILE_SIZE) - 2);
  const endX = Math.min(MAP_WIDTH, startX + Math.ceil(CANVAS_WIDTH / TILE_SIZE) + 4);
  const endY = Math.min(MAP_HEIGHT, startY + Math.ceil(CANVAS_HEIGHT / TILE_SIZE) + 4);

  ctx.font = `${TILE_SIZE}px Arial`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  for (let y = startY; y < endY; y++) {
    for (let x = startX; x < endX; x++) {
      const tile = state.map[y][x];
      ctx.fillText(tile.emoji, x * TILE_SIZE + TILE_SIZE / 2, y * TILE_SIZE + TILE_SIZE / 2);
    }
  }

  state.loot.forEach(loot => {
    ctx.font = '32px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(loot.emoji, loot.x, loot.y);
  });

  ctx.font = '48px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(state.player.hero, state.player.x, state.player.y);

  ctx.strokeStyle = 'red';
  ctx.lineWidth = 3;
  const hpWidth = 50;
  const hpHeight = 5;
  const hpPercent = state.player.hp / state.player.maxHp;
  ctx.fillStyle = 'red';
  ctx.fillRect(state.player.x - hpWidth / 2, state.player.y - 35, hpWidth * hpPercent, hpHeight);
  ctx.strokeRect(state.player.x - hpWidth / 2, state.player.y - 35, hpWidth, hpHeight);

  state.enemies.forEach(enemy => {
    ctx.font = '36px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(enemy.emoji, enemy.x, enemy.y);

    const hpPercent = enemy.hp / enemy.maxHp;
    ctx.fillStyle = 'red';
    ctx.fillRect(enemy.x - 20, enemy.y - 25, 40 * hpPercent, 3);
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 1;
    ctx.strokeRect(enemy.x - 20, enemy.y - 25, 40, 3);
  });

  if (state.boss) {
    ctx.font = '64px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(state.boss.emoji, state.boss.x, state.boss.y);

    const hpPercent = state.boss.hp / state.boss.maxHp;
    ctx.fillStyle = 'red';
    ctx.fillRect(state.boss.x - 40, state.boss.y - 45, 80 * hpPercent, 5);
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 2;
    ctx.strokeRect(state.boss.x - 40, state.boss.y - 45, 80, 5);
  }

  state.projectiles.forEach(proj => {
    ctx.font = '24px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(proj.emoji, proj.x, proj.y);
  });

  state.weapons.forEach(weapon => {
    if (weapon.id === 'birdAttack') {
      const birdCount = Math.min(weapon.level, 5);
      const orbitRadius = 80 + weapon.level * 10;
      const angle = weapon.orbitalAngle || 0;

      for (let i = 0; i < birdCount; i++) {
        const birdAngle = angle + (Math.PI * 2 * i) / birdCount;
        const birdX = state.player.x + Math.cos(birdAngle) * orbitRadius;
        const birdY = state.player.y + Math.sin(birdAngle) * orbitRadius;

        ctx.font = '28px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🐦', birdX, birdY);

        let targetEnemy = null;
        let minDist = 150 + weapon.level * 30;

        for (const enemy of state.weapons.length > 0 ? state.enemies : []) {
          const dist = Math.hypot(enemy.x - birdX, enemy.y - birdY);
          if (dist < minDist) {
            minDist = dist;
            targetEnemy = enemy;
          }
        }

        if (targetEnemy) {
          const dx = targetEnemy.x - state.player.x;
          const dy = targetEnemy.y - state.player.y;
          const dist = Math.hypot(dx, dy);

          state.projectiles.push({
            id: `bird-proj-${Date.now()}-${i}`,
            x: birdX,
            y: birdY,
            vx: (dx / dist) * 8,
            vy: (dy / dist) * 8,
            emoji: '🐦',
            damage: weapon.damage * weapon.level,
            bounces: 0,
            maxBounces: 3,
          });
        }
      }
    }
  });

  state.particles.forEach(particle => {
    const alpha = particle.life / particle.maxLife;
    ctx.globalAlpha = alpha;
    ctx.font = `${particle.size}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(particle.emoji, particle.x, particle.y);
  });

  ctx.globalAlpha = 1;
  ctx.restore();
}
