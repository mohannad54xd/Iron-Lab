import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { useNavigate } from 'react-router-dom';
import { reductionSequenceObservation } from '../../data/extraction';
import { ironOres } from '../../data/ironOres';
import { reductionRoutes } from '../../data/reductionRoutes';
import { useIronLabSession } from '../../state/IronLabSession';
import { useContinueHandoff, useObservationHandoff } from '../../hooks/useObservationHandoff';
import { useLabAudio } from '../../audio/LabAudio';

type Position = { x: number; y: number };
type DragStart = Position & { pointerX: number; pointerY: number };

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function containsPoint(element: HTMLElement | null, x: number, y: number) {
  if (!element) return false;
  const rect = element.getBoundingClientRect();
  return x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
}

export function ReductionScene() {
  const navigate = useNavigate();
  const { session, setCurrentStage, completeStage, discoverEquation, discoverFact, discoverObservation } = useIronLabSession();
  const { playSound, startAmbient } = useLabAudio();
  const workspaceRef = useRef<HTMLDivElement | null>(null);
  const furnaceRef = useRef<HTMLDivElement | null>(null);
  const oreSampleRef = useRef<HTMLButtonElement | null>(null);
  const observationRef = useRef<HTMLElement | null>(null);
  const continueRef = useRef<HTMLDivElement | null>(null);
  const dragRef = useRef<DragStart | null>(null);
  const timelineRef = useRef<gsap.core.Timeline | null>(null);
  const progressTrackRef = useRef({ value: 0 });
  const [oreLoaded, setOreLoaded] = useState(false);
  const [processStarted, setProcessStarted] = useState(false);
  const [transformationStarted, setTransformationStarted] = useState(false);
  const [ironFormed, setIronFormed] = useState(false);
  const [progress, setProgress] = useState(0);
  const [samplePosition, setSamplePosition] = useState<Position>({ x: 28, y: 292 });
  const [isDragging, setIsDragging] = useState(false);
  const [isDropTarget, setIsDropTarget] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [completed, setCompleted] = useState(false);
  const ore = ironOres.hematite;
  const selectedRoute = reductionRoutes.find((route) => session.discoveredFacts.includes(route.fact)) ?? null;
  const completedRouteSteps = selectedRoute?.steps.filter((step) => session.discoveredEquations.includes(step.equation)) ?? [];
  const nextRouteStep = selectedRoute?.steps.find((step) => !session.discoveredEquations.includes(step.equation)) ?? null;
  const routeReady = Boolean(selectedRoute) && !nextRouteStep;

  useEffect(() => {
    setCurrentStage('reduction');
  }, [setCurrentStage]);

  useObservationHandoff(ironFormed, observationRef);
  useContinueHandoff(completed, continueRef);

  useEffect(() => {
    if (!processStarted || ironFormed) return;
    return startAmbient('roasting');
  }, [ironFormed, processStarted, startAmbient]);

  useEffect(() => {
    if (!processStarted) return;
    const workspace = workspaceRef.current;
    if (!workspace) return;

    const progressTrack = progressTrackRef.current;
    progressTrack.value = 0;
    const timeline = gsap.timeline({
      onComplete: () => {
        setProgress(100);
        setIronFormed(true);
        playSound('particle-collection');
      },
    });
    timelineRef.current = timeline;
    timeline
      .to(progressTrack, {
        value: 100,
        duration: 3.2,
        ease: 'none',
        onUpdate: () => setProgress(Math.floor(progressTrack.value / 5) * 5),
      }, 0)
      .fromTo('.reduction-furnace-core', { opacity: 0.35, scale: 0.94 }, {
        opacity: 1,
        scale: 1,
        duration: 1.1,
        ease: 'sine.inOut',
      }, 0)
      .fromTo('.reduction-heat-track span', { scaleX: 0 }, {
        scaleX: 1,
        duration: 3.2,
        ease: 'none',
      }, 0)
      .to('.reduction-core-charge', {
        y: -4,
        rotation: 1.5,
        duration: 0.5,
        repeat: 1,
        yoyo: true,
        ease: 'sine.inOut',
      }, 0.45)
      .call(() => setTransformationStarted(true), [], 1.35)
      .to('.reduction-core-charge', {
        scale: 0.58,
        opacity: 0.24,
        duration: 0.62,
        ease: 'power2.in',
      }, 1.45)
      .fromTo('.reduction-output-fe', { y: 14, scale: 0.22, opacity: 0 }, {
        y: 0,
        scale: 1,
        opacity: 1,
        duration: 0.62,
        ease: 'back.out(1.35)',
      }, 2.18);

    return () => { timeline.kill(); };
  }, [playSound, processStarted]);

  useEffect(() => () => {
    timelineRef.current?.kill();
  }, []);

  const handleSamplePointerDown = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (oreLoaded || processStarted) return;
    dragRef.current = { pointerX: event.clientX, pointerY: event.clientY, ...samplePosition };
    setIsDragging(true);
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handleSamplePointerMove = (event: React.PointerEvent<HTMLButtonElement>) => {
    const drag = dragRef.current;
    const workspace = workspaceRef.current?.getBoundingClientRect();
    if (!drag || !workspace) return;
    const width = oreSampleRef.current?.offsetWidth ?? 104;
    const height = oreSampleRef.current?.offsetHeight ?? 78;
    setSamplePosition({
      x: clamp(drag.x + event.clientX - drag.pointerX, 0, workspace.width - width),
      y: clamp(drag.y + event.clientY - drag.pointerY, 0, workspace.height - height),
    });
    setIsDropTarget(containsPoint(furnaceRef.current, event.clientX, event.clientY));
  };

  const finishSampleDrag = (event: React.PointerEvent<HTMLButtonElement>, cancelled = false) => {
    const drag = dragRef.current;
    dragRef.current = null;
    setIsDragging(false);
    setIsDropTarget(false);
    if (!drag) return;
    if (cancelled || !containsPoint(furnaceRef.current, event.clientX, event.clientY)) {
      const sample = oreSampleRef.current;
      if (sample) gsap.fromTo(sample, { scale: 1.06 }, { scale: 1, duration: 0.24, ease: 'power2.out' });
      return;
    }
    setOreLoaded(true);
    setSamplePosition({ x: 0, y: 0 });
    playSound('particle-collection');
  };

  const selectReductionRoute = (routeId: (typeof reductionRoutes)[number]['id']) => {
    const route = reductionRoutes.find((item) => item.id === routeId);
    if (!route || selectedRoute) return;
    discoverFact(route.fact);
  };

  const revealReductionStep = () => {
    if (!nextRouteStep) return;
    discoverEquation(nextRouteStep.equation);
    discoverObservation(nextRouteStep.observation);
  };

  const activateProcess = () => {
    if (!oreLoaded || !routeReady || processStarted) return;
    setProcessStarted(true);
  };

  const answerObservation = (answer: string) => {
    setSelectedAnswer(answer);
    if (answer !== 'iron') return;
    setCompleted(true);
    completeStage('reduction');
    completeStage('iron-formation');
    completeStage('iron');
    discoverObservation(reductionSequenceObservation);
  };

  const continueToJourney = () => {
    if (!completed) return;
    setCurrentStage('mind-map');
    navigate('/mind-map');
  };

  return (
    <div className="min-h-[calc(100vh-86px)] bg-paper px-4 py-5">
      <div className="mx-auto grid max-w-7xl gap-4 xl:grid-cols-[300px_minmax(0,1fr)]">
        <aside className="laboratory-panel p-5">
          <p className="eyebrow">Experiment</p>
          <h1 className="mt-3 text-3xl font-semibold text-ink">Reduction</h1>
          {ore && (
            <div className="current-ore-record mt-5">
              <p className="eyebrow">CURRENT ORE</p>
              <h2>{ore.name}</h2>
              <p>{ore.formula}</p>
            </div>
          )}
          <div className={`mt-6 experiment-step${!routeReady ? ' is-active' : ' is-complete'}`}>
            <div className="text-[10px] uppercase tracking-[0.2em] text-slate-500">Step 1</div>
            <p className="mt-2 text-sm font-medium text-ink">{!selectedRoute ? 'Choose a reducing agent.' : routeReady ? `${selectedRoute.heading} chemistry complete.` : `${completedRouteSteps.length} / ${selectedRoute.steps.length} reactions revealed.`}</p>
          </div>
          <div className={`mt-4 experiment-step${routeReady && !oreLoaded ? ' is-active' : ''}${oreLoaded ? ' is-complete' : ''}`}>
            <div className="text-[10px] uppercase tracking-[0.2em] text-slate-500">Step 2</div>
            <p className="mt-2 text-sm font-medium text-ink">{oreLoaded ? 'Activate the process at the furnace.' : routeReady ? 'Load the current ore sample into the chamber.' : 'Complete the selected route chemistry first.'}</p>
          </div>
          <div className={`mt-4 experiment-step${processStarted && !ironFormed ? ' is-active' : ''}${ironFormed ? ' is-complete' : ''}`}>
            <div className="text-[10px] uppercase tracking-[0.2em] text-slate-500">Step 3</div>
            <p className="mt-2 text-sm font-medium text-ink">Process activation → transformation → iron formation.</p>
            {processStarted && !ironFormed && <p className="mt-2 text-xs text-slate-500" role="status">{transformationStarted ? 'Transformation in progress.' : 'Process active.'} · {progress}%</p>}
          </div>
          {ironFormed && !completed && <div className="experiment-complete mt-4">REDUCTION COMPLETE ✓</div>}
          {completed && <div className="experiment-complete mt-4">IRON FORMED ✓</div>}
        </aside>
        <main className="laboratory-panel relative overflow-hidden px-3 py-4 sm:px-4">
          <section className="reduction-route-panel" aria-labelledby="reduction-route-heading" aria-live="polite">
            {!selectedRoute ? (
              <>
                <p className="eyebrow">Reduction method</p>
                <h2 id="reduction-route-heading">Select reducing agent</h2>
                <div className="reduction-route-options">
                  {reductionRoutes.map((route, index) => (
                    <button key={route.id} type="button" className="reduction-route-option" onClick={() => selectReductionRoute(route.id)}>
                      <span className="reduction-route-letter">{index === 0 ? 'A' : 'B'}</span>
                      <span className="reduction-route-option-copy"><strong>{route.reducingAgent}</strong><b>{route.heading}</b><small>{route.description}</small></span>
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <>
                <div className="reduction-route-heading">
                  <div><p className="eyebrow">Selected route · {selectedRoute.reducingAgent}</p><h2 id="reduction-route-heading">{selectedRoute.heading}</h2></div>
                  <span>{completedRouteSteps.length} / {selectedRoute.steps.length} reactions</span>
                </div>
                <p className="reduction-route-description">{selectedRoute.description}</p>
                {completedRouteSteps.map((step) => (
                  <article className="reduction-route-step is-revealed" key={step.id}>
                    <h3>{step.title}</h3>
                    <strong>{step.equation}</strong>
                    <p><b>Condition:</b> {step.condition}</p>
                    <p><b>Products:</b> {step.products}</p>
                    <p>{step.explanation}</p>
                  </article>
                ))}
                {nextRouteStep ? (
                  <article className="reduction-route-step is-next">
                    <p className="eyebrow">Next reaction · {completedRouteSteps.length + 1}</p>
                    <h3>{nextRouteStep.title}</h3>
                    <p><b>Reactants:</b> {nextRouteStep.reactants}</p>
                    <p><b>Condition:</b> {nextRouteStep.condition}</p>
                    <button type="button" className="primary-button" onClick={revealReductionStep}>Reveal reaction</button>
                  </article>
                ) : <p className="reduction-route-complete" role="status">Route chemistry complete. The ore sample can now enter the process chamber.</p>}
              </>
            )}
          </section>

          <div ref={workspaceRef} className={`workspace-area reduction-workspace${processStarted && !ironFormed ? ' is-processing' : ''}${isDropTarget ? ' is-drop-target' : ''}`}>
            <p className="reduction-workspace-label">REDUCTION · IRON FORMATION</p>
            <div className="reduction-source-boundary" role="note">
              <span className="eyebrow">{selectedRoute ? selectedRoute.heading : 'Select a route above'}</span>
              <p>{selectedRoute ? selectedRoute.description : 'Choose coke/carbon for the Blast Furnace or CH₄/natural gas for the tube / MIDREX route.'}</p>
              {selectedRoute && !routeReady && <small>Complete the route reactions above before loading the ore.</small>}
            </div>

            <div ref={furnaceRef} className={`reduction-furnace${isDropTarget ? ' is-drop-target' : ''}${oreLoaded ? ' has-ore' : ''}`} aria-label="Schematic reduction process chamber">
              <div className="reduction-furnace-rim" />
              <div className="reduction-furnace-core">
                {oreLoaded && !ironFormed && <span className="reduction-core-charge">{ore?.name} · {ore?.formula}</span>}
                <span className={`reduction-output-fe${ironFormed ? ' is-formed' : ''}`} aria-label={ironFormed ? 'Iron formed, Fe' : undefined}>Fe</span>
              </div>
              <div className="reduction-heat-track"><span style={{ transform: `scaleX(${progress / 100})` }} /></div>
              <span className="reduction-furnace-caption">PROCESS CHAMBER</span>
            </div>
            {oreLoaded && !processStarted && (
              <button type="button" className="primary-button reduction-activate-control" data-lab-sound="furnace-ignite" onClick={activateProcess}>
                ACTIVATE PROCESS
              </button>
            )}

            <div className="reduction-feed-slot" aria-label="Ore sample loading area">
              <span>ORE INPUT</span>
              {!oreLoaded && <small>Load current ore</small>}
              {oreLoaded && <small>Sample loaded</small>}
            </div>
            <div className={`reduction-product-slot${ironFormed ? ' is-formed' : ''}`} aria-label="Iron collection area">
              <span>IRON COLLECTION</span>
              {!ironFormed && <small>Awaiting final product</small>}
              {ironFormed && <small>IRON · Fe</small>}
            </div>

            {ore && routeReady && !oreLoaded && !processStarted && (
              <button
                ref={oreSampleRef}
                type="button"
                className={`reduction-ore-sample${isDragging ? ' is-dragging' : ''}`}
                style={{ left: `${samplePosition.x}px`, top: `${samplePosition.y}px` }}
                onPointerDown={handleSamplePointerDown}
                onPointerMove={handleSamplePointerMove}
                onPointerUp={(event) => finishSampleDrag(event)}
                onPointerCancel={(event) => finishSampleDrag(event, true)}
                onClick={() => {
                  if (!dragRef.current && !isDragging) {
                    setOreLoaded(true);
                    playSound('particle-collection');
                  }
                }}
                aria-label={`Load ${ore.name} sample into the reduction chamber`}
              >
                <span>{ore.name}</span>
                <small>{ore.formula}</small>
              </button>
            )}
          </div>
        </main>
      </div>
      {ironFormed && (
        <section ref={observationRef} className="stage-observation-handoff reduction-observation" aria-labelledby="reduction-observation-heading">
          <p className="eyebrow">Observation</p>
          <h2 id="reduction-observation-heading">What final product appeared?</h2>
          <div className="reduction-answer-list">
            <button type="button" onClick={() => answerObservation('iron')} disabled={completed} aria-pressed={selectedAnswer === 'iron'} className={selectedAnswer === 'iron' ? 'is-selected' : ''}>
              <span>A</span> Iron (Fe)
            </button>
            <button type="button" onClick={() => answerObservation('ore')} disabled={completed} aria-pressed={selectedAnswer === 'ore'} className={selectedAnswer === 'ore' ? 'is-selected' : ''}>
              <span>B</span> {ore?.name} ({ore?.formula})
            </button>
            <button type="button" onClick={() => answerObservation('none')} disabled={completed} aria-pressed={selectedAnswer === 'none'} className={selectedAnswer === 'none' ? 'is-selected' : ''}>
              <span>C</span> No final product was shown
            </button>
          </div>
          {selectedAnswer && selectedAnswer !== 'iron' && !completed && <p className="mt-3 text-sm text-slate-600" role="status">Follow the product marker in the collection area.</p>}
          {completed && <div className="reduction-observation-reveal" role="status">IRON FORMED ✓</div>}
          {completed && (
            <div ref={continueRef} className="continue-handoff mt-4">
              <button type="button" className="primary-button" onClick={continueToJourney}>CONTINUE TO IRON JOURNEY</button>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
