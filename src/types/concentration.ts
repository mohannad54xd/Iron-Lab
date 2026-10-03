export type MaterialType = 'ore' | 'impurity';
export type SeparationMethodId = 'surface-tension' | 'magnetic' | 'electric';
export type CollectionTarget = 'concentrate' | 'impurities';
export type ParticlePhase = 'mixture' | 'attached' | CollectionTarget;

export type Particle = {
  id: string;
  x: number;
  y: number;
  size: number;
  rotation: number;
  materialType: MaterialType;
  mass: number | null;
  responseByMethod: Record<SeparationMethodId, boolean>;
  phase: ParticlePhase;
};

export type SeparationMethod = {
  id: SeparationMethodId;
  name: string;
  equipmentName: string;
  separationRule: string;
  modelCaptureMaterial: MaterialType;
  collectionTarget: CollectionTarget;
  captureRadius: number;
  motion: 'attract' | 'plate' | 'skim';
};

export type SeparatorToolProps = {
  x: number;
  y: number;
  attachedCount: number;
  dragging: boolean;
  onPointerDown: import('react').PointerEventHandler<HTMLDivElement>;
  onPointerMove: import('react').PointerEventHandler<HTMLDivElement>;
  onPointerUp: import('react').PointerEventHandler<HTMLDivElement>;
  onPointerCancel: import('react').PointerEventHandler<HTMLDivElement>;
};

export type ConcentrationState = {
  mixture: Particle[];
  selectedMethod: SeparationMethod | null;
  separationStarted: boolean;
  separatedParticles: string[];
  concentrateParticles: string[];
  impurityParticles: string[];
  separationComplete: boolean;
  observationAnswered: boolean;
  completed: boolean;
  selectedAnswer: string | null;
};
