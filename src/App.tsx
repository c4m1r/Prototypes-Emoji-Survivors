import { useState, useEffect } from 'react';
import { MainMenu } from './components/MainMenu';
import { GameEngine } from './components/GameEngine';

function App() {
  const [gameState, setGameState] = useState<'menu' | 'playing'>('menu');
  const [selectedMode, setSelectedMode] = useState('survival');
  const [selectedHero, setSelectedHero] = useState('🙂');
  const [gameSeed, setGameSeed] = useState<string | undefined>();
  const [language, setLanguage] = useState('ru');
  const [profile, setProfile] = useState<any>(() => {
    const saved = localStorage.getItem('emojiSurvivorsProfile');
    return saved ? JSON.parse(saved) : null;
  });

  useEffect(() => {
    if (profile) {
      localStorage.setItem('emojiSurvivorsProfile', JSON.stringify(profile));
    }
  }, [profile]);

  const handleStartGame = (mode: string, hero: string, seed?: string) => {
    setSelectedMode(mode);
    setSelectedHero(hero);
    setGameSeed(seed);
    setGameState('playing');
  };

  const handleGameEnd = (stats: any) => {
    if (profile) {
      const newProfile = {
        ...profile,
        totalCoins: profile.totalCoins + stats.coins,
        totalDamageDealt: profile.totalDamageDealt + stats.damage,
        maxSurvivalTime: Math.max(profile.maxSurvivalTime, Math.floor(stats.time)),
        totalDeaths: profile.totalDeaths + 1,
      };

      if (!newProfile.unlockedHeroes) {
        newProfile.unlockedHeroes = ['🙂'];
      }

      if (Math.floor(stats.time) >= 60 && !newProfile.unlockedHeroes.includes('💀')) {
        newProfile.unlockedHeroes.push('💀');
      }

      if (stats.damage >= 50000 && !newProfile.unlockedHeroes.includes('👹')) {
        newProfile.unlockedHeroes.push('👹');
      }

      if (newProfile.totalDeaths >= 3 && !newProfile.unlockedHeroes.includes('👻')) {
        newProfile.unlockedHeroes.push('👻');
      }

      if (stats.defeatedBoss && !newProfile.unlockedHeroes.includes('🤖')) {
        newProfile.unlockedHeroes.push('🤖');
      }

      setProfile(newProfile);
    }

    setGameState('menu');
  };

  const handleProfileUpdate = (newProfile: any) => {
    setProfile(newProfile);
  };

  const handleLanguageChange = (lang: string) => {
    setLanguage(lang);
    if (profile) {
      setProfile({ ...profile, language: lang });
    }
  };

  if (gameState === 'playing') {
    return (
      <GameEngine
        heroEmoji={selectedHero}
        gameMode={selectedMode}
        seed={gameSeed}
        onGameEnd={handleGameEnd}
        language={language}
      />
    );
  }

  return (
    <MainMenu
      onStartGame={handleStartGame}
      profile={profile}
      onProfileUpdate={handleProfileUpdate}
      language={language}
      onLanguageChange={handleLanguageChange}
    />
  );
}

export default App;
