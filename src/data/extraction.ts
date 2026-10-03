export const crushingLab = {
  stage: 'Crushing',
  oreSample: 'Iron ore specimen',
  beforeMass: 250,
  afterMass: 250,
  unit: 'g',
  massMeasurementNote: 'The 250 g reading is a simulation value. The source-supported result is that total mass remains unchanged as particle size decreases.',
  sourceReference: 'Teacher mind map / crushing concept',
  concept: 'Particle size decreases; total mass remains unchanged.',
  question: 'What changed when the ore was crushed?',
  answers: [
    'Mass decreased',
    'Particle size decreased',
    'Both decreased',
  ],
  correctAnswer: 'Particle size decreased',
  conclusion:
    'Crushing changes the physical form of the ore. The sample becomes smaller, but the mass remains effectively the same because no material is removed.',
  todo: 'Exact wording from the source PDF to be confirmed and expanded later.',
};

export const extractionStages = [
  { id: 'crushing', label: 'Crushing', status: 'active' },
  { id: 'sintering', label: 'Sintering', status: 'locked' },
  { id: 'concentration', label: 'Concentration', status: 'locked' },
  { id: 'roasting', label: 'Roasting', status: 'locked' },
  { id: 'reduction', label: 'Reduction', status: 'locked' },
];

export const reductionSequenceObservation = 'The supplied extraction sequence places reduction before iron formation.';
