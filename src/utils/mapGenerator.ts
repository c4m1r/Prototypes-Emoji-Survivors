import { Tile, MapTheme } from '../types/game';

export const themes: MapTheme[] = [
  {
    name: 'fantasy',
    tiles: {
      grass: '🟩',
      dirt: '🟫',
      tree: '🌲',
      rock: '🪨',
      water: '🟦',
      lava: '🟥',
      wall: '🧱',
      fog: '🌫',
    },
    background: 'radial-gradient(circle at center, #8fa 0%, #264 80%)',
  },
  {
    name: 'cyberpunk',
    tiles: {
      grass: '⬛',
      dirt: '⬜',
      tree: '🏙',
      rock: '📡',
      water: '🟪',
      lava: '🟧',
      wall: '🔲',
      fog: '🌫',
    },
    background: 'radial-gradient(circle at center, #f0f 0%, #113 80%)',
  },
  {
    name: 'ice',
    tiles: {
      grass: '❄️',
      dirt: '🟦',
      tree: '🌲',
      rock: '🧊',
      water: '🟦',
      lava: '🟥',
      wall: '🧱',
      fog: '🌫',
    },
    background: 'radial-gradient(circle at center, #aef 0%, #048 80%)',
  },
  {
    name: 'hell',
    tiles: {
      grass: '🟥',
      dirt: '🟫',
      tree: '🔥',
      rock: '💀',
      water: '🟥',
      lava: '🔥',
      wall: '🧱',
      fog: '🌫',
    },
    background: 'radial-gradient(circle at center, #f80 0%, #300 80%)',
  },
  {
    name: 'underwater',
    tiles: {
      grass: '🟦',
      dirt: '🟫',
      tree: '🌿',
      rock: '🪨',
      water: '🌊',
      lava: '🟥',
      wall: '🧱',
      fog: '🌫',
    },
    background: 'radial-gradient(circle at center, #5cf 0%, #037 80%)',
  },
  {
    name: 'space',
    tiles: {
      grass: '⬛',
      dirt: '🌑',
      tree: '🌟',
      rock: '☄️',
      water: '🟪',
      lava: '🟥',
      wall: '🧱',
      fog: '🌫',
    },
    background: 'radial-gradient(circle at center, #438 0%, #012 80%)',
  },
];

export function seededRandom(seed: string, index: number): number {
  let hash = 0;
  const str = seed + index.toString();
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return Math.abs(hash % 10000) / 10000;
}

function generateMazeRecursive(seed: string, width: number, height: number, x: number, y: number, visited: Set<string>, theme: MapTheme): Tile[][] {
  const map: Tile[][] = [];
  for (let i = 0; i < height; i++) {
    const row: Tile[] = [];
    for (let j = 0; j < width; j++) {
      row.push({ emoji: theme.tiles.wall, passable: false });
    }
    map.push(row);
  }

  const stack: [number, number][] = [[x, y]];
  visited.add(`${x},${y}`);
  map[y][x] = { emoji: theme.tiles.grass, passable: true };

  const directions = [[0, -2], [2, 0], [0, 2], [-2, 0]];

  while (stack.length > 0) {
    const current = stack[stack.length - 1];
    const cx = current[0];
    const cy = current[1];

    const shuffled = directions.sort(() => seededRandom(seed, Math.random() * 1000) - 0.5);
    let moved = false;

    for (const [dx, dy] of shuffled) {
      const nx = cx + dx;
      const ny = cy + dy;

      if (nx > 0 && nx < width - 1 && ny > 0 && ny < height - 1 && !visited.has(`${nx},${ny}`)) {
        const wallX = cx + dx / 2;
        const wallY = cy + dy / 2;
        map[wallY][wallX] = { emoji: theme.tiles.grass, passable: true };
        map[ny][nx] = { emoji: theme.tiles.grass, passable: true };
        visited.add(`${nx},${ny}`);
        stack.push([nx, ny]);
        moved = true;
        break;
      }
    }

    if (!moved) {
      stack.pop();
    }
  }

  return map;
}

export function generateMap(seed: string, width: number, height: number, mode: string = 'survival', level: number = 0): { map: Tile[][], theme: MapTheme } {
  const themeIndex = Math.floor(seededRandom(seed, level) * themes.length);
  const theme = themes[themeIndex];

  let map: Tile[][] = [];

  if (mode === 'maze') {
    const visited = new Set<string>();
    map = generateMazeRecursive(seed, width, height, 1, 1, visited, theme);
  } else if (mode === 'arena') {
    map = [];
    for (let y = 0; y < height; y++) {
      const row: Tile[] = [];
      for (let x = 0; x < width; x++) {
        const distFromEdge = Math.min(x, y, width - 1 - x, height - 1 - y);
        let tile: Tile;

        if (distFromEdge < 3) {
          tile = { emoji: theme.tiles.wall, passable: false };
        } else {
          const rand = seededRandom(seed, y * width + x + level);
          if (rand < 0.1) {
            tile = { emoji: theme.tiles.rock, passable: false };
          } else {
            tile = { emoji: theme.tiles.grass, passable: true };
          }
        }
        row.push(tile);
      }
      map.push(row);
    }
  } else {
    for (let y = 0; y < height; y++) {
      const row: Tile[] = [];
      for (let x = 0; x < width; x++) {
        const rand = seededRandom(seed, y * width + x + level);
        const distFromCenter = Math.hypot(x - width / 2, y - height / 2);

        let tile: Tile;

        if (rand < 0.55) {
          tile = { emoji: theme.tiles.grass, passable: true };
        } else if (rand < 0.68) {
          tile = { emoji: theme.tiles.dirt, passable: true };
        } else if (rand < 0.76) {
          tile = { emoji: theme.tiles.tree, passable: false };
        } else if (rand < 0.83) {
          tile = { emoji: theme.tiles.rock, passable: false };
        } else if (rand < 0.88) {
          tile = { emoji: theme.tiles.water, passable: false };
        } else if (rand < 0.90) {
          tile = { emoji: theme.tiles.lava, passable: true, damage: 5 };
        } else if (rand < 0.93) {
          tile = { emoji: theme.tiles.wall, passable: false };
        } else {
          tile = { emoji: theme.tiles.fog, passable: true };
        }

        row.push(tile);
      }
      map.push(row);
    }

    const centerX = Math.floor(width / 2);
    const centerY = Math.floor(height / 2);
    for (let dy = -3; dy <= 3; dy++) {
      for (let dx = -3; dx <= 3; dx++) {
        const x = centerX + dx;
        const y = centerY + dy;
        if (x >= 0 && x < width && y >= 0 && y < height) {
          map[y][x] = { emoji: theme.tiles.grass, passable: true };
        }
      }
    }

    for (let i = 0; i < 3 + level; i++) {
      const structureX = Math.floor(seededRandom(seed, i * 1000) * (width - 20)) + 10;
      const structureY = Math.floor(seededRandom(seed, i * 1000 + 1) * (height - 20)) + 10;
      const structureType = Math.floor(seededRandom(seed, i * 1000 + 2) * 3);

      if (structureType === 0) {
        for (let sx = -5; sx <= 5; sx++) {
          for (let sy = -5; sy <= 5; sy++) {
            const x = structureX + sx;
            const y = structureY + sy;
            if (x > 0 && x < width - 1 && y > 0 && y < height - 1) {
              if (Math.hypot(sx, sy) <= 5) {
                map[y][x] = { emoji: theme.tiles.tree, passable: false };
              }
            }
          }
        }
      } else if (structureType === 1) {
        for (let sx = -4; sx <= 4; sx++) {
          for (let sy = -4; sy <= 4; sy++) {
            const x = structureX + sx;
            const y = structureY + sy;
            if (x > 0 && x < width - 1 && y > 0 && y < height - 1) {
              if (sx === -4 || sx === 4 || sy === -4 || sy === 4) {
                map[y][x] = { emoji: theme.tiles.water, passable: false };
              } else {
                map[y][x] = { emoji: theme.tiles.grass, passable: true };
              }
            }
          }
        }
      } else {
        for (let sx = -3; sx <= 3; sx++) {
          for (let sy = -3; sy <= 3; sy++) {
            const x = structureX + sx;
            const y = structureY + sy;
            if (x > 0 && x < width - 1 && y > 0 && y < height - 1) {
              if (Math.hypot(sx, sy) <= 3) {
                map[y][x] = { emoji: theme.tiles.lava, passable: true, damage: 10 };
              }
            }
          }
        }
      }
    }
  }

  return { map, theme };
}

export function generateSeed(): string {
  return Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
}
