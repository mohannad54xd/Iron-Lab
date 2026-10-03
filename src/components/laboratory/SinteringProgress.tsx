type SinteringProgressProps = {
  particlesPlaced: number;
  particleTotal: number;
  sinteringStarted: boolean;
  transformationComplete: boolean;
  completed: boolean;
};

export function SinteringProgress({ particlesPlaced, particleTotal, sinteringStarted, transformationComplete, completed }: SinteringProgressProps) {
  const steps = [
    { label: `${particlesPlaced} / ${particleTotal} fine particles in tray`, done: particlesPlaced === particleTotal, active: particlesPlaced < particleTotal },
    { label: completed || transformationComplete ? 'Sintering complete.' : sinteringStarted ? 'Sintering in progress.' : 'Start sintering.', done: transformationComplete, active: particlesPlaced === particleTotal && !transformationComplete },
  ];

  return (
    <div className="mt-6 space-y-4 text-sm text-slate-700">
      {steps.map((step, index) => (
        <div key={step.label} className={`experiment-step${step.active ? ' is-active' : ''}${step.done ? ' is-complete' : ''}`} aria-current={step.active ? 'step' : undefined}>
          <div className="text-[10px] uppercase tracking-[0.2em] text-slate-500">Step {index + 1}{step.done ? '  ✓' : ''}</div>
          <div className="mt-2 font-medium text-ink">{step.label}</div>
        </div>
      ))}
    </div>
  );
}
