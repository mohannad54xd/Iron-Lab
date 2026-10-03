export type Particle = {
  id: string;
  x: number;
  y: number;
  size: number;
  mass: number;
  rotation?: number;
  flightX?: number;
  flightY?: number;
  collected?: boolean;
};

export type DragKind = 'ore' | 'crusher' | 'particle';
