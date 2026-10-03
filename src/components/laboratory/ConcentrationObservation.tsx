type ConcentrationObservationProps = {
  selectedAnswer: string | null;
  completed: boolean;
  onSelect: (answer: string) => void;
  sourceRelationships: string[];
};

const options = [
  { id: 'A', label: 'The particles were only broken into smaller pieces.' },
  { id: 'B', label: 'Impurities were physically separated from the useful ore.' },
  { id: 'C', label: 'The ore and impurities remained in one mixture.' },
];

export function ConcentrationObservation({ selectedAnswer, completed, onSelect, sourceRelationships }: ConcentrationObservationProps) {
  return (
    <section className="concentration-observation" aria-labelledby="concentration-question">
      <p className="eyebrow">Observation</p>
      <h2 id="concentration-question" className="mt-2 text-xl font-semibold text-ink">What happened during concentration?</h2>
      <div className="mt-4 grid gap-2 md:grid-cols-3">
        {options.map((option) => (
          <button key={option.id} type="button" onClick={() => onSelect(option.id)} disabled={completed} aria-pressed={selectedAnswer === option.id} className={`concentration-answer${selectedAnswer === option.id ? ' is-selected' : ''}`}>
            <span>{option.id}</span>{option.label}
          </button>
        ))}
      </div>
      {selectedAnswer && selectedAnswer !== 'B' && !completed && <p className="mt-3 text-sm text-slate-600" role="status">Look at where each part of the sample ended up.</p>}
      {completed && (
        <div className="concentration-reveal" role="status">
          <p className="eyebrow">Concentration</p>
          <p className="mt-3 text-base font-semibold text-ink">Physical separation</p>
          <p className="mt-1 text-sm text-slate-600">↓ Impurities removed</p>
          <p className="mt-1 text-base font-semibold text-ink">↓ Concentrated ore obtained</p>
          <ul className="mt-4 space-y-1 text-sm text-slate-700">
            {sourceRelationships.map((relationship) => <li key={relationship}>{relationship}</li>)}
          </ul>
        </div>
      )}
    </section>
  );
}
