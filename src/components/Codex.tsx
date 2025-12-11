import { useState } from 'react';
import { ChevronLeft } from 'lucide-react';

interface CodexProps {
  onBack: () => void;
  language: string;
}

const enemies = [
  { emoji: '🐀', name: 'Rat', hp: '20-40', damage: '10-15', speed: 'Fast' },
  { emoji: '🧟', name: 'Zombie', hp: '30-60', damage: '15-20', speed: 'Slow' },
  { emoji: '🦇', name: 'Bat', hp: '15-30', damage: '8-12', speed: 'Very Fast' },
  { emoji: '🐉', name: 'Dragon', hp: '50-100', damage: '20-30', speed: 'Medium' },
  { emoji: '🤖', name: 'Robot', hp: '40-80', damage: '18-25', speed: 'Fast' },
  { emoji: '👾', name: 'Alien', hp: '35-70', damage: '16-22', speed: 'Medium' },
];

const upgrades = [
  { emoji: '🔥', name: '+15% Damage', description: 'Increase all weapon damage by 15%', effect: 'Multiplicative' },
  { emoji: '❤️', name: '+30 HP', description: 'Increase maximum health by 30', effect: 'Additive' },
  { emoji: '⚡', name: '+10% Speed', description: 'Increase movement speed by 10%', effect: 'Multiplicative' },
];

const weapons = [
  { emoji: '🌀', name: 'Auto Bullet', damage: '10', cooldown: '1s', description: 'Shoots at nearest enemy' },
  { emoji: '🔥', name: 'Fire Ring', damage: '8', cooldown: '5s→3s', description: 'Creates fire circle from 2→8 projectiles' },
  { emoji: '🌟', name: 'Magic Charge', damage: '25', cooldown: '2s', description: 'Powerful single target blast' },
  { emoji: '📡', name: 'Radio Wave', damage: '15', cooldown: '3s', description: 'Expanding wave of energy' },
  { emoji: '🐦', name: 'Birds', damage: '12', cooldown: '1.5s', description: 'Orbital birds that attack nearby enemies' },
];

const loot = [
  { emoji: '💰', name: 'Coin', value: '1-10', effect: 'Earn currency' },
  { emoji: '❤️', name: 'Health Pack', value: '+30 HP', effect: 'Restore health' },
  { emoji: '✨', name: 'XP Orb', value: '+50 XP', effect: 'Gain experience' },
  { emoji: '💎', name: 'Gem', value: '+5 All Stats', effect: 'Powerful buff' },
];

export function Codex({ onBack, language }: CodexProps) {
  const [tab, setTab] = useState<'enemies' | 'weapons' | 'upgrades' | 'loot'>('enemies');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      <button
        onClick={onBack}
        className="mb-6 flex items-center gap-2 text-white hover:text-yellow-400 transition-colors"
      >
        <ChevronLeft size={20} />
        Back
      </button>

      <h1 className="text-4xl font-bold bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent mb-8">
        Codex
      </h1>

      <div className="flex gap-4 mb-8 flex-wrap">
        {(['enemies', 'weapons', 'upgrades', 'loot'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-6 py-3 rounded-lg font-bold transition-all ${
              tab === t
                ? 'bg-yellow-400 text-black shadow-lg scale-105'
                : 'bg-purple-700 text-white hover:bg-purple-600'
            }`}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tab === 'enemies' &&
          enemies.map((enemy) => (
            <div key={enemy.emoji} className="bg-slate-800/50 border-2 border-purple-500 rounded-xl p-6 hover:border-yellow-400 transition-colors backdrop-blur-sm">
              <div className="text-5xl mb-3">{enemy.emoji}</div>
              <h3 className="text-xl font-bold text-white mb-2">{enemy.name}</h3>
              <div className="text-sm text-gray-300 space-y-1">
                <p>HP: {enemy.hp}</p>
                <p>Damage: {enemy.damage}</p>
                <p>Speed: {enemy.speed}</p>
              </div>
            </div>
          ))}

        {tab === 'weapons' &&
          weapons.map((weapon) => (
            <div key={weapon.emoji} className="bg-slate-800/50 border-2 border-blue-500 rounded-xl p-6 hover:border-yellow-400 transition-colors backdrop-blur-sm">
              <div className="text-5xl mb-3">{weapon.emoji}</div>
              <h3 className="text-xl font-bold text-white mb-2">{weapon.name}</h3>
              <div className="text-sm text-gray-300 space-y-1">
                <p>Base Damage: {weapon.damage}</p>
                <p>Cooldown: {weapon.cooldown}</p>
                <p className="text-yellow-300 mt-2">{weapon.description}</p>
              </div>
            </div>
          ))}

        {tab === 'upgrades' &&
          upgrades.map((upgrade) => (
            <div key={upgrade.emoji} className="bg-slate-800/50 border-2 border-green-500 rounded-xl p-6 hover:border-yellow-400 transition-colors backdrop-blur-sm">
              <div className="text-5xl mb-3">{upgrade.emoji}</div>
              <h3 className="text-xl font-bold text-white mb-2">{upgrade.name}</h3>
              <div className="text-sm text-gray-300 space-y-1">
                <p className="text-gray-400">{upgrade.description}</p>
                <p className="text-blue-300 mt-2">Type: {upgrade.effect}</p>
              </div>
            </div>
          ))}

        {tab === 'loot' &&
          loot.map((item) => (
            <div key={item.emoji} className="bg-slate-800/50 border-2 border-indigo-500 rounded-xl p-6 hover:border-yellow-400 transition-colors backdrop-blur-sm">
              <div className="text-5xl mb-3">{item.emoji}</div>
              <h3 className="text-xl font-bold text-white mb-2">{item.name}</h3>
              <div className="text-sm text-gray-300 space-y-1">
                <p>Value: {item.value}</p>
                <p className="text-yellow-300 mt-2">{item.effect}</p>
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}
