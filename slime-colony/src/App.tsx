import React from 'react';
import { useGameStore } from './store/gameStore';
import TitleScreen from './components/TitleScreen';
import GameScreen from './components/GameScreen';

export default function App() {
  const phase = useGameStore((s) => s.phase);

  return phase === 'title' ? <TitleScreen /> : <GameScreen />;
}
