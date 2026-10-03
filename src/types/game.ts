export type SceneId =
  | 'landing'
  | 'mission'
  | 'ores'
  | 'crushing'
  | 'sintering'
  | 'concentration'
  | 'roasting'
  | 'reduction'
  | 'iron'
  | 'map'
  | 'lab'
  | 'challenge'
  | 'complete';

export type Measurement = {
  label: string;
  before: number;
  after: number;
  unit: string;
};

export type JournalEntry = {
  id: string;
  experiment: string;
  observation: string;
  measurement: string;
  result: string;
};
