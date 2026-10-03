import { useState } from 'react';

const question = 'What changed when the ore was crushed?';
const options = ['Mass decreased', 'Particle size decreased', 'Both decreased'];

export function ChallengeScene() {
  const [selected, setSelected] = useState<string | null>(null);
  const correct = 'Particle size decreased';

  return (
    <div className="page-shell">
      <div className="mx-auto max-w-4xl px-4 py-12">
        <div className="panel p-8">
          <p className="eyebrow">Challenge</p>
          <h1 className="mt-3 text-4xl font-semibold text-ink">Physical change check</h1>
          <p className="mt-6 text-xl text-slate-700">{question}</p>

          <div className="mt-8 space-y-3">
            {options.map((option) => {
              const isCorrect = option === correct;
              const isSelected = selected === option;
              const reveal = selected !== null && isCorrect;

              return (
                <button
                  key={option}
                  type="button"
                  onClick={() => setSelected(option)}
                  className={`w-full rounded-2xl border px-4 py-4 text-left text-lg transition ${
                    isSelected ? 'border-iron bg-iron/10 text-ink' : 'border-ink/10 bg-white/80 text-slate-700'
                  } ${reveal ? 'border-green bg-green/10 text-ink' : ''}`}
                >
                  {option}
                </button>
              );
            })}
          </div>

          {selected && (
            <div className="mt-8 rounded-2xl border border-ink/10 bg-white/80 p-4 text-slate-700">
              {selected === correct ? 'Correct — crushing changes particle size, not the total mass.' : 'Not quite — the total mass remains effectively unchanged while the particle size decreases.'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
