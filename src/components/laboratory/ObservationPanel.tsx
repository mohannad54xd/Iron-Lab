export type ObservationOption = {
  id: string;
  label: string;
};

type ObservationPanelProps = {
  question: string;
  options: ObservationOption[];
  selectedAnswer: string | null;
  onSelect: (answer: string) => void;
  hint: string | null;
  completed: boolean;
  mass: number;
};

export function ObservationPanel({
  question,
  options,
  selectedAnswer,
  onSelect,
  hint,
  completed,
  mass,
}: ObservationPanelProps) {
  return (
    <div className="laboratory-panel p-6">
      <p className="eyebrow">Observation</p>
      <h3 className="mt-3 text-2xl font-semibold text-ink">{question}</h3>

      <div className="mt-6 grid gap-3 md:grid-cols-3">
        {options.map((option) => {
          return (
            <button
              key={option.id}
              type="button"
              onClick={() => onSelect(option.id)}
              disabled={completed}
              aria-pressed={selectedAnswer === option.id}
              className={[
                'rounded-xl border px-4 py-3 text-left text-base font-medium transition',
                selectedAnswer === option.id ? 'border-iron bg-iron/10 text-ink' : 'border-ink/10 bg-white/80 text-slate-700',
                completed ? 'cursor-default' : 'hover:border-iron/50',
              ].join(' ')}
            >
              <span className="mr-2 font-semibold">{option.id} —</span> {option.label}
            </button>
          );
        })}
      </div>

      {hint && !completed && (
        <p className="mt-4 text-sm text-slate-600" role="status">{hint}</p>
      )}

      {completed && (
        <div className="mt-6 border-t border-ink/10 pt-5 text-ink" role="status">
          <div className="text-xl font-semibold text-green">CORRECT</div>
          <div className="mt-3 text-lg font-semibold">Particle size ↓</div>
          <div className="text-lg font-semibold">Mass = {mass.toFixed(1)} g</div>
          <p className="mt-3 text-base text-slate-700">
            Crushing reduces the particle size while the total mass remains unchanged.
          </p>
        </div>
      )}
    </div>
  );
}
