import { useState } from 'react';
import { translations } from '../data/translations';
import { heroes } from '../data/heroes';
import { ChevronLeft, ChevronRight, Download, Upload, History, Play, Book } from 'lucide-react';
import { Codex } from './Codex';

interface MainMenuProps {
  onStartGame: (mode: string, hero: string, seed?: string) => void;
  profile: any;
  onProfileUpdate: (profile: any) => void;
  language: string;
  onLanguageChange: (lang: string) => void;
}

export function MainMenu({ onStartGame, profile, onProfileUpdate, language, onLanguageChange }: MainMenuProps) {
  const [view, setView] = useState<'main' | 'profile' | 'modes' | 'history' | 'codex'>('main');
  const [playerName, setPlayerName] = useState(profile?.playerName || '');
  const [selectedHeroIndex, setSelectedHeroIndex] = useState(() => {
    const index = heroes.findIndex(h => h.emoji === profile?.selectedHero);
    return index >= 0 ? index : 0;
  });
  const [customSeed, setCustomSeed] = useState('');

  const t = translations[language as keyof typeof translations];
  const selectedHero = heroes[selectedHeroIndex] || heroes[0];

  const isHeroUnlocked = (hero: typeof heroes[0]) => {
    if (hero.unlockCondition === 'default') return true;
    return profile?.unlockedHeroes?.includes(hero.emoji) || false;
  };

  const canBuyHero = (hero: typeof heroes[0]) => {
    if (hero.unlockCondition === 'coins500') return profile?.totalCoins >= 500;
    if (hero.unlockCondition === 'coins1000') return profile?.totalCoins >= 1000;
    if (hero.unlockCondition === 'coins3000') return profile?.totalCoins >= 3000;
    if (hero.unlockCondition === 'coins7000') return profile?.totalCoins >= 7000;
    return false;
  };

  const getCost = (hero: typeof heroes[0]) => {
    if (hero.unlockCondition === 'coins500') return 500;
    if (hero.unlockCondition === 'coins1000') return 1000;
    if (hero.unlockCondition === 'coins3000') return 3000;
    if (hero.unlockCondition === 'coins7000') return 7000;
    return 0;
  };

  const unlockHero = (hero: typeof heroes[0]) => {
    const cost = getCost(hero);
    if (profile && profile.totalCoins >= cost) {
      const newProfile = {
        ...profile,
        totalCoins: profile.totalCoins - cost,
        unlockedHeroes: [...(profile.unlockedHeroes || []), hero.emoji],
      };
      onProfileUpdate(newProfile);
    }
  };

  const selectHero = (index: number) => {
    setSelectedHeroIndex(index);
    if (profile) {
      const newProfile = { ...profile, selectedHero: heroes[index].emoji };
      onProfileUpdate(newProfile);
    }
  };

  const handleStart = () => {
    if (!playerName.trim()) {
      alert('Please enter your name!');
      return;
    }
    if (!profile?.id) {
      const newProfile = {
        id: crypto.randomUUID(),
        playerName: playerName.trim(),
        language,
        totalCoins: 0,
        totalDeaths: 0,
        totalDamageDealt: 0,
        maxSurvivalTime: 0,
        bossDefeated: false,
        maxUpgradesInRun: 0,
        unlockedHeroes: ['🙂'],
        selectedHero: selectedHero.emoji,
      };
      onProfileUpdate(newProfile);
    }
    setView('modes');
  };

  const exportSave = () => {
    const saveData = JSON.stringify(profile);
    const blob = new Blob([saveData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `emoji-survivors-${profile.playerName}.json`;
    a.click();
  };

  const importSave = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const data = JSON.parse(e.target?.result as string);
            onProfileUpdate(data);
            if (data.language) onLanguageChange(data.language);
          } catch (err) {
            alert('Invalid save file!');
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  if (view === 'profile') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-8">
        <div className="bg-black/60 backdrop-blur-lg rounded-3xl p-12 max-w-4xl w-full shadow-2xl border-4 border-yellow-400">
          <h1 className="text-5xl font-bold text-yellow-400 mb-8 text-center">{profile.playerName}</h1>

          <div className="bg-black/40 rounded-2xl p-8 mb-8">
            <div className="flex items-center justify-center mb-6">
              <button
                onClick={() => selectHero((selectedHeroIndex - 1 + heroes.length) % heroes.length)}
                className="text-white hover:text-yellow-400 transition-colors"
              >
                <ChevronLeft size={48} />
              </button>
              <div className="mx-12 text-center">
                <div className="text-9xl mb-4">{selectedHero.emoji}</div>
                <div className="text-2xl text-white font-bold">{selectedHero[`name${language === 'ru' ? 'Ru' : language === 'en' ? 'En' : language === 'es' ? 'Es' : 'Zh'}` as keyof typeof selectedHero]}</div>
                <div className="text-yellow-400 mt-2">{selectedHero[`passive${language === 'ru' ? 'Ru' : language === 'en' ? 'En' : language === 'es' ? 'Es' : 'Zh'}` as keyof typeof selectedHero]}</div>
              </div>
              <button
                onClick={() => selectHero((selectedHeroIndex + 1) % heroes.length)}
                className="text-white hover:text-yellow-400 transition-colors"
              >
                <ChevronRight size={48} />
              </button>
            </div>

            {!isHeroUnlocked(selectedHero) && (
              <div className="text-center">
                {canBuyHero(selectedHero) ? (
                  <button
                    onClick={() => unlockHero(selectedHero)}
                    className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-bold transition-colors"
                  >
                    {t.menu.buyHero} {getCost(selectedHero)} 💰
                  </button>
                ) : (
                  <div className="text-red-400 font-bold">
                    {t.menu.locked}: {t.unlock[selectedHero.unlockCondition as keyof typeof t.unlock]}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4 text-white text-xl mb-8">
            <div className="bg-black/40 p-4 rounded-xl">💰 {t.stats.coins}: {profile.totalCoins}</div>
            <div className="bg-black/40 p-4 rounded-xl">⏱ {t.stats.time}: {profile.maxSurvivalTime}s</div>
            <div className="bg-black/40 p-4 rounded-xl">👾 {t.stats.kills}: {profile.kills || 0}</div>
            <div className="bg-black/40 p-4 rounded-xl">💀 Deaths: {profile.totalDeaths}</div>
          </div>

          <div className="flex gap-4 mb-4">
            <button
              onClick={exportSave}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-bold transition-colors flex items-center justify-center gap-2"
            >
              <Download size={20} /> {t.menu.exportCharacter}
            </button>
            <button
              onClick={importSave}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-bold transition-colors flex items-center justify-center gap-2"
            >
              <Upload size={20} /> {t.menu.importCharacter}
            </button>
            <button
              onClick={() => setView('codex')}
              className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg font-bold transition-colors flex items-center justify-center gap-2"
            >
              <Book size={20} /> Codex
            </button>
          </div>

          <button
            onClick={() => setView('main')}
            className="w-full bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg font-bold transition-colors"
          >
            Back
          </button>
        </div>
      </div>
    );
  }

  if (view === 'codex') {
    return <Codex onBack={() => setView('profile')} language={language} />;
  }

  if (view === 'modes') {
    const modes = [
      { id: 'survival', emoji: '🕐', name: t.modes.survival, desc: t.modes.survivalDesc },
      { id: 'maze', emoji: '🧩', name: t.modes.maze, desc: t.modes.mazeDesc },
      { id: 'arena', emoji: '⚔️', name: t.modes.arena, desc: t.modes.arenaDesc },
      { id: 'collection', emoji: '🎁', name: t.modes.collection, desc: t.modes.collectionDesc },
    ];

    return (
      <div className="min-h-screen bg-gradient-to-br from-green-900 via-teal-900 to-cyan-900 flex items-center justify-center p-8">
        <div className="bg-black/60 backdrop-blur-lg rounded-3xl p-12 max-w-6xl w-full shadow-2xl border-4 border-cyan-400">
          <h1 className="text-5xl font-bold text-cyan-400 mb-8 text-center">Select Mode</h1>

          <div className="grid grid-cols-2 gap-6 mb-8">
            {modes.map(mode => (
              <button
                key={mode.id}
                onClick={() => onStartGame(mode.id, selectedHero.emoji)}
                className="bg-gradient-to-br from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 p-8 rounded-2xl transition-all duration-300 hover:scale-105 border-4 border-cyan-200"
              >
                <div className="text-6xl mb-4">{mode.emoji}</div>
                <div className="text-2xl font-bold text-white mb-2">{mode.name}</div>
                <div className="text-cyan-100">{mode.desc}</div>
              </button>
            ))}
          </div>

          <div className="bg-black/40 p-6 rounded-2xl mb-6">
            <label className="text-white text-xl mb-2 block">{t.modes.seed}</label>
            <div className="flex gap-4">
              <input
                type="text"
                value={customSeed}
                onChange={(e) => setCustomSeed(e.target.value)}
                placeholder="Enter seed code..."
                className="flex-1 bg-black/60 text-white px-4 py-3 rounded-lg border-2 border-cyan-400"
              />
              <button
                onClick={() => onStartGame('survival', selectedHero.emoji, customSeed)}
                className="bg-yellow-600 hover:bg-yellow-700 text-white px-6 py-3 rounded-lg font-bold transition-colors"
              >
                <Play size={24} />
              </button>
            </div>
          </div>

          <button
            onClick={() => setView('main')}
            className="w-full bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg font-bold transition-colors"
          >
            Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-900 via-red-900 to-pink-900 flex items-center justify-center p-8">
      <div className="bg-black/60 backdrop-blur-lg rounded-3xl p-12 max-w-2xl w-full shadow-2xl border-4 border-orange-400">
        <h1 className="text-6xl font-bold text-orange-400 mb-8 text-center drop-shadow-lg">
          🌟 Emoji Survivors
        </h1>

        <div className="mb-8">
          <label className="block text-white text-2xl mb-4 font-bold">{t.menu.title}</label>
          <input
            type="text"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            className="w-full bg-black/60 text-white text-xl px-6 py-4 rounded-lg border-4 border-orange-400 focus:outline-none focus:border-yellow-400 transition-colors"
            placeholder="Your name..."
          />
        </div>

        <button
          onClick={handleStart}
          className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-400 hover:to-red-400 text-white text-2xl px-8 py-4 rounded-lg font-bold mb-6 transition-all duration-300 hover:scale-105 shadow-lg"
        >
          {t.menu.start}
        </button>

        {profile?.id && (
          <button
            onClick={() => setView('profile')}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white text-xl px-6 py-3 rounded-lg font-bold mb-6 transition-all duration-300 hover:scale-105"
          >
            {profile.playerName} - {t.menu.profile}
          </button>
        )}

        <div className="flex gap-4 mb-6">
          <button
            onClick={importSave}
            className="flex-1 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-bold transition-colors"
          >
            {t.menu.importCharacter}
          </button>
        </div>

        <div className="flex gap-2 justify-center">
          {['ru', 'en', 'es', 'zh'].map(lang => (
            <button
              key={lang}
              onClick={() => onLanguageChange(lang)}
              className={`px-6 py-2 rounded-lg font-bold transition-colors ${
                language === lang
                  ? 'bg-yellow-500 text-black'
                  : 'bg-gray-700 text-white hover:bg-gray-600'
              }`}
            >
              {lang.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="particle-cloud">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="particle"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 5}s`,
                fontSize: `${20 + Math.random() * 30}px`,
              }}
            >
              {['✨', '💫', '⭐', '🌟'][Math.floor(Math.random() * 4)]}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
