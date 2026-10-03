type SinteringObservationProps = {
  selectedAnswer: string | null;
  completed: boolean;
  onSelect: (answer: string) => void;
};

const options = [
  { id: 'A', label: 'The particles stayed fine.' },
  { id: 'B', label: 'Fine particles formed larger agglomerated pieces.' },
  { id: 'C', label: 'No visible change occurred.' },
];

export function SinteringObservation({ selectedAnswer, completed, onSelect }: SinteringObservationProps) {
  return (
    <section className="sintering-observation" aria-labelledby="sintering-observation-heading">
      <p className="eyebrow">Observation</p>
      <h2 id="sintering-observation-heading" className="mt-2 text-xl font-semibold text-ink">What changed after sintering?</h2>
      <div className="mt-4 grid gap-2">
        {options.map((option) => (
          <button
            key={option.id}
            type="button"
            onClick={() => onSelect(option.id)}
            disabled={completed}
            aria-pressed={selectedAnswer === option.id}
            className={`sintering-answer${selectedAnswer === option.id ? ' is-selected' : ''}`}
          >
            <span>{option.id}</span>
            {option.label}
          </button>
        ))}
      </div>
      {selectedAnswer && selectedAnswer !== 'B' && !completed && (
        <p className="mt-3 text-sm text-slate-600" role="status">Compare the fine particles with the larger pieces.</p>
      )}
      {completed && (
        <div className="sintering-reveal" role="status">
          <p className="eyebrow">Sintering</p>
          <p className="mt-2 text-xl font-semibold text-ink">Fine particles form larger agglomerated pieces.</p>
        </div>
      )}
    </section>
  );
}
