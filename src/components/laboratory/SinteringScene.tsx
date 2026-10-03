import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import type { PointerEvent as ReactPointerEvent } from 'react';
import { Link } from 'react-router-dom';
import { sinteringLab } from '../../data/sintering';
import { useIronLabSession } from '../../state/IronLabSession';
import type { AgglomerateState, FineOreParticleState, SinteringState } from '../../types/sintering';
import { Agglomerate } from './Agglomerate';
import { FineOreParticle } from './FineOreParticle';
import { HeatingControl } from './HeatingControl';
import { SinteringObservation } from './SinteringObservation';
import { SinteringProgress } from './SinteringProgress';
import { SinteringTray } from './SinteringTray';
import { useContinueHandoff, useObservationHandoff } from '../../hooks/useObservationHandoff';
import { useLabAudio } from '../../audio/LabAudio';

const FINE_PARTICLE_TOTAL = 12;

type DragStart = {
  id: string;
  pointerX: number;
  pointerY: number;
  x: number;
  y: number;
  placed: boolean;
  members?: Array<{ id: string; x: number; y: number }>;
};
type Position = { x: number; y: number };

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function attractionOffset(index: number): Position {
  if (index === 0) return { x: 0, y: 0 };
  const ringIndex = (index - 1) % 6;
  const ring = Math.floor((index - 1) / 6);
  const angle = (ringIndex / 6) * Math.PI * 2 - Math.PI / 2;
  const radius = 24 + ring * 16;
  return { x: Math.cos(angle) * radius, y: Math.sin(angle) * radius };
}

function containsPoint(element: HTMLElement | null, x: number, y: number) {
  if (!element) return false;
  const rect = element.getBoundingClientRect();
  return x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
}

function createFineParticles(width: number, height: number): FineOreParticleState[] {
  const columns = window.innerWidth < 768 ? 3 : 6;
  const cellWidth = (width - 48) / columns;

  return Array.from({ length: FINE_PARTICLE_TOTAL }, (_, index) => {
    const size = 18 + (index % 4) * 2;
    const column = index % columns;
    const row = Math.floor(index / columns);

    return {
      id: `fine-ore-${index + 1}`,
      x: 24 + column * cellWidth + (cellWidth - size) / 2 + (Math.random() - 0.5) * 8,
      y: 66 + row * 54 + (Math.random() - 0.5) * 9,
      size,
      rotation: Math.round(Math.random() * 50 - 25),
      placed: false,
    };
  }).map((particle) => ({
    ...particle,
    y: clamp(particle.y, 44, Math.min(290, height - 280)),
  }));
}

function createAgglomerates(bedRect: DOMRect, stageRect: DOMRect): AgglomerateState[] {
  const centers = [
    { x: 0.29, y: 0.45 },
    { x: 0.71, y: 0.45 },
    { x: 0.29, y: 0.72 },
    { x: 0.71, y: 0.72 },
  ];

  return centers.map((center, index) => {
    const size = 54 + (index % 2) * 11;
    return {
      id: `agglomerate-${index + 1}`,
      x: bedRect.left - stageRect.left + bedRect.width * center.x - size / 2,
      y: bedRect.top - stageRect.top + bedRect.height * center.y - size / 2,
      size,
      rotation: Math.round(Math.random() * 20 - 10),
    };
  });
}

export function SinteringScene() {
  const { session, setCurrentStage, completeStage, discoverObservation } = useIronLabSession();
  const { startAmbient } = useLabAudio();
  const workspaceRef = useRef<HTMLDivElement | null>(null);
  const trayRef = useRef<HTMLDivElement | null>(null);
  const bedRef = useRef<HTMLDivElement | null>(null);
  const observationRef = useRef<HTMLDivElement | null>(null);
  const continueRef = useRef<HTMLDivElement | null>(null);
  const fineDragRef = useRef<DragStart | null>(null);
  const agglomerateDragRef = useRef<DragStart | null>(null);
  const hasStartedRef = useRef(false);
  const sinteringTimelineRef = useRef<gsap.core.Timeline | null>(null);
  const progressTrackRef = useRef({ value: 0 });

  const [fineParticles, setFineParticles] = useState<FineOreParticleState[]>([]);
  const [sinteringState, setSinteringState] = useState<SinteringState>({
    particlesPlaced: 0,
    sinteringStarted: false,
    sinteringProgress: 0,
    agglomerates: [],
    transformationComplete: false,
    completed: false,
  });
  const [activeFineParticle, setActiveFineParticle] = useState<string | null>(null);
  const [activeAgglomerate, setActiveAgglomerate] = useState<string | null>(null);
  const [isTrayDropTarget, setIsTrayDropTarget] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);

  useEffect(() => {
    setCurrentStage('sintering');
  }, [setCurrentStage]);

  const placedCount = Math.max(sinteringState.particlesPlaced, fineParticles.filter((particle) => particle.placed).length);
  const trayReady = placedCount === FINE_PARTICLE_TOTAL;
  const heating = sinteringState.sinteringStarted && !sinteringState.transformationComplete;

  useObservationHandoff(sinteringState.transformationComplete, observationRef);
  useContinueHandoff(sinteringState.completed, continueRef);

  useEffect(() => {
    if (!heating) return;
    return startAmbient('sintering');
  }, [heating, startAmbient]);

  useEffect(() => {
    const placeFineOre = () => {
      const stage = workspaceRef.current?.getBoundingClientRect();
      if (!stage || hasStartedRef.current) return;
      setFineParticles(createFineParticles(stage.width, stage.height));
    };

    placeFineOre();
    window.addEventListener('resize', placeFineOre);
    return () => window.removeEventListener('resize', placeFineOre);
  }, []);

  useEffect(() => {
    if (!sinteringState.sinteringStarted || sinteringState.transformationComplete || sinteringState.agglomerates.length === 0) return;

    const workspace = workspaceRef.current;
    if (!workspace) return;
    const fineNodes = fineParticles.map((particle) => workspace.querySelector<HTMLElement>(`[data-fine-id="${particle.id}"]`)).filter((node): node is HTMLElement => Boolean(node));
    const timeline = gsap.timeline({
      onComplete: () => {
        workspace.querySelectorAll<HTMLElement>('.sintering-agglomerate').forEach((node) => gsap.set(node, { clearProps: 'transform,opacity' }));
        setFineParticles([]);
        setSinteringState((current) => ({ ...current, sinteringProgress: 100, transformationComplete: true }));
      },
    });
    sinteringTimelineRef.current = timeline;
    const progressTrack = progressTrackRef.current;
    progressTrack.value = 0;

    timeline
      .to(progressTrack, {
        value: 100,
        duration: 3.35,
        ease: 'none',
        onUpdate: () => setSinteringState((current) => ({ ...current, sinteringProgress: Math.round(progressTrack.value) })),
      }, 0)
      .fromTo('.heating-coil', { opacity: 0.35, scaleX: 0.82 }, { opacity: 1, scaleX: 1, duration: 0.58, ease: 'power2.out' }, 0)
      .fromTo('.sintering-chamber', { boxShadow: 'inset 0 0 0 rgba(185,104,60,0)' }, { boxShadow: 'inset 0 -12px 28px rgba(185,104,60,0.22)', duration: 0.9 }, 0.2);

    fineNodes.forEach((node, index) => {
      timeline.to(node, {
        x: index % 2 === 0 ? 1.5 : -1.5,
        y: index % 3 === 0 ? -1 : 1,
        duration: 0.055,
        repeat: 9,
        yoyo: true,
        ease: 'sine.inOut',
      }, 0.48 + (index % 4) * 0.018);
    });

    sinteringState.agglomerates.forEach((agglomerate, index) => {
      const group = fineParticles.slice(index * 3, index * 3 + 3);
      const startTime = 1.2 + index * 0.38;
      group.forEach((particle, particleIndex) => {
        const node = workspace.querySelector<HTMLElement>(`[data-fine-id="${particle.id}"]`);
        if (!node) return;
        const targetX = agglomerate.x + agglomerate.size / 2 - particle.x - particle.size / 2 + (particleIndex - 1) * 4;
        const targetY = agglomerate.y + agglomerate.size * 0.4 - particle.y - particle.size / 2;
        timeline.to(node, {
          x: targetX,
          y: targetY,
          scale: 0.34,
          rotation: 0,
          duration: 0.82,
          ease: 'power2.inOut',
        }, startTime);
      });

      const lump = workspace.querySelector<HTMLElement>(`#${agglomerate.id}`);
      if (lump) {
        timeline.fromTo(lump, { scale: 0.2, opacity: 0, y: 5 }, {
          scale: 1,
          opacity: 1,
          y: 0,
          duration: 0.58,
          ease: 'back.out(1.35)',
        }, startTime + 0.44);
      }
    });

    return () => {
      timeline.kill();
    };
  }, [fineParticles, sinteringState.agglomerates, sinteringState.sinteringStarted, sinteringState.transformationComplete]);

  useEffect(() => () => {
    sinteringTimelineRef.current?.kill();
  }, []);

  const handleFinePointerDown = (particle: FineOreParticleState, event: ReactPointerEvent<HTMLDivElement>) => {
    if (sinteringState.sinteringStarted || sinteringState.transformationComplete) return;
    hasStartedRef.current = true;
    fineDragRef.current = {
      id: particle.id,
      pointerX: event.clientX,
      pointerY: event.clientY,
      x: particle.x,
      y: particle.y,
      placed: particle.placed,
      members: fineParticles.map(({ id, x, y }) => ({ id, x, y })),
    };
    setActiveFineParticle('group');
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handleFinePointerMove = (particleId: string, event: ReactPointerEvent<HTMLDivElement>) => {
    const drag = fineDragRef.current;
    const stage = workspaceRef.current?.getBoundingClientRect();
    if (!drag || drag.id !== particleId || !stage) return;

    const deltaX = event.clientX - drag.pointerX;
    const deltaY = event.clientY - drag.pointerY;
    const heldParticle = fineParticles.find((particle) => particle.id === drag.id);
    if (!heldParticle) return;
    const orderedIds = [drag.id, ...(drag.members ?? []).map((member) => member.id).filter((id) => id !== drag.id)];
    const memberIndexes = new Map(orderedIds.map((id, index) => [id, index]));
    const centerX = drag.x + deltaX + heldParticle.size / 2;
    const centerY = drag.y + deltaY + heldParticle.size / 2;
    setFineParticles((current) => current.map((particle) => {
      const index = memberIndexes.get(particle.id);
      if (index === undefined) return particle;
      const offset = attractionOffset(index);
      return {
        ...particle,
        x: clamp(centerX + offset.x - particle.size / 2, 0, stage.width - particle.size),
        y: clamp(centerY + offset.y - particle.size / 2, 0, stage.height - particle.size),
      };
    }));
    setIsTrayDropTarget(containsPoint(bedRef.current, event.clientX, event.clientY));
  };

  const finishFineDrag = (particleId: string, event: ReactPointerEvent<HTMLDivElement>, cancelled = false) => {
    const drag = fineDragRef.current;
    const element = event.currentTarget;
    fineDragRef.current = null;
    setActiveFineParticle(null);
    setIsTrayDropTarget(false);
    if (!drag || drag.id !== particleId) return;

    const particle = fineParticles.find((item) => item.id === particleId);
    const bedRect = bedRef.current?.getBoundingClientRect();
    const stageRect = workspaceRef.current?.getBoundingClientRect();
    if (!particle || !bedRect || !stageRect) return;
    const members = drag.members ?? [{ id: particleId, x: drag.x, y: drag.y }];
    const startPositions = new Map(members.map((member) => [member.id, member]));

    const validDrop = !cancelled && containsPoint(bedRef.current, event.clientX, event.clientY);
    if (!validDrop) {
      setFineParticles((current) => current.map((item) => {
        const start = startPositions.get(item.id);
        return start ? { ...item, x: start.x, y: start.y } : item;
      }));
      fineParticles.forEach((item) => {
        const start = startPositions.get(item.id);
        const node = workspaceRef.current?.querySelector<HTMLElement>(`#${item.id}`);
        if (!start || !node) return;
        gsap.fromTo(node, { x: item.x - start.x, y: item.y - start.y }, {
          x: 0, y: 0, duration: 0.34, ease: 'back.out(1.35)', onComplete: () => gsap.set(node, { clearProps: 'transform' }),
        });
      });
      return;
    }

    const allPlaced = fineParticles.every((item) => item.placed);
    const columns = window.innerWidth < 768 ? 3 : 6;
    const rows = Math.ceil(fineParticles.length / columns);
    const cellWidth = (bedRect.width - 20) / columns;
    const cellHeight = (bedRect.height - 24) / rows;
    const targets = new Map(fineParticles.map((item, index) => {
      if (allPlaced) {
        return [item.id, {
          x: clamp(item.x, bedRect.left - stageRect.left + 8, bedRect.right - stageRect.left - item.size - 8),
          y: clamp(item.y, bedRect.top - stageRect.top + 8, bedRect.bottom - stageRect.top - item.size - 8),
        }] as const;
      }
      const column = index % columns;
      const row = Math.floor(index / columns);
      return [item.id, {
        x: bedRect.left - stageRect.left + 10 + column * cellWidth + (cellWidth - item.size) / 2,
        y: bedRect.top - stageRect.top + 12 + row * cellHeight + (cellHeight - item.size) / 2,
      }] as const;
    }));
    const nextParticles = fineParticles.map((item) => ({ ...item, ...(targets.get(item.id) ?? {}), placed: true }));
    setFineParticles(nextParticles);
    const nextPlacedCount = nextParticles.filter((item) => item.placed).length;
    setSinteringState((current) => ({
      ...current,
      particlesPlaced: nextPlacedCount,
    }));
    fineParticles.forEach((item, index) => {
      const target = targets.get(item.id);
      const node = workspaceRef.current?.querySelector<HTMLElement>(`#${item.id}`);
      if (!target || !node) return;
      gsap.fromTo(node, { x: item.x - target.x, y: item.y - target.y, scale: 1.06 }, {
        x: 0, y: 0, scale: 1, duration: 0.38, delay: index * 0.018, ease: 'back.out(1.4)',
        onComplete: () => gsap.set(node, { clearProps: 'transform' }),
      });
    });
  };

  const startSintering = () => {
    const bedRect = bedRef.current?.getBoundingClientRect();
    const stageRect = workspaceRef.current?.getBoundingClientRect();
    if (!trayReady || !bedRect || !stageRect) return;

    const agglomerates = createAgglomerates(bedRect, stageRect);
    setSinteringState((current) => ({
      ...current,
      sinteringStarted: true,
      sinteringProgress: 0,
      agglomerates,
    }));
  };

  const handleAgglomeratePointerDown = (agglomerate: AgglomerateState, event: ReactPointerEvent<HTMLDivElement>) => {
    if (!sinteringState.transformationComplete) return;
    agglomerateDragRef.current = {
      id: agglomerate.id,
      pointerX: event.clientX,
      pointerY: event.clientY,
      x: agglomerate.x,
      y: agglomerate.y,
      placed: true,
      members: sinteringState.agglomerates.map(({ id, x, y }) => ({ id, x, y })),
    };
    setActiveAgglomerate('group');
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handleAgglomeratePointerMove = (id: string, event: ReactPointerEvent<HTMLDivElement>) => {
    const drag = agglomerateDragRef.current;
    const stage = workspaceRef.current?.getBoundingClientRect();
    if (!drag || drag.id !== id || !stage) return;
    const deltaX = event.clientX - drag.pointerX;
    const deltaY = event.clientY - drag.pointerY;
    const startPositions = new Map((drag.members ?? []).map((member) => [member.id, member]));
    setSinteringState((current) => ({
      ...current,
      agglomerates: current.agglomerates.map((item) => {
        const start = startPositions.get(item.id);
        return start ? {
          ...item,
          x: clamp(start.x + deltaX, 0, stage.width - item.size),
          y: clamp(start.y + deltaY, 0, stage.height - item.size),
        } : item;
      }),
    }));
  };

  const finishAgglomerateDrag = (id: string) => {
    if (agglomerateDragRef.current?.id === id) agglomerateDragRef.current = null;
    setActiveAgglomerate(null);
  };

  const answerObservation = (answer: string) => {
    setSelectedAnswer(answer);
    if (answer === sinteringLab.correctAnswer) {
      setSinteringState((current) => ({ ...current, completed: true }));
      completeStage('sintering');
      discoverObservation(sinteringLab.explanation);
    }
  };

  const feedLabel = sinteringState.transformationComplete ? 'AGGLOMERATED PRODUCT' : 'FINE ORE';

  return (
    <div className="min-h-[calc(100vh-86px)] bg-paper px-4 py-5">
      <div className="mx-auto grid max-w-7xl gap-4 xl:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="laboratory-panel p-5">
          <p className="eyebrow">Experiment</p>
          <h1 className="mt-3 text-3xl font-semibold text-ink">Sintering</h1>
          {session.oreIdentified && session.oreName && <p className="mt-1 text-sm text-slate-600">Processing {session.oreName} · {session.oreFormula}</p>}
          <div className="sintering-source-record" role="note">
            <p className="eyebrow">Source chemistry</p>
            <p><strong>Reported change:</strong> {sinteringLab.observedChange}</p>
            <p><strong>Equation:</strong> {sinteringLab.equationStatus}</p>
            <p>{sinteringLab.sourceStatus}</p>
          </div>
          <SinteringProgress
            particlesPlaced={placedCount}
            particleTotal={FINE_PARTICLE_TOTAL}
            sinteringStarted={sinteringState.sinteringStarted}
            transformationComplete={sinteringState.transformationComplete}
            completed={sinteringState.completed}
          />
          {sinteringState.transformationComplete && <div className="experiment-complete mt-4">EXPERIMENT COMPLETE ✓</div>}
        </aside>

        <main className="laboratory-panel relative overflow-hidden px-3 py-4 sm:px-4">
          <div ref={workspaceRef} className={`workspace-area sintering-workspace${heating ? ' is-heating' : ''}`}>
            <div className="sintering-feed-label">
              <span>{feedLabel}</span>
              {!sinteringState.transformationComplete && <small>{FINE_PARTICLE_TOTAL - placedCount} remaining</small>}
            </div>

            <SinteringTray
              ref={trayRef}
              bedRef={bedRef}
              ready={trayReady}
              heating={heating}
              progress={sinteringState.sinteringProgress}
              placedCount={placedCount}
              totalCount={FINE_PARTICLE_TOTAL}
              isDropTarget={isTrayDropTarget}
            />

            {fineParticles.map((particle) => (
              <FineOreParticle
                key={particle.id}
                ref={(node) => {
                  if (node && sinteringState.sinteringStarted) node.dataset.fineId = particle.id;
                }}
                id={particle.id}
                x={particle.x}
                y={particle.y}
                size={particle.size}
                rotation={particle.rotation}
                placed={particle.placed}
                dragging={activeFineParticle === 'group'}
                disabled={sinteringState.sinteringStarted}
                onPointerDown={(event) => handleFinePointerDown(particle, event)}
                onPointerMove={(event) => handleFinePointerMove(particle.id, event)}
                onPointerUp={(event) => finishFineDrag(particle.id, event)}
                onPointerCancel={(event) => finishFineDrag(particle.id, event, true)}
              />
            ))}

            {sinteringState.agglomerates.map((agglomerate) => (
              <Agglomerate
                key={agglomerate.id}
                agglomerate={agglomerate}
                dragging={activeAgglomerate === 'group'}
                visible={sinteringState.transformationComplete}
                onPointerDown={(event) => handleAgglomeratePointerDown(agglomerate, event)}
                onPointerMove={(event) => handleAgglomeratePointerMove(agglomerate.id, event)}
                onPointerUp={() => finishAgglomerateDrag(agglomerate.id)}
                onPointerCancel={() => finishAgglomerateDrag(agglomerate.id)}
              />
            ))}

            <HeatingControl
              active={heating}
              enabled={trayReady}
              complete={sinteringState.transformationComplete}
              onStart={startSintering}
            />

            {sinteringState.transformationComplete && (
              <div className="sintering-comparison" aria-label="Before and after sintering comparison">
                <div className="comparison-material">
                  <span className="eyebrow">Before</span>
                  <div className="comparison-fine-particles">
                    {Array.from({ length: FINE_PARTICLE_TOTAL }, (_, index) => <span key={index} />)}
                  </div>
                  <small>Fine particles</small>
                </div>
                <div className="comparison-arrow" aria-hidden="true">→</div>
                <div className="comparison-material">
                  <span className="eyebrow">After</span>
                  <div className="comparison-agglomerates">
                    {sinteringState.agglomerates.map((item) => <span key={item.id} />)}
                  </div>
                  <small>Larger agglomerated pieces</small>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {sinteringState.transformationComplete && (
        <div ref={observationRef} className="observation-handoff">
          <SinteringObservation
            selectedAnswer={selectedAnswer}
            completed={sinteringState.completed}
            onSelect={answerObservation}
          />
        </div>
      )}

      {sinteringState.completed && (
        <div ref={continueRef} className="continue-handoff mx-auto mt-4 max-w-7xl text-right">
          <Link to="/concentration" onClick={() => setCurrentStage('concentration')} className="primary-button">
            Continue to Concentration
          </Link>
        </div>
      )}
    </div>
  );
}
