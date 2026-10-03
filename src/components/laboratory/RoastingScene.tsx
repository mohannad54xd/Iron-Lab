import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { Link } from 'react-router-dom';
import { ironOres, roastingCondition, roastingMassTrendObservations } from '../../data/ironOres';
import { useIronLabSession } from '../../state/IronLabSession';
import { useContinueHandoff, useObservationHandoff } from '../../hooks/useObservationHandoff';
import { useLabAudio } from '../../audio/LabAudio';

type MassTrend = NonNullable<(typeof ironOres)[keyof typeof ironOres]['massTrend']>;

const trendPaths: Record<MassTrend, string> = {
  'increases-then-constant': 'M 22 84 C 72 80, 118 42, 164 35 S 232 35, 278 35',
  'decreases-then-constant': 'M 22 30 C 72 34, 112 80, 162 84 S 232 84, 278 84',
  'decreases-minimum-increases-constant': 'M 22 28 C 60 34, 82 76, 126 86 S 177 45, 215 38 S 250 38, 278 38',
};

export function RoastingScene() {
  const { session, setCurrentStage, completeStage, discoverEquation, discoverFact, discoverObservation } = useIronLabSession();
  const { startAmbient } = useLabAudio();
  const [started, setStarted] = useState(false);
  const [finished, setFinished] = useState(false);
  const [activeStep, setActiveStep] = useState(-1);
  const [showGraph, setShowGraph] = useState(false);
  const [observationAcknowledged, setObservationAcknowledged] = useState(false);
  const timelineRef = useRef<gsap.core.Timeline | null>(null);
  const observationRef = useRef<HTMLElement | null>(null);
  const continueRef = useRef<HTMLDivElement | null>(null);
  const ore = session.oreType ? ironOres[session.oreType] : null;
  const roastingSteps = ore?.roastingPath ?? [];
  const noSourcePath = roastingSteps.length === 0;
  const activeRoastingStep = activeStep >= 0 ? roastingSteps[activeStep] : null;

  useObservationHandoff(finished, observationRef);
  useContinueHandoff(observationAcknowledged, continueRef);

  useEffect(() => {
    if (!started || finished) return;
    return startAmbient('roasting');
  }, [finished, startAmbient, started]);

  useEffect(() => {
    setCurrentStage('roasting');
  }, [setCurrentStage]);

  const startRoasting = () => {
    if (!ore || started) return;
    setCurrentStage('roasting');
    setStarted(true);

    if (noSourcePath) {
      discoverFact('The supplied source provides no roasting equation for Hematite.');
      discoverFact('Roasting product for reduction: Hematite (Fe₂O₃).');
      setFinished(true);
      return;
    }

    const timeline = gsap.timeline({
      onComplete: () => {
        setShowGraph(true);
        setFinished(true);
        discoverFact(`Roasting pathway recorded for ${ore.name}.`);
        discoverFact('Roasting product for reduction: Hematite (Fe₂O₃).');
        if (ore.massTrend) discoverObservation(roastingMassTrendObservations[ore.massTrend]);
      },
    });
    timelineRef.current = timeline;

    roastingSteps.forEach((step, index) => {
      const startAt = 0.75 + index * 1.9;
      timeline.call(() => setActiveStep(index), [], startAt);
      timeline.to('.roasting-ore-bed', {
        scale: 0.94,
        rotation: index % 2 === 0 ? -1.5 : 1.5,
        duration: 0.44,
        yoyo: true,
        repeat: 1,
        ease: 'sine.inOut',
      }, startAt);
      if (step.gasReleased) {
        const gas = document.querySelector<HTMLElement>(`.roasting-gas-${step.id}`);
        if (gas) {
          timeline.fromTo(gas, { y: 0, opacity: 0.1, scale: 0.6 }, {
            y: -36,
            opacity: 1,
            scale: 1,
            duration: 0.56,
            ease: 'power1.out',
          }, startAt + 0.42);
        }
      }
      if (step.intermediate) {
        timeline.call(() => discoverFact(`Roasting intermediate: ${step.intermediate}.`), [], startAt + 0.9);
      }
      timeline.call(() => discoverEquation(step.equation), [], startAt + 1.02);
    });
  };

  const acknowledgeObservation = () => {
    setObservationAcknowledged(true);
    completeStage('roasting');
    setCurrentStage('reduction');
  };

  const trend = ore?.massTrend;
  const finalProduct = 'Hematite · Fe₂O₃';

  return (
    <div className="min-h-[calc(100vh-86px)] bg-paper px-4 py-5">
      <div className="mx-auto grid max-w-7xl gap-4 xl:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="laboratory-panel p-5">
          <p className="eyebrow">Experiment</p>
          <h1 className="mt-3 text-3xl font-semibold text-ink">Roasting</h1>
          {ore && <div className="mt-5 border-t border-ink/10 pt-4"><p className="eyebrow">Current ore</p><p className="mt-2 text-xl font-semibold text-ink">{ore.name}</p><p className="text-sm text-slate-600">{ore.formula}</p></div>}
          <div className="mt-6 experiment-step is-active">
            <div className="text-[10px] uppercase tracking-[0.2em] text-slate-500">Stage</div>
            <p className="mt-2 text-sm font-medium text-ink">{finished ? 'Roasting sequence complete.' : started ? `Heating step ${Math.max(activeStep + 1, 1)} / ${roastingSteps.length}` : 'Follow the source-listed roasting path.'}</p>
          </div>
          {finished && <div className="experiment-complete mt-4">EXPERIMENT COMPLETE ✓</div>}
          {finished && <div className="mt-4 text-xs text-slate-600">Equations discovered: {session.discoveredEquations.length}</div>}
        </aside>

        <main className="laboratory-panel relative overflow-hidden px-3 py-4 sm:px-4">
          <div className={`workspace-area roasting-workspace${started && !finished ? ' is-heating' : ''}`}>
            <div className="roasting-condition"><span className="eyebrow">Roasting condition</span><strong>{activeRoastingStep?.condition ?? roastingCondition}</strong></div>
            <div className="roasting-furnace">
              <div className="furnace-arch"><span className="furnace-glow" /></div>
              <div className="furnace-bed">
                <div className="roasting-ore-bed" />
                {roastingSteps.filter((step) => step.gasReleased).map((step) => (
                  <span key={step.id} className={`roasting-gas roasting-gas-${step.id}`} aria-label={`${step.gasReleased} released`}>
                    {step.gasReleased}
                  </span>
                ))}
              </div>
              <div className="furnace-base" />
            </div>
            {!started && ore && (
              <button type="button" className="roasting-start-control" data-lab-sound="furnace-ignite" onClick={startRoasting}>
                START ROASTING
              </button>
            )}
            {showGraph && trend && (
              <div className="roasting-mass-graph" role="img" aria-label={roastingMassTrendObservations[trend]}>
                <p className="eyebrow">Mass of solid · qualitative</p>
                <svg viewBox="0 0 300 112" aria-hidden="true">
                  <path className="mass-graph-axis" d="M22 12 V92 H286" />
                  <path className="mass-graph-line" d={trendPaths[trend]} />
                </svg>
                <div className="mass-graph-labels"><span>Heating begins</span><span>Heating continues</span></div>
                <p className="text-xs text-slate-600">{roastingMassTrendObservations[trend]}</p>
              </div>
            )}
            {finished && ore && (
              <div className="roasting-final-product" role="status">
                <span className="eyebrow">Roasted solid</span>
                <strong>{finalProduct}</strong>
              </div>
            )}
          </div>
        </main>
      </div>

      {ore && (
        <section className="roasting-scientific-record" aria-live="polite" aria-label="Roasting scientific record">
          <header>
            <div><p className="eyebrow">Source chemistry</p><h2>{ore.name} roasting record</h2></div>
            <span className="roasting-record-formula">{ore.formula}</span>
          </header>
          <div className="roasting-record-grid">
            <div><b>Starting ore / mineral</b><span>{ore.name} · {ore.formula}</span></div>
            <div><b>Condition</b><span>{activeRoastingStep?.condition ?? roastingCondition}</span></div>
            <div><b>Equation</b><span>{activeRoastingStep?.equation ?? (noSourcePath ? 'No Hematite-specific equation is shown in the supplied Roshetta.' : started ? 'The next equation has not been revealed yet.' : 'Revealed during the roasting sequence.')}</span></div>
            <div><b>Products</b><span>{activeRoastingStep?.products ?? (noSourcePath ? 'Hematite · Fe₂O₃' : started ? 'Revealed with its equation.' : 'Revealed during the roasting sequence.')}</span></div>
            <div className="roasting-record-explanation"><b>Scientific explanation</b><span>{activeRoastingStep?.explanation ?? ore.roastingSourceNote ?? 'The source-listed transformation will be revealed step by step.'}</span></div>
            {(finished || noSourcePath) && <div><b>Observation</b><span>{trend ? roastingMassTrendObservations[trend] : 'No Hematite-specific roasting observation is given in the supplied source.'}</span></div>}
          </div>
        </section>
      )}

      {started && !noSourcePath && (
        <section className="mx-auto mt-6 max-w-7xl border-y border-ink/10 py-5" aria-label="Roasting equation discovery">
          <p className="eyebrow">Equation discovery</p>
          <div className="mt-4 space-y-3">
            {roastingSteps.map((step, index) => (
              <div key={step.id} className={`roasting-equation${activeStep >= index ? ' is-discovered' : ''}`}>
                <span className="roasting-equation-stage">{index === 0 ? 'Starting ore' : roastingSteps[index - 1]?.intermediate ? `Intermediate · ${roastingSteps[index - 1].intermediate}` : 'Next stage'}</span>
                <div className="roasting-equation-details">
                  <strong>{activeStep >= index ? step.equation : 'Equation not yet discovered'}</strong>
                  {activeStep >= index && <>
                    <small>Condition: {step.condition}</small>
                    <small>Products: {step.products}</small>
                    <p>{step.explanation}</p>
                  </>}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {finished && (
        <section ref={observationRef} className="stage-observation-handoff" aria-labelledby="roasting-observation-heading">
          <p className="eyebrow">Observation</p>
          <h2 id="roasting-observation-heading">Roasting observation</h2>
          {trend ? (
            <p>{roastingMassTrendObservations[trend]}</p>
          ) : (
            <p>The supplied source does not provide a roasting equation for Hematite. No transformation is inferred here.</p>
          )}
          {!observationAcknowledged && <button type="button" className="primary-button mt-4" onClick={acknowledgeObservation}>Acknowledge observation</button>}
        </section>
      )}

      {finished && observationAcknowledged && (
        <div ref={continueRef} className="continue-handoff mx-auto mt-5 max-w-7xl text-right">
          <Link to="/reduction" onClick={() => setCurrentStage('reduction')} className="primary-button">Continue to Reduction</Link>
        </div>
      )}
    </div>
  );
}
