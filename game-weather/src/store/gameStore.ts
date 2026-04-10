import { create } from 'zustand';

export type Weather = 'sunny' | 'cloudy' | 'rainy' | 'stormy' | 'snowy';

export const WEATHER_INFO: Record<Weather, { emoji: string; name: string }> = {
  sunny:  { emoji: '☀️', name: 'Sunny' },
  cloudy: { emoji: '☁️', name: 'Cloudy' },
  rainy:  { emoji: '🌧️', name: 'Rainy' },
  stormy: { emoji: '⛈️', name: 'Stormy' },
  snowy:  { emoji: '❄️', name: 'Snowy' },
};

export interface Puzzle {
  clues: string[];
  answer: Weather;
  fact: string;
}

export const PUZZLES: Puzzle[] = [
  {
    clues: [
      'The pressure dropped sharply overnight.',
      'Dark cumulonimbus clouds are forming to the west.',
      'You can see distant flashes of light.',
    ],
    answer: 'stormy',
    fact: 'Cumulonimbus clouds can grow up to 12 km tall and produce thunderstorms.',
  },
  {
    clues: [
      'Temperature is below freezing.',
      'The clouds are heavy and low.',
      'Air is humid but not raining.',
    ],
    answer: 'snowy',
    fact: 'Snow forms when water vapor in clouds freezes directly into ice crystals (deposition).',
  },
  {
    clues: [
      'Clear night sky with many stars visible.',
      'Dew formed on the grass at dawn.',
      'High pressure system is dominant.',
    ],
    answer: 'sunny',
    fact: 'High pressure systems bring clear, stable weather because air sinks and warms.',
  },
  {
    clues: [
      'Gray stratus clouds cover the sky.',
      'Humidity is rising and pressure is falling.',
      'Temperature is mild.',
    ],
    answer: 'rainy',
    fact: 'Stratus clouds often produce light, steady rain called drizzle.',
  },
  {
    clues: [
      'Scattered white clouds in the sky.',
      'No precipitation in the forecast.',
      'Wind is light and temperature is moderate.',
    ],
    answer: 'cloudy',
    fact: 'Cumulus clouds are the puffy white ones and usually indicate fair weather.',
  },
  {
    clues: [
      'Strong winds and a pressure crash.',
      'Hail has already fallen nearby.',
      'Temperature rose then suddenly dropped.',
    ],
    answer: 'stormy',
    fact: 'A rapid temperature drop often signals an approaching cold front and storms.',
  },
  {
    clues: [
      'The air smells fresh and wet.',
      'Birds are flying lower than usual.',
      'Barometric pressure is low.',
    ],
    answer: 'rainy',
    fact: 'Before rain, insects fly lower, so birds follow them, a classic weather sign.',
  },
  {
    clues: [
      'Temperature is just below 0°C.',
      'Sky is overcast with thick nimbostratus.',
      'Air feels cold and still.',
    ],
    answer: 'snowy',
    fact: 'Snowflakes have six arms because of the hexagonal structure of ice crystals.',
  },
  {
    clues: [
      'The sun is strong and shadows are sharp.',
      'Pressure is high and humidity is low.',
      'No clouds are visible.',
    ],
    answer: 'sunny',
    fact: 'The Sun produces 386 billion billion megawatts of energy every second.',
  },
  {
    clues: [
      'A thin veil of cirrus clouds covers the sky.',
      'Pressure is slowly falling.',
      'No precipitation yet, but a change is coming.',
    ],
    answer: 'cloudy',
    fact: 'Cirrus clouds are made of ice crystals high in the atmosphere (6+ km up).',
  },
];

interface GameState {
  current: number;
  score: number;
  lives: number;
  message: string;
  lastFact: string;
  guess: (w: Weather) => void;
  reset: () => void;
  next: () => void;
  answered: boolean;
  correct: boolean | null;
}

export const useGameStore = create<GameState>((set, get) => ({
  current: 0,
  score: 0,
  lives: 3,
  message: '',
  lastFact: '',
  answered: false,
  correct: null,
  guess: (w) => {
    const s = get();
    if (s.answered) return;
    const puzzle = PUZZLES[s.current];
    const correct = w === puzzle.answer;
    set({
      answered: true,
      correct,
      score: s.score + (correct ? 10 : 0),
      lives: s.lives - (correct ? 0 : 1),
      message: correct ? 'Correct forecast!' : `Wrong. It was ${WEATHER_INFO[puzzle.answer].name}.`,
      lastFact: puzzle.fact,
    });
  },
  next: () => {
    const s = get();
    if (s.lives <= 0 || s.current + 1 >= PUZZLES.length) {
      set({ message: `Game complete! Final score: ${s.score}` });
      return;
    }
    set({ current: s.current + 1, answered: false, correct: null, message: '', lastFact: '' });
  },
  reset: () =>
    set({
      current: 0,
      score: 0,
      lives: 3,
      answered: false,
      correct: null,
      message: '',
      lastFact: '',
    }),
}));
