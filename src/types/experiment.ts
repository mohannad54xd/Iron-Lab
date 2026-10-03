export type ExperimentStage = {
  id: string;
  label: string;
  status: 'locked' | 'active' | 'complete';
};

export type ExperimentObservation = {
  id: string;
  title: string;
  description: string;
  result: string;
};
