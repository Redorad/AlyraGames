import { create } from 'zustand';

export type Illness = 'flu' | 'burn' | 'broken' | 'cold' | 'virus';

export const ILLNESS_INFO: Record<Illness, { emoji: string; name: string; treatTime: number; reward: number }> = {
  cold: { emoji: '🤧', name: 'Cold', treatTime: 3, reward: 8 },
  flu: { emoji: '🤒', name: 'Flu', treatTime: 5, reward: 15 },
  burn: { emoji: '🔥', name: 'Burn', treatTime: 7, reward: 25 },
  broken: { emoji: '🦴', name: 'Fracture', treatTime: 10, reward: 40 },
  virus: { emoji: '🦠', name: 'Virus', treatTime: 12, reward: 60 },
};

export interface Patient {
  id: number;
  illness: Illness;
  patience: number; // 0-100, 0 = leaves
  inTreatment: boolean;
  treatProgress: number; // 0-100
  assignedDoctor?: number;
}

export interface Doctor {
  id: number;
  name: string;
  level: number;
  busy: boolean;
}

interface GameState {
  cash: number;
  reputation: number;
  patients: Patient[];
  doctors: Doctor[];
  spawnTimer: number;
  nextId: number;
  log: string[];
  equipmentLevel: number;
  treated: number;
  assignPatient: (patientId: number) => void;
  hireDoctor: () => void;
  upgradeEquipment: () => void;
  reset: () => void;
  tick: (delta: number) => void;
}

const ILLNESSES: Illness[] = ['cold', 'flu', 'burn', 'broken', 'virus'];
const DOCTOR_NAMES = ['Dr. Lee', 'Dr. Patel', 'Dr. Kim', 'Dr. Smith', 'Dr. Park', 'Dr. Tan', 'Dr. Yu', 'Dr. Ito'];

export const useGameStore = create<GameState>((set, get) => ({
  cash: 100,
  reputation: 50,
  patients: [],
  doctors: [{ id: 1, name: 'Dr. Lee', level: 1, busy: false }],
  spawnTimer: 2,
  nextId: 2,
  log: ['Hospital opened! Treat patients to earn cash.'],
  equipmentLevel: 1,
  treated: 0,
  assignPatient: (patientId) => {
    const s = get();
    const free = s.doctors.find((d) => !d.busy);
    if (!free) return;
    const patient = s.patients.find((p) => p.id === patientId);
    if (!patient || patient.inTreatment) return;
    set({
      patients: s.patients.map((p) =>
        p.id === patientId
          ? { ...p, inTreatment: true, assignedDoctor: free.id }
          : p
      ),
      doctors: s.doctors.map((d) => (d.id === free.id ? { ...d, busy: true } : d)),
    });
  },
  hireDoctor: () => {
    const s = get();
    const cost = 150 + s.doctors.length * 200;
    if (s.cash < cost) return;
    const name = DOCTOR_NAMES[s.doctors.length % DOCTOR_NAMES.length];
    set({
      cash: s.cash - cost,
      doctors: [...s.doctors, { id: s.nextId, name, level: 1, busy: false }],
      nextId: s.nextId + 1,
      log: [`Hired ${name}!`, ...s.log].slice(0, 5),
    });
  },
  upgradeEquipment: () => {
    const s = get();
    const cost = 500 * Math.pow(3, s.equipmentLevel - 1);
    if (s.cash < cost) return;
    set({
      cash: s.cash - cost,
      equipmentLevel: s.equipmentLevel + 1,
      log: [`Equipment upgraded to Lvl ${s.equipmentLevel + 1}`, ...s.log].slice(0, 5),
    });
  },
  reset: () =>
    set({
      cash: 100,
      reputation: 50,
      patients: [],
      doctors: [{ id: 1, name: 'Dr. Lee', level: 1, busy: false }],
      spawnTimer: 2,
      nextId: 2,
      log: ['Hospital opened!'],
      equipmentLevel: 1,
      treated: 0,
    }),
  tick: (delta) => {
    const s = get();
    let cash = s.cash;
    let reputation = s.reputation;
    let treated = s.treated;
    let log = s.log;
    let spawnTimer = s.spawnTimer - delta;
    let nextId = s.nextId;
    let patients = [...s.patients];
    let doctors = [...s.doctors];

    // Spawn
    if (spawnTimer <= 0 && patients.length < 8) {
      const illness = ILLNESSES[Math.floor(Math.random() * Math.min(ILLNESSES.length, 2 + Math.floor(s.treated / 5)))];
      patients.push({
        id: nextId++,
        illness,
        patience: 100,
        inTreatment: false,
        treatProgress: 0,
      });
      spawnTimer = Math.max(1.5, 4 - reputation / 50);
    }

    // Update patients
    const nextPatients: Patient[] = [];
    for (const p of patients) {
      if (p.inTreatment) {
        const info = ILLNESS_INFO[p.illness];
        const rate = (100 / info.treatTime) * s.equipmentLevel;
        const progress = p.treatProgress + rate * delta;
        if (progress >= 100) {
          cash += info.reward;
          reputation = Math.min(100, reputation + 2);
          treated += 1;
          log = [`Cured ${info.name}! +$${info.reward}`, ...log].slice(0, 5);
          doctors = doctors.map((d) => (d.id === p.assignedDoctor ? { ...d, busy: false } : d));
          continue;
        }
        nextPatients.push({ ...p, treatProgress: progress });
      } else {
        const patience = p.patience - delta * 4;
        if (patience <= 0) {
          reputation = Math.max(0, reputation - 5);
          log = [`Patient left angry! -5 rep`, ...log].slice(0, 5);
          continue;
        }
        nextPatients.push({ ...p, patience });
      }
    }

    set({
      cash,
      reputation,
      patients: nextPatients,
      doctors,
      spawnTimer,
      nextId,
      log,
      treated,
    });
  },
}));
