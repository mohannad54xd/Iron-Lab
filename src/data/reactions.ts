export type ReactionCategory = 'preparation' | 'oxidation' | 'reduction' | 'acid' | 'nonmetal' | 'furnace' | 'midrex';

export type ReactionNode = {
  id: string;
  label: string;
  x: number;
  y: number;
  color: string;
  textColor?: string;
  backgroundImage?: string;
  annotation?: string;
  kind?: 'ore' | 'compound' | 'metal';
  initialVisible?: boolean;
};

export type SourceReaction = {
  id: string;
  equation?: string;
  heating?: boolean;
  arrowText?: string;
  arrowTextColor?: string;
  arrowColor?: string;
  labelOffsetY?: number;
  curveSide?: 'left' | 'right';
  buttonText?: string;
  quickConnect?: boolean;
  straight?: boolean;
  rightAngle?: boolean;
  parallel?: boolean;
  branchSide?: 'left' | 'right';
  sourceAnchor?: number;
  category: ReactionCategory;
  categoryLabel: string;
  condition: string;
  observation?: string;
  from: string;
  to: string;
};

export const reactionNodes: ReactionNode[] = [
  { id: 'siderite', label: 'Siderite\nFeCO₃', x: 90, y: 100, color: '#adb5b8', textColor: '#303a38', kind: 'ore', initialVisible: true },
  { id: 'FeC2O4', label: 'Iron(II) oxalate\nFeC₂O₄', x: 430, y: 100, color: '#adb5b8', textColor: '#303a38', kind: 'ore', initialVisible: true },
  { id: 'limonite', label: 'Limonite\nFe₂O₃·3H₂O', x: 90, y: 285, color: '#8f999d', textColor: '#ffe066', kind: 'ore', initialVisible: true },
  { id: 'magnetite', label: 'Magnetite\nFe₃O₄', x: 90, y: 470, color: '#49627f', textColor: '#111111', backgroundImage: 'linear-gradient(180deg, #315f9e 0 50%, #47864c 50% 100%)', kind: 'ore', initialVisible: true },
  { id: 'FeO', label: 'Iron(II) oxide\nFeO', x: 500, y: 420, color: '#315f9e', textColor: '#111111', initialVisible: true },
  { id: 'FeCl2Water', label: 'FeCl₂\n+ H₂O', x: 900, y: 180, color: '#91b8c9', annotation: 'Iron(II) chloride', initialVisible: true },
  { id: 'FeSO4Water', label: 'FeSO₄\n+ H₂O', x: 900, y: 550, color: '#91b8c9', annotation: 'Iron(II) sulfate', initialVisible: true },
  { id: 'FeCl3Water', label: '2FeCl₃\n+ 3H₂O', x: 1600, y: 650, color: '#47864c', annotation: 'Iron(III) chloride', initialVisible: true },
  { id: 'Fe2SO43Water', label: 'Fe₂(SO₄)₃\n+ 3H₂O', x: 1600, y: 260, color: '#47864c', annotation: 'Iron(III) sulfate', initialVisible: true },
  { id: 'Fe2O3', label: 'Hematite\nFe₂O₃', x: 1200, y: 420, color: '#47864c', textColor: '#d7443e', annotation: 'Iron(III) oxide', initialVisible: true },
  { id: 'twoFeSO4', label: '2FeSO₄', x: 1500, y: 100, color: '#adb5b8', textColor: '#303a38', annotation: 'Iron(II) sulfate', initialVisible: true },
  { id: 'FeOH3', label: 'Fe(OH)₃', x: 800, y: 50, color: '#adb5b8', textColor: '#303a38', annotation: 'Iron(III) hydroxide', initialVisible: true },
  { id: 'Fe', label: 'Iron\nFe', x: 850, y: 660, color: '#d69745', kind: 'metal', initialVisible: true },
  { id: 'iron-chloride-product', label: '2FeCl₃', x: 100, y: 1150, color: '#d69745', textColor: '#2d2922', annotation: 'Iron(III) chloride', initialVisible: true },
  { id: 'iron-sulfide-product', label: 'FeS', x: 100, y: 1290, color: '#d69745', textColor: '#2d2922', annotation: 'Iron(II) sulfide', initialVisible: true },
  { id: 'iron-hcl-product', label: 'H₂ + FeCl₂', x: 100, y: 1680, color: '#d69745', textColor: '#2d2922', annotation: 'Iron(II) chloride', initialVisible: true },
  { id: 'iron-sulfuric-product', label: 'H₂ + FeSO₄', x: 100, y: 1820, color: '#d69745', textColor: '#2d2922', annotation: 'Iron(II) sulfate', initialVisible: true },
  { id: 'iron-concentrated-sulfuric-product', label: '4SO₂ + 8H₂O\n+ Fe₂(SO₄)₃ + FeSO₄', x: 100, y: 1960, color: '#d69745', textColor: '#2d2922', backgroundImage: 'linear-gradient(180deg, #315f9e 0 50%, #47864c 50% 100%)', annotation: 'Iron(III) + iron(II) sulfates', initialVisible: true },
  { id: 'iron-passivity-product', label: 'No reaction\ndue to passivity', x: 1700, y: 1430, color: '#d69745', textColor: '#2d2922', initialVisible: true },
  { id: 'magnetite-hcl-product', label: 'FeCl₂ + 2FeCl₃\n+ 4H₂O', x: 500, y: 580, color: '#91b8c9', backgroundImage: 'linear-gradient(180deg, #315f9e 0 50%, #47864c 50% 100%)', annotation: 'Iron(II) + iron(III) chloride', initialVisible: true },
  { id: 'magnetite-sulfuric-product', label: 'FeSO₄ + Fe₂(SO₄)₃\n+ 4H₂O', x: 500, y: 740, color: '#91b8c9', backgroundImage: 'linear-gradient(180deg, #315f9e 0 50%, #47864c 50% 100%)', annotation: 'Iron(II) + iron(III) sulfate', initialVisible: true },
];

export const reactionRegistry: SourceReaction[] = [
  { id: 'siderite-to-feo', equation: 'FeCO₃ → FeO + CO₂', heating: true, arrowText: 'CO₂', quickConnect: true, category: 'preparation', categoryLabel: 'Siderite decomposition', condition: 'Δ · Absence of air', observation: 'CO₂ is produced in the absence of air.', from: 'siderite', to: 'FeO' },
  { id: 'oxalate-to-feo', equation: 'FeC₂O₄ → FeO + CO + CO₂', arrowText: 'CO + CO₂', quickConnect: true, category: 'preparation', categoryLabel: 'Iron(II) oxalate decomposition', condition: 'Absence of air', observation: 'CO and CO₂ are produced in the absence of air.', from: 'FeC2O4', to: 'FeO' },
  { id: 'feo-oxidation-to-hematite', equation: '2FeO + ½O₂ → Fe₂O₃', heating: true, arrowText: '½O₂', buttonText: 'Oxidize with ½O₂ + heat', labelOffsetY: 70, straight: true, category: 'oxidation', categoryLabel: 'FeO oxidation to hematite', condition: '', observation: 'Heating FeO in oxygen forms Fe₂O₃.', from: 'FeO', to: 'Fe2O3' },
  { id: 'feo-dilute-hcl', equation: 'FeO + 2HCl → FeCl₂ + H₂O', arrowText: 'Dilute HCl', category: 'acid', categoryLabel: 'Dilute HCl', condition: 'Dilute HCl', observation: 'FeCl₂ and H₂O are formed with dilute HCl.', from: 'FeO', to: 'FeCl2Water' },
  { id: 'feo-concentrated-hcl', equation: 'FeO + 2HCl → FeCl₂ + H₂O', arrowText: 'Concentrated HCl', category: 'acid', categoryLabel: 'Concentrated HCl', condition: 'Concentrated HCl', observation: 'FeCl₂ and H₂O are formed with concentrated HCl.', from: 'FeO', to: 'FeCl2Water' },
  { id: 'feo-dilute-sulfuric', equation: 'FeO + H₂SO₄ → FeSO₄ + H₂O', arrowText: 'Dilute H₂SO₄', category: 'acid', categoryLabel: 'Dilute H₂SO₄', condition: 'Dilute H₂SO₄', observation: 'FeSO₄ and H₂O are formed with dilute H₂SO₄.', from: 'FeO', to: 'FeSO4Water' },
  { id: 'feo-concentrated-sulfuric', equation: 'FeO + H₂SO₄ → FeSO₄ + H₂O', arrowText: 'Concentrated H₂SO₄', category: 'acid', categoryLabel: 'Concentrated H₂SO₄', condition: 'Concentrated H₂SO₄', observation: 'FeSO₄ and H₂O are formed with concentrated H₂SO₄.', from: 'FeO', to: 'FeSO4Water' },
  { id: 'ferrous-sulfate-to-hematite', arrowText: 'K₂Cr₂O₇', arrowTextColor: '#315b91', arrowColor: '#315b91', quickConnect: true, category: 'oxidation', categoryLabel: 'Ferrous sulfate to hematite', condition: 'SO₂ + SO₃', from: 'twoFeSO4', to: 'Fe2O3' },
  { id: 'iron-hydroxide-to-hematite', heating: true, arrowText: 'H₂O', quickConnect: true, category: 'preparation', categoryLabel: 'Iron(III) hydroxide to hematite', condition: '>200°C', from: 'FeOH3', to: 'Fe2O3' },
  { id: 'limonite-to-hematite', heating: true, quickConnect: true, category: 'preparation', categoryLabel: 'Limonite to hematite', condition: 'Δ · air/O₂', from: 'limonite', to: 'Fe2O3' },
  { id: 'hematite-concentrated-hcl', equation: 'Fe₂O₃ + 6HCl → 2FeCl₃ + 3H₂O', arrowText: 'Conc. 6HCl', buttonText: 'Concentrated HCl', labelOffsetY: -50, category: 'acid', categoryLabel: 'Concentrated HCl', condition: 'Conc. 6HCl', observation: 'FeCl₃ and H₂O are formed with concentrated HCl.', from: 'Fe2O3', to: 'FeCl3Water' },
  { id: 'hematite-concentrated-sulfuric', equation: 'Fe₂O₃ + 3H₂SO₄ → Fe₂(SO₄)₃ + 3H₂O', arrowText: 'Conc. 3H₂SO₄', buttonText: 'Concentrated H₂SO₄', labelOffsetY: 50, curveSide: 'right', category: 'acid', categoryLabel: 'Concentrated H₂SO₄', condition: 'Conc. 3H₂SO₄', observation: 'Fe₂(SO₄)₃ and H₂O are formed with concentrated H₂SO₄.', from: 'Fe2O3', to: 'Fe2SO43Water' },
  { id: 'hematite-reduction-blast-furnace', equation: 'Fe₂O₃ + 3CO → 2Fe + 3CO₂', heating: true, arrowText: '700°C', buttonText: 'Blast furnace · 700°C', straight: true, category: 'reduction', categoryLabel: 'Blast-furnace reduction', condition: 'Blast furnace', from: 'Fe2O3', to: 'Fe' },
  { id: 'hematite-reduction-midx', equation: 'Fe₂O₃ + 3CO + 3H₂ → 2Fe + 3CO₂ + 3H₂O', heating: true, arrowText: '700°C', buttonText: 'MIDREX · 700°C', straight: true, category: 'reduction', categoryLabel: 'MIDREX reduction', condition: 'MIDREX', from: 'Fe2O3', to: 'Fe' },
  { id: 'hematite-hydrogen-reduction', equation: 'Fe₂O₃ + H₂ → 2FeO + H₂O', heating: true, arrowText: 'H₂ → H₂O', buttonText: 'H₂ reduction · 400–700°C', curveSide: 'right', parallel: true, category: 'reduction', categoryLabel: 'Hydrogen reduction to FeO', condition: '400–700°C', observation: 'Hydrogen reduces hematite to iron(II) oxide, forming water.', from: 'Fe2O3', to: 'FeO' },
  { id: 'hematite-co-reduction-to-magnetite', equation: '3Fe₂O₃ + CO → 2Fe₃O₄ + CO₂', heating: true, arrowText: 'CO', buttonText: 'CO reduction · 230–300°C', curveSide: 'right', category: 'reduction', categoryLabel: 'CO reduction to magnetite', condition: '230–300°C', observation: 'CO reduces hematite to magnetite and forms CO₂.', from: 'Fe2O3', to: 'magnetite' },
  { id: 'ferric-chloride-naoh', arrowText: 'NaCl', buttonText: 'NaOH', straight: true, category: 'preparation', categoryLabel: 'Sodium hydroxide', condition: '', from: 'FeCl3Water', to: 'FeOH3' },
  { id: 'ferric-chloride-koh', arrowText: 'KCl', buttonText: 'KOH', straight: true, category: 'preparation', categoryLabel: 'Potassium hydroxide', condition: '', from: 'FeCl3Water', to: 'FeOH3' },
  { id: 'ferric-chloride-nh4oh', arrowText: 'NH₄Cl', buttonText: 'NH₄OH', straight: true, category: 'preparation', categoryLabel: 'Ammonium hydroxide', condition: '', from: 'FeCl3Water', to: 'FeOH3' },
  { id: 'iron-chlorine', arrowText: 'Cl₂ gas', buttonText: 'Cl₂ gas → 2FeCl₃', branchSide: 'left', sourceAnchor: 0.12, category: 'nonmetal', categoryLabel: 'Iron with chlorine', condition: '', from: 'Fe', to: 'iron-chloride-product' },
  { id: 'iron-sulfur', arrowText: 'S', buttonText: 'S → FeS', branchSide: 'left', sourceAnchor: 0.30, category: 'nonmetal', categoryLabel: 'Iron with sulfur', condition: '', from: 'Fe', to: 'iron-sulfide-product' },
  { id: 'iron-dilute-hcl', arrowText: 'Dilute 2HCl', buttonText: 'Dilute 2HCl → H₂ + FeCl₂', branchSide: 'left', sourceAnchor: 0.48, category: 'acid', categoryLabel: 'Iron with dilute HCl', condition: '', from: 'Fe', to: 'iron-hcl-product' },
  { id: 'iron-dilute-sulfuric', arrowText: 'Dilute H₂SO₄', buttonText: 'Dilute H₂SO₄ → H₂ + FeSO₄', branchSide: 'left', sourceAnchor: 0.66, category: 'acid', categoryLabel: 'Iron with dilute H₂SO₄', condition: '', from: 'Fe', to: 'iron-sulfuric-product' },
  { id: 'iron-concentrated-sulfuric', arrowText: 'Conc. 8H₂SO₄', buttonText: 'Conc. 8H₂SO₄ → 4SO₂ + 8H₂O + Fe₂(SO₄)₃ + FeSO₄', branchSide: 'left', sourceAnchor: 0.84, category: 'acid', categoryLabel: 'Iron with concentrated H₂SO₄', condition: '', from: 'Fe', to: 'iron-concentrated-sulfuric-product' },
  { id: 'iron-concentrated-nitric', arrowText: 'Conc. HNO₃', buttonText: 'Conc. HNO₃ → No reaction due to passivity', branchSide: 'right', sourceAnchor: 0.90, category: 'acid', categoryLabel: 'Iron with concentrated HNO₃', condition: '', from: 'Fe', to: 'iron-passivity-product' },
  { id: 'iron-oxidation-to-magnetite', equation: '3Fe + 2O₂ → Fe₃O₄', heating: true, arrowText: 'O₂', buttonText: 'Heat with O₂', straight: true, parallel: true, category: 'oxidation', categoryLabel: 'Iron oxidation to magnetite', condition: '', observation: 'Heating iron in oxygen forms magnetite.', from: 'Fe', to: 'magnetite' },
  { id: 'iron-steam-to-magnetite', equation: '3Fe + 4H₂O(g) → Fe₃O₄ + 4H₂', heating: true, arrowText: 'H₂O(g)', buttonText: 'Heat with H₂O', rightAngle: true, parallel: true, category: 'oxidation', categoryLabel: 'Iron oxidation with steam', condition: '', observation: 'Heating iron with steam forms magnetite and hydrogen.', from: 'Fe', to: 'magnetite' },
  { id: 'magnetite-concentrated-hcl', equation: 'Fe₃O₄ + 8HCl → FeCl₂ + 2FeCl₃ + 4H₂O', arrowText: 'Conc. 8HCl', buttonText: 'Conc. 8HCl', category: 'acid', categoryLabel: 'Magnetite with concentrated HCl', condition: 'Conc. 8HCl', observation: 'FeCl₂, FeCl₃, and H₂O are formed when magnetite reacts with concentrated HCl.', from: 'magnetite', to: 'magnetite-hcl-product' },
  { id: 'magnetite-concentrated-sulfuric', equation: 'Fe₃O₄ + 4H₂SO₄ → FeSO₄ + Fe₂(SO₄)₃ + 4H₂O', arrowText: 'Conc. 4H₂SO₄', buttonText: 'Conc. 4H₂SO₄', category: 'acid', categoryLabel: 'Magnetite with concentrated H₂SO₄', condition: 'Conc. 4H₂SO₄', observation: 'FeSO₄, Fe₂(SO₄)₃, and H₂O are formed when magnetite reacts with concentrated H₂SO₄.', from: 'magnetite', to: 'magnetite-sulfuric-product' },
  { id: 'magnetite-oxidation-to-hematite', equation: '2Fe₃O₄ + ½O₂ → 3Fe₂O₃', heating: true, arrowText: '½O₂', buttonText: 'Oxidize with ½O₂', curveSide: 'right', category: 'oxidation', categoryLabel: 'Magnetite oxidation to hematite', condition: '', observation: 'Heating magnetite in oxygen forms hematite.', from: 'magnetite', to: 'Fe2O3' },
  { id: 'magnetite-hydrogen-reduction', equation: 'Fe₃O₄ + H₂ → 3FeO + H₂O', heating: true, arrowText: 'H₂ → H₂O', buttonText: 'H₂ reduction · 400–700°C', straight: true, category: 'reduction', categoryLabel: 'Magnetite hydrogen reduction to FeO', condition: '400–700°C', observation: 'Hydrogen reduces magnetite to iron(II) oxide, forming water.', from: 'magnetite', to: 'FeO' },
];

export const reactionCategoryColors: Record<ReactionCategory, string> = {
  preparation: '#315b91',
  oxidation: '#b33e45',
  reduction: '#3d8c60',
  acid: '#315b91',
  nonmetal: '#987041',
  furnace: '#263e66',
  midrex: '#6a7e48',
};
