import { useMemo } from 'react';

const entries = [
  {
    id: 'crushing',
    experiment: 'Crushing',
    observation: 'Particle size decreased while the mass remained constant.',
    measurement: '120 g → 120 g',
    equation: 'No chemical equation; physical change only',
    result: 'Verified physical transformation',
  },
  {
    id: 'sintering',
    experiment: 'Sintering',
    observation: 'Particles agglomerated into a denser mass.',
    measurement: 'Fine powder → combined aggregate',
    equation: 'TODO / source pending',
    result: 'Agglomeration observed',
  },
  {
    id: 'concentration',
    experiment: 'Concentration',
    observation: 'Useful ore separated from gangue.',
    measurement: 'Mixed sample → enriched ore fraction',
    equation: 'TODO / source pending',
    result: 'Enrichment observed',
  },
];

export function LabScene() {
  const total = useMemo(() => entries.length, []);

  return (
    <div className="page-shell">
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <p className="eyebrow">Lab journal</p>
            <h1 className="mt-2 text-4xl font-semibold text-ink">Your recorded experiments</h1>
          </div>
          <div className="rounded-full border border-ink/10 bg-white/80 px-4 py-2 text-sm font-medium text-slate-700">
            {total} recorded stages
          </div>
        </div>

        <div className="space-y-5">
          {entries.map((entry) => (
            <div key={entry.id} className="panel p-6">
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div className="min-w-0">
                  <p className="eyebrow">Experiment</p>
                  <h2 className="mt-2 text-2xl font-semibold text-ink">{entry.experiment}</h2>
                </div>
                <div className="rounded-full border border-ink/10 bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-600">
                  {entry.result}
                </div>
              </div>

              <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-2xl bg-white/70 p-4">
                  <div className="text-xs uppercase tracking-[0.18em] text-slate-500">Observation</div>
                  <div className="mt-3 text-sm text-slate-700">{entry.observation}</div>
                </div>
                <div className="rounded-2xl bg-white/70 p-4">
                  <div className="text-xs uppercase tracking-[0.18em] text-slate-500">Measurement</div>
                  <div className="mt-3 text-sm text-slate-700">{entry.measurement}</div>
                </div>
                <div className="rounded-2xl bg-white/70 p-4">
                  <div className="text-xs uppercase tracking-[0.18em] text-slate-500">Equation</div>
                  <div className="mt-3 text-sm text-slate-700">{entry.equation}</div>
                </div>
                <div className="rounded-2xl bg-white/70 p-4">
                  <div className="text-xs uppercase tracking-[0.18em] text-slate-500">Result</div>
                  <div className="mt-3 text-sm text-slate-700">{entry.result}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
