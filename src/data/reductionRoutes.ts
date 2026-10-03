export type ReductionRouteId = 'blast-furnace' | 'midrex';

export type ReductionReactionStep = {
  id: string;
  title: string;
  reactants: string;
  products: string;
  equation: string;
  condition: string;
  explanation: string;
  observation: string;
};

export type ReductionRoute = {
  id: ReductionRouteId;
  fact: string;
  heading: string;
  reducingAgent: string;
  description: string;
  steps: ReductionReactionStep[];
};

export const reductionRoutes: ReductionRoute[] = [
  {
    id: 'blast-furnace',
    fact: 'Reduction route selected: blast-furnace.',
    heading: 'Blast Furnace',
    reducingAgent: 'Coke / carbon',
    description: 'Coke provides the carbon-based reducing environment and the route proceeds through CO formation before iron is produced.',
    steps: [
      {
        id: 'coke-combustion',
        title: 'Coke combustion',
        reactants: 'C + O₂',
        products: 'CO₂',
        equation: 'C + O₂  —Δ→  CO₂',
        condition: 'Δ · O₂',
        explanation: 'Carbon burns in oxygen to give carbon dioxide.',
        observation: 'CO₂ forms in the furnace.',
      },
      {
        id: 'carbon-monoxide-generation',
        title: 'Carbon monoxide generation',
        reactants: 'CO₂ + C',
        products: '2CO',
        equation: 'CO₂ + C  —Δ→  2CO',
        condition: 'Δ',
        explanation: 'Carbon dioxide reacts with more carbon to produce carbon monoxide, the reducing gas of this route.',
        observation: 'CO is formed from CO₂ and C.',
      },
      {
        id: 'hematite-reduction',
        title: 'Iron formation',
        reactants: 'Fe₂O₃ + 3CO',
        products: '2Fe + 3CO₂',
        equation: 'Fe₂O₃ + 3CO  —Δ→  2Fe + 3CO₂',
        condition: 'Δ · CO',
        explanation: 'Carbon monoxide reduces hematite to iron and carbon dioxide.',
        observation: 'Fe forms as CO is converted to CO₂.',
      },
    ],
  },
  {
    id: 'midrex',
    fact: 'Reduction route selected: midrex.',
    heading: 'Tube / MIDREX',
    reducingAgent: 'CH₄ / natural gas',
    description: 'Natural gas is converted to a reducing gas and the oxide is reduced in the tube route.',
    steps: [
      {
        id: 'midrex-reforming',
        title: 'Reducing-gas formation',
        reactants: '2CH₄ + CO₂',
        products: '3CO + 2H₂',
        equation: '2CH₄ + CO₂  —Δ→  3CO + 2H₂',
        condition: 'Δ',
        explanation: 'The natural-gas reforming step produces a reducing gas mixture of CO and H₂.',
        observation: 'CO and H₂ form the reducing gas.',
      },
      {
        id: 'midrex-hematite-reduction',
        title: 'Gas-based direct reduction',
        reactants: 'Fe₂O₃ + 3CO + 3H₂',
        products: '2Fe + 3CO₂ + 3H₂O',
        equation: 'Fe₂O₃ + 3CO + 3H₂  →  2Fe + 3CO₂ + 3H₂O',
        condition: 'CO + H₂ reducing gas',
        explanation: 'The CO/H₂ reducing gas removes oxygen from hematite and produces iron.',
        observation: 'Fe forms with CO₂ and H₂O as products.',
      },
    ],
  },
];