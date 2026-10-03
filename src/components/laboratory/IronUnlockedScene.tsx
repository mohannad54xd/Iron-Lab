export function IronUnlockedScene() {
  return (
    <div className="page-shell">
      <div className="mx-auto max-w-5xl px-4 py-16">
        <div className="panel overflow-hidden p-10">
          <div className="flex flex-col items-center text-center">
            <p className="eyebrow">Iron obtained</p>
            <div className="mt-6 flex h-32 w-32 items-center justify-center rounded-full bg-gradient-to-br from-iron to-oxide text-4xl font-black text-white shadow-lab">
              Fe
            </div>
            <h1 className="mt-8 text-5xl font-semibold tracking-tight text-ink">Iron unlocked</h1>
            <p className="mt-6 max-w-2xl text-xl text-slate-700">
              The extraction sequence reaches the metallic product, and the reaction map expands to reveal the larger network surrounding iron.
            </p>
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-3">
            <div className="rounded-[24px] border border-ink/10 bg-white/80 p-5 text-center">
              <div className="text-sm uppercase tracking-[0.2em] text-slate-500">Node</div>
              <div className="mt-3 text-3xl font-bold text-ink">Fe</div>
            </div>
            <div className="rounded-[24px] border border-ink/10 bg-white/80 p-5 text-center">
              <div className="text-sm uppercase tracking-[0.2em] text-slate-500">Status</div>
              <div className="mt-3 text-3xl font-bold text-green">Active</div>
            </div>
            <div className="rounded-[24px] border border-ink/10 bg-white/80 p-5 text-center">
              <div className="text-sm uppercase tracking-[0.2em] text-slate-500">Path</div>
              <div className="mt-3 text-3xl font-bold text-blue">Map</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
