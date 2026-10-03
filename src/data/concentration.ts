import type { SeparationMethod } from '../types/concentration';

export const concentrationLab = {
  stage: 'Concentration',
  sourceReference: 'Iron extraction PDF excerpt supplied in the project brief',
  problem: 'Separate the useful ore from the impurities.',
  question: 'What happened during concentration?',
  correctAnswer: 'B',
  explanation: 'Concentration is a physical separation process used to remove impurities physically.',
  sourceRelationships: [
    'Mass of impurities decreases.',
    'Percentage of impurities decreases.',
    'Percentage of Fe increases.',
    'Mass of Fe remains approximately constant.',
    'Mass of iron ore decreases.',
  ],
  modelNote: 'Particle-specific responses are an educational abstraction; the source lists these methods but does not identify which ore responds to each one.',
};

export const separationMethods: SeparationMethod[] = [
  {
    id: 'surface-tension',
    name: 'Surface tension separation',
    equipmentName: 'Surface skimmer',
    separationRule: 'surface-responsive particles travel with the skimmer in this demonstration model.',
    modelCaptureMaterial: 'impurity',
    collectionTarget: 'impurities',
    captureRadius: 96,
    motion: 'skim',
  },
  {
    id: 'magnetic',
    name: 'Magnetic separation',
    equipmentName: 'Magnetic separator',
    separationRule: 'magnet-responsive particles attach to the moving separator in this demonstration model.',
    modelCaptureMaterial: 'ore',
    collectionTarget: 'concentrate',
    captureRadius: 104,
    motion: 'attract',
  },
  {
    id: 'electric',
    name: 'Electric separation',
    equipmentName: 'Electrostatic separator',
    separationRule: 'plate-responsive particles move with the separator in this demonstration model.',
    modelCaptureMaterial: 'impurity',
    collectionTarget: 'impurities',
    captureRadius: 82,
    motion: 'plate',
  },
];
