export type IronOreId = 'hematite' | 'magnetite' | 'limonite' | 'siderite';
export type RoastingMassTrend = 'increases-then-constant' | 'decreases-then-constant' | 'decreases-minimum-increases-constant' | null;

export type RoastingStep = {
  id: string;
  equation: string;
  condition: string;
  products: string;
  explanation: string;
  gasReleased?: string;
  intermediate?: string;
};

export type IronOre = {
  id: IronOreId;
  name: string;
  formula: string;
  color: string;
  roastingPath: RoastingStep[];
  massTrend: RoastingMassTrend;
  roastingSourceNote?: string;
};

export const ironOres: Record<IronOreId, IronOre> = {
  hematite: {
    id: 'hematite',
    name: 'Hematite',
    formula: 'Fe₂O₃',
    color: '#9e4036',
    roastingPath: [],
    massTrend: null,
    roastingSourceNote: 'The supplied Roshetta lists Hematite (Fe₂O₃) but gives no separate hematite roasting equation or hematite-specific observation.',
  },
  magnetite: {
    id: 'magnetite',
    name: 'Magnetite',
    formula: 'Fe₃O₄',
    color: '#363d40',
    roastingPath: [
      { id: 'magnetite-oxidation', equation: '2Fe₃O₄ + ½O₂ → 3Fe₂O₃', condition: '400–700°C · O₂', products: '3Fe₂O₃', explanation: 'Magnetite is oxidised to hematite in oxygen.' },
    ],
    massTrend: 'increases-then-constant',
  },
  limonite: {
    id: 'limonite',
    name: 'Limonite',
    formula: 'Fe₂O₃·3H₂O',
    color: '#c2a04a',
    roastingPath: [
      { id: 'limonite-dehydration', equation: '2Fe₂O₃·3H₂O → 2Fe₂O₃ + 3H₂O', condition: 'Δ · air/O₂', products: '2Fe₂O₃ + 3H₂O', explanation: 'Heating removes water from limonite and leaves hematite.', gasReleased: 'H₂O' },
    ],
    massTrend: 'decreases-then-constant',
  },
  siderite: {
    id: 'siderite',
    name: 'Siderite',
    formula: 'FeCO₃',
    color: '#87958b',
    roastingPath: [
      { id: 'siderite-decomposition', equation: 'FeCO₃ → FeO + CO₂', condition: 'Δ · absence of air', products: 'FeO + CO₂', explanation: 'Siderite decomposes to iron(II) oxide and carbon dioxide.', gasReleased: 'CO₂', intermediate: 'FeO' },
      { id: 'siderite-oxidation', equation: '2FeO + ½O₂ → Fe₂O₃', condition: '400–700°C · O₂', products: 'Fe₂O₃', explanation: 'The FeO intermediate is oxidised to hematite in oxygen.' },
    ],
    massTrend: 'decreases-minimum-increases-constant',
  },
};

export const roastingCondition = 'Strongly heat the ore in air/O₂.';

export const roastingMassTrendObservations: Record<Exclude<RoastingMassTrend, null>, string> = {
  'increases-then-constant': 'Mass of solid: increases, then constant',
  'decreases-then-constant': 'Mass of solid: decreases, then constant',
  'decreases-minimum-increases-constant': 'Mass of solid: decreases to a minimum, increases, then constant',
};
