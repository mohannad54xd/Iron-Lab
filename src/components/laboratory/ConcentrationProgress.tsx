type ConcentrationProgressProps = {
  methodSelected: boolean;
  separationStarted: boolean;
  separatedCount: number;
  totalCount: number;
  complete: boolean;
};

export function ConcentrationProgress({ methodSelected, separationStarted, separatedCount, totalCount, complete }: ConcentrationProgressProps) {
  const steps = [
    { label: 'Inspect the mixed sample.', done: methodSelected, active: !methodSelected },
    { label: methodSelected ? (separationStarted ? 'Operate the selected separator.' : 'Move the separator through the sample.') : 'Choose a separation method.', done: separationStarted, active: methodSelected && !separationStarted },
    { label: complete ? 'Both fractions collected.' : `${separatedCount} / ${totalCount} particles collected.`, done: complete, active: separationStarted && !complete },
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
