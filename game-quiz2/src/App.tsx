import React, { useState } from 'react';

type Q = { q: string; a: string[]; correct: number; cat: string };

const QUESTIONS: Q[] = [
  { q: 'What is the chemical symbol for gold?', a: ['Go', 'Au', 'Gd', 'Ag'], correct: 1, cat: 'Chemistry' },
  { q: 'What planet is known as the Red Planet?', a: ['Venus', 'Jupiter', 'Mars', 'Saturn'], correct: 2, cat: 'Physics' },
  { q: 'How many bones are in the adult human body?', a: ['206', '186', '226', '306'], correct: 0, cat: 'Biology' },
  { q: 'What is the speed of light in vacuum (km/s)?', a: ['150,000', '299,792', '1,000,000', '3,000'], correct: 1, cat: 'Physics' },
  { q: 'What is H2O commonly known as?', a: ['Salt', 'Acid', 'Water', 'Sugar'], correct: 2, cat: 'Chemistry' },
  { q: 'Which part of the cell contains DNA?', a: ['Nucleus', 'Cytoplasm', 'Membrane', 'Ribosome'], correct: 0, cat: 'Biology' },
  { q: 'What force keeps us on the ground?', a: ['Magnetism', 'Gravity', 'Friction', 'Tension'], correct: 1, cat: 'Physics' },
  { q: 'Which gas do plants absorb for photosynthesis?', a: ['Oxygen', 'Nitrogen', 'Hydrogen', 'Carbon dioxide'], correct: 3, cat: 'Biology' },
  { q: 'What is the hardest natural substance?', a: ['Gold', 'Iron', 'Diamond', 'Quartz'], correct: 2, cat: 'Chemistry' },
  { q: 'How many chambers does a human heart have?', a: ['2', '3', '4', '5'], correct: 2, cat: 'Biology' },
  { q: 'What is the atomic number of oxygen?', a: ['6', '7', '8', '16'], correct: 2, cat: 'Chemistry' },
  { q: 'Which scientist formulated the laws of motion?', a: ['Einstein', 'Newton', 'Galileo', 'Tesla'], correct: 1, cat: 'Physics' },
  { q: 'What is the largest organ of the human body?', a: ['Liver', 'Brain', 'Skin', 'Lungs'], correct: 2, cat: 'Biology' },
  { q: 'Which element has the symbol Fe?', a: ['Fluorine', 'Iron', 'Francium', 'Phosphorus'], correct: 1, cat: 'Chemistry' },
  { q: 'What is the SI unit of force?', a: ['Watt', 'Joule', 'Newton', 'Pascal'], correct: 2, cat: 'Physics' },
  { q: 'What do bees produce that humans eat?', a: ['Honey', 'Wax', 'Pollen', 'Nectar'], correct: 0, cat: 'Biology' },
  { q: 'Which acid is found in vinegar?', a: ['Sulfuric', 'Citric', 'Acetic', 'Nitric'], correct: 2, cat: 'Chemistry' },
  { q: 'What is absolute zero in Celsius?', a: ['0°C', '-100°C', '-273.15°C', '-500°C'], correct: 2, cat: 'Physics' },
  { q: 'What do we call animals that eat only plants?', a: ['Carnivores', 'Herbivores', 'Omnivores', 'Scavengers'], correct: 1, cat: 'Biology' },
  { q: 'Which gas makes up most of Earth\'s atmosphere?', a: ['Oxygen', 'Carbon dioxide', 'Nitrogen', 'Argon'], correct: 2, cat: 'Chemistry' },
  { q: 'What does DNA stand for?', a: ['Deoxyribonucleic acid', 'Di-nucleic acid', 'Double Nuclear Acid', 'Dynamic Nucleotide'], correct: 0, cat: 'Biology' },
  { q: 'What is the chemical formula of table salt?', a: ['KCl', 'NaCl', 'CaCl', 'MgCl'], correct: 1, cat: 'Chemistry' },
  { q: 'Which planet is the largest in our solar system?', a: ['Saturn', 'Jupiter', 'Neptune', 'Earth'], correct: 1, cat: 'Physics' },
  { q: 'What is the pH of pure water?', a: ['5', '6', '7', '8'], correct: 2, cat: 'Chemistry' },
  { q: 'What is the name of the galaxy we live in?', a: ['Andromeda', 'Milky Way', 'Triangulum', 'Sombrero'], correct: 1, cat: 'Physics' },
  { q: 'Which blood cells help fight infection?', a: ['Red', 'White', 'Platelets', 'Plasma'], correct: 1, cat: 'Biology' },
  { q: 'What kind of energy does a moving car have?', a: ['Potential', 'Kinetic', 'Thermal', 'Chemical'], correct: 1, cat: 'Physics' },
  { q: 'Which vitamin does sunlight help produce?', a: ['A', 'B', 'C', 'D'], correct: 3, cat: 'Biology' },
  { q: 'Which metal is liquid at room temperature?', a: ['Tin', 'Mercury', 'Lead', 'Zinc'], correct: 1, cat: 'Chemistry' },
  { q: 'What is the unit of electric current?', a: ['Volt', 'Ampere', 'Ohm', 'Watt'], correct: 1, cat: 'Physics' },
];

export default function App() {
  const [order, setOrder] = useState(() => [...QUESTIONS].sort(() => Math.random() - 0.5));
  const [idx, setIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [sel, setSel] = useState<number | null>(null);
  const [done, setDone] = useState(false);

  function answer(i: number) {
    if (sel !== null) return;
    setSel(i);
    if (i === order[idx].correct) setScore(s => s + 1);
    setTimeout(() => {
      if (idx + 1 >= order.length) setDone(true);
      else {
        setIdx(idx + 1);
        setSel(null);
      }
    }, 800);
  }

  function restart() {
    setOrder([...QUESTIONS].sort(() => Math.random() - 0.5));
    setIdx(0);
    setScore(0);
    setSel(null);
    setDone(false);
  }

  if (done) {
    const pct = Math.round((score / order.length) * 100);
    return (
      <div className="w-full h-full flex items-center justify-center p-4">
        <div className="max-w-md text-center flex flex-col gap-4">
          <div className="text-5xl">🔬</div>
          <div className="text-2xl font-bold text-steel">Quiz Complete</div>
          <div className="text-4xl text-accent font-extrabold">{score} / {order.length}</div>
          <div className="text-slate-400">{pct}%</div>
          <div className="text-sm text-slate-500">
            {pct >= 90 ? 'Outstanding scientist!' : pct >= 70 ? 'Great work!' : pct >= 50 ? 'Not bad.' : 'Keep studying.'}
          </div>
          <button onClick={restart} className="py-3 rounded-xl bg-accent text-navy-900 font-bold">Play Again</button>
        </div>
      </div>
    );
  }

  const q = order[idx];

  return (
    <div className="w-full h-full flex items-center justify-center p-4">
      <div className="w-full max-w-xl flex flex-col gap-4">
        <div className="text-center">
          <div className="text-steel font-bold text-xl">Science Quiz</div>
          <div className="text-xs text-slate-500">Question {idx + 1} of {order.length} · Score {score}</div>
        </div>
        <div className="w-full h-1.5 bg-navy-800 rounded-full overflow-hidden">
          <div className="h-full bg-accent" style={{ width: `${((idx + 1) / order.length) * 100}%` }} />
        </div>
        <div className="bg-navy-800/80 border border-white/10 rounded-2xl p-5">
          <div className="text-xs text-accent mb-2">{q.cat}</div>
          <div className="text-lg font-bold text-slate-100">{q.q}</div>
        </div>
        <div className="grid grid-cols-1 gap-2">
          {q.a.map((opt, i) => {
            let cls = 'bg-navy-800 hover:bg-navy-700 border-white/10';
            if (sel !== null) {
              if (i === q.correct) cls = 'bg-green-500/30 border-green-400';
              else if (i === sel) cls = 'bg-red-500/30 border-red-400';
              else cls = 'bg-navy-800 border-white/10 opacity-50';
            }
            return (
              <button
                key={i}
                onClick={() => answer(i)}
                disabled={sel !== null}
                className={`text-left p-3 rounded-xl border-2 transition-all ${cls}`}
              >
                <span className="text-slate-200">{opt}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
