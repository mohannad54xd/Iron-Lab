export type FineOreParticleState = {
  id: string;
  x: number;
  y: number;
  size: number;
  rotation: number;
  placed: boolean;
};

export type AgglomerateState = {
  id: string;
  x: number;
  y: number;
  size: number;
  rotation: number;
};

export type SinteringState = {
  particlesPlaced: number;
  sinteringStarted: boolean;
  sinteringProgress: number;
  agglomerates: AgglomerateState[];
  transformationComplete: boolean;
  completed: boolean;
};
