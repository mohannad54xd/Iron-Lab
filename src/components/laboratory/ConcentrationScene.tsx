import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import type { PointerEvent as ReactPointerEvent } from 'react';
import { Link } from 'react-router-dom';
import { concentrationLab, separationMethods } from '../../data/concentration';
import type { CollectionTarget, ConcentrationState, MaterialType, Particle, SeparationMethod } from '../../types/concentration';
import { useIronLabSession } from '../../state/IronLabSession';
import { CollectionTray } from './CollectionTray';
import { ConcentrationObservation } from './ConcentrationObservation';
import { ConcentrationProgress } from './ConcentrationProgress';
import { ElectricSeparator } from './ElectricSeparator';
import { MagneticSeparator } from './MagneticSeparator';
import { MaterialParticle } from './MaterialParticle';
import { MixtureTray } from './MixtureTray';
import { SeparationResult } from './SeparationResult';
import { SeparationSelector } from './SeparationSelector';
import { SurfaceTensionSeparator } from './SurfaceTensionSeparator';
import { useContinueHandoff, useObservationHandoff } from '../../hooks/useObservationHandoff';
import { useLabAudio } from '../../audio/LabAudio';

const MIXTURE_TYPES: MaterialType[] = [
  'ore', 'impurity', 'ore', 'impurity', 'impurity', 'ore',
  'impurity', 'ore', 'ore', 'impurity', 'ore', 'impurity',
  'ore', 'impurity', 'ore', 'impurity', 'ore', 'impurity',
  'impurity', 'ore', 'impurity', 'ore', 'ore', 'impurity',
];

type DragStart = {
  id: string;
  pointerX: number;
  pointerY: number;
  x: number;
  y: number;
  offsetX?: number;
  offsetY?: number;
};

type Position = { x: number; y: number };

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function containsPoint(element: HTMLElement | null, x: number, y: number) {
  if (!element) return false;
  const rect = element.getBoundingClientRect();
  return x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
}

function createMixture(stageRect: DOMRect, trayRect: DOMRect): Particle[] {
  const columns = window.innerWidth < 768 ? 4 : 6;
  const rows = Math.ceil(MIXTURE_TYPES.length / columns);
  const cellWidth = (trayRect.width - 40) / columns;
  const cellHeight = (trayRect.height - 72) / rows;

  return MIXTURE_TYPES.map((materialType, index) => {
    const size = 19 + ((index * 7) % 10);
    const column = index % columns;
    const row = Math.floor(index / columns);
    const responseByMethod = Object.fromEntries(
      separationMethods.map((method) => [method.id, method.modelCaptureMaterial === materialType]),
    ) as Particle['responseByMethod'];

    return {
      id: `sample-particle-${index + 1}`,
      x: trayRect.left - stageRect.left + 20 + column * cellWidth + (cellWidth - size) / 2 + (Math.random() - 0.5) * 8,
      y: trayRect.top - stageRect.top + 38 + row * cellHeight + (cellHeight - size) / 2 + (Math.random() - 0.5) * 8,
      size,
      rotation: Math.round(Math.random() * 50 - 25),
      materialType,
      mass: null,
      responseByMethod,
      phase: 'mixture',
    };
  });
}

export function ConcentrationScene() {
  const { session, setCurrentStage, completeStage, discoverObservation } = useIronLabSession();
  const { playSound } = useLabAudio();
  const workspaceRef = useRef<HTMLDivElement | null>(null);
  const mixtureTrayRef = useRef<HTMLDivElement | null>(null);
  const concentrateTrayRef = useRef<HTMLDivElement | null>(null);
  const impurityTrayRef = useRef<HTMLDivElement | null>(null);
  const observationRef = useRef<HTMLDivElement | null>(null);
  const continueRef = useRef<HTMLDivElement | null>(null);
  const toolRef = useRef<HTMLDivElement | null>(null);
  const toolDragRef = useRef<DragStart | null>(null);
  const particleDragRef = useRef<DragStart | null>(null);
  const attachedParticleIdsRef = useRef<string[]>([]);
  const hasStartedRef = useRef(false);

  const [concentrationState, setConcentrationState] = useState<ConcentrationState>({
    mixture: [],
    selectedMethod: null,
    separationStarted: false,
    separatedParticles: [],
    concentrateParticles: [],
    impurityParticles: [],
    separationComplete: false,
    observationAnswered: false,
    completed: false,
    selectedAnswer: null,
  });
  const [toolPosition, setToolPosition] = useState<Position>({ x: 80, y: 440 });
  const [draggingTool, setDraggingTool] = useState(false);
  const [draggingParticleId, setDraggingParticleId] = useState<string | null>(null);
  const [concentrateHighlighted, setConcentrateHighlighted] = useState(false);
  const [impurityHighlighted, setImpurityHighlighted] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const { mixture, selectedMethod, separationStarted, separatedParticles, concentrateParticles, impurityParticles } = concentrationState;
  const remainingParticles = mixture.filter((particle) => particle.phase === 'mixture').length;

  useObservationHandoff(concentrationState.separationComplete, observationRef);
  useContinueHandoff(concentrationState.completed, continueRef);

  useEffect(() => {
    setCurrentStage('concentration');
  }, [setCurrentStage]);

  useEffect(() => {
    const loadMixture = () => {
      const stageRect = workspaceRef.current?.getBoundingClientRect();
      const trayRect = mixtureTrayRef.current?.getBoundingClientRect();
      if (!stageRect || !trayRect || hasStartedRef.current) return;
      setConcentrationState((current) => ({ ...current, mixture: createMixture(stageRect, trayRect) }));
    };

    loadMixture();
    window.addEventListener('resize', loadMixture);
    return () => window.removeEventListener('resize', loadMixture);
  }, []);

  const handleSelectMethod = (method: SeparationMethod) => {
    if (separationStarted) return;
    const stage = workspaceRef.current?.getBoundingClientRect();
    const tray = mixtureTrayRef.current?.getBoundingClientRect();
    if (!stage || !tray) return;

    hasStartedRef.current = true;
    setStatusMessage(null);
    setConcentrationState((current) => ({ ...current, selectedMethod: method }));
    setToolPosition({
      x: tray.left - stage.left + tray.width * 0.4,
      y: tray.bottom - stage.top + 12,
    });
  };

  const handleToolPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!selectedMethod || concentrationState.separationComplete) return;
    hasStartedRef.current = true;
    const stage = workspaceRef.current?.getBoundingClientRect();
    if (!stage) return;
    if (selectedMethod) {
      const separatorSound = selectedMethod.id === 'magnetic'
        ? 'separator-magnetic'
        : selectedMethod.id === 'electric'
          ? 'separator-electric'
          : 'separator-surface';
      playSound(separatorSound);
    }
    const rect = event.currentTarget.getBoundingClientRect();
    toolDragRef.current = {
      id: 'separator',
      pointerX: event.clientX,
      pointerY: event.clientY,
      x: toolPosition.x,
      y: toolPosition.y,
      offsetX: event.clientX - rect.left,
      offsetY: event.clientY - rect.top,
    };
    setDraggingTool(true);
    setConcentrationState((current) => ({ ...current, separationStarted: true }));
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handleToolPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const drag = toolDragRef.current;
    const stage = workspaceRef.current?.getBoundingClientRect();
    const method = concentrationState.selectedMethod;
    if (!drag || !stage || !method) return;

    const nextToolPosition = {
      x: clamp(event.clientX - stage.left - (drag.offsetX ?? 60), 0, stage.width - 132),
      y: clamp(event.clientY - stage.top - (drag.offsetY ?? 40), 0, stage.height - 96),
    };
    setToolPosition(nextToolPosition);
    setConcentrateHighlighted(containsPoint(concentrateTrayRef.current, event.clientX, event.clientY));
    setImpurityHighlighted(containsPoint(impurityTrayRef.current, event.clientX, event.clientY));

    const sample = mixtureTrayRef.current?.getBoundingClientRect();
    const toolCenter = { x: nextToolPosition.x + 62, y: nextToolPosition.y + 42 };
    const inSample = Boolean(sample && event.clientX >= sample.left && event.clientX <= sample.right && event.clientY >= sample.top && event.clientY <= sample.bottom);
    const candidates = inSample
      ? mixture.filter((particle) =>
          particle.phase === 'mixture' &&
          particle.responseByMethod[method.id] &&
          Math.hypot(particle.x + particle.size / 2 - toolCenter.x, particle.y + particle.size / 2 - toolCenter.y) < method.captureRadius,
        )
      : [];
    const newlyAttached = candidates.filter((particle) => !attachedParticleIdsRef.current.includes(particle.id));
    if (newlyAttached.length > 0) {
      attachedParticleIdsRef.current = [...attachedParticleIdsRef.current, ...newlyAttached.map((particle) => particle.id)];
    }

    const attachedIds = attachedParticleIdsRef.current;
    if (attachedIds.length === 0) return;
    const positions = new Map(attachedIds.map((id, index) => {
      const xOffset = method.motion === 'skim' ? 25 + (index % 4) * 17 : 31 + (index % 4) * 18;
      const yOffset = method.motion === 'skim' ? -12 + Math.floor(index / 4) * 14 : 48 + Math.floor(index / 4) * 16;
      return [id, {
        x: clamp(nextToolPosition.x + xOffset, 0, stage.width - 30),
        y: clamp(nextToolPosition.y + yOffset, 0, stage.height - 30),
      }] as const;
    }));
    setConcentrationState((current) => ({
      ...current,
      mixture: current.mixture.map((particle) => {
        const position = positions.get(particle.id);
        return position ? { ...particle, ...position, phase: 'attached' } : particle;
      }),
    }));

    newlyAttached.forEach((particle, index) => {
      const target = positions.get(particle.id);
      const element = workspaceRef.current?.querySelector<HTMLElement>(`#${particle.id}`);
      if (!target || !element) return;
      const duration = method.motion === 'skim' ? 0.36 : 0.25;
      gsap.fromTo(element, { x: particle.x - target.x, y: particle.y - target.y, scale: 0.82 }, {
        x: 0, y: 0, scale: 0.84, duration, delay: index * 0.018, ease: 'power2.out',
        onComplete: () => gsap.set(element, { clearProps: 'transform' }),
      });
    });
  };

  const collectionRef = (target: CollectionTarget) => target === 'concentrate' ? concentrateTrayRef.current : impurityTrayRef.current;

  const depositParticles = (ids: string[], target: CollectionTarget) => {
    if (ids.length === 0) return;
    playSound('particle-collection');
    const stage = workspaceRef.current?.getBoundingClientRect();
    if (!stage) return;

    const currentTargetIds = target === 'concentrate' ? concentrateParticles : impurityParticles;
    const columns = window.innerWidth < 768 ? 3 : 6;
    const nextImpurities = target === 'impurities' ? [...new Set([...impurityParticles, ...ids])] : impurityParticles;
    let nextConcentrate = target === 'concentrate' ? [...new Set([...concentrateParticles, ...ids])] : concentrateParticles;
    const totalImpurities = mixture.filter((particle) => particle.materialType === 'impurity').length;
    const totalOre = mixture.filter((particle) => particle.materialType === 'ore').length;
    const removeRemainingOre = target === 'impurities' && nextImpurities.length === totalImpurities;
    const removeRemainingImpurities = target === 'concentrate' && nextConcentrate.length === totalOre;
    const automaticOreIds = removeRemainingOre
      ? mixture.filter((particle) => particle.materialType === 'ore' && particle.phase !== 'concentrate' && !ids.includes(particle.id)).map((particle) => particle.id)
      : [];
    const automaticImpurityIds = removeRemainingImpurities
      ? mixture.filter((particle) => particle.materialType === 'impurity' && particle.phase !== 'impurities' && !ids.includes(particle.id)).map((particle) => particle.id)
      : [];
    const updates = new Map<string, { x: number; y: number; phase: CollectionTarget }>();

    const assignTraySlots = (particleIds: string[], destination: CollectionTarget, startSlot: number) => {
      const tray = collectionRef(destination)?.getBoundingClientRect();
      if (!tray) return;
      const cellWidth = (tray.width - 22) / columns;
      particleIds.forEach((id, index) => {
        const particle = mixture.find((item) => item.id === id);
        if (!particle) return;
        const slot = startSlot + index;
        updates.set(id, {
          x: tray.left - stage.left + 10 + (slot % columns) * cellWidth + (cellWidth - particle.size) / 2,
          y: tray.top - stage.top + 47 + Math.floor(slot / columns) * 31,
          phase: destination,
        });
      });
    };

    assignTraySlots(ids, target, currentTargetIds.length);
    assignTraySlots(automaticOreIds, 'concentrate', nextConcentrate.length);
    assignTraySlots(automaticImpurityIds, 'impurities', nextImpurities.length);

    const nextSeparated = [...new Set([...separatedParticles, ...ids, ...automaticOreIds, ...automaticImpurityIds])];
    if (automaticOreIds.length > 0) {
      nextConcentrate = [...new Set([...nextConcentrate, ...automaticOreIds])];
    }
    let finalImpurities = nextImpurities;
    if (automaticImpurityIds.length > 0) finalImpurities = [...new Set([...finalImpurities, ...automaticImpurityIds])];
    const automaticallyCollected = [...automaticOreIds, ...automaticImpurityIds];
    if (automaticallyCollected.length > 0) {
      attachedParticleIdsRef.current = attachedParticleIdsRef.current.filter((id) => !automaticallyCollected.includes(id));
    }

    setConcentrationState((current) => ({
      ...current,
      mixture: current.mixture.map((particle) => {
        const update = updates.get(particle.id);
        return update ? { ...particle, ...update } : particle;
      }),
      separatedParticles: nextSeparated,
      concentrateParticles: nextConcentrate,
      impurityParticles: finalImpurities,
      separationComplete: nextSeparated.length === current.mixture.length,
    }));

    [...ids, ...automaticOreIds, ...automaticImpurityIds].forEach((id, index) => {
      const particle = mixture.find((item) => item.id === id);
      const destination = updates.get(id);
      const element = workspaceRef.current?.querySelector<HTMLElement>(`#${id}`);
      if (!particle || !destination || !element) return;
      const autoIndex = automaticallyCollected.indexOf(id);
      const delay = autoIndex >= 0 ? 0.38 + autoIndex * 0.035 : index * 0.035;
      gsap.fromTo(element, { x: particle.x - destination.x, y: particle.y - destination.y, scale: 1.08 }, {
        x: 0, y: 0, scale: 1, duration: 0.5, delay, ease: 'power2.out',
        onComplete: () => gsap.set(element, { clearProps: 'transform' }),
      });
    });
    setStatusMessage(automaticOreIds.length > 0
      ? 'Impurities removed; remaining ore collected in CONCENTRATE.'
      : automaticImpurityIds.length > 0
        ? 'Concentrate collected; remaining impurities moved to REMOVED IMPURITIES.'
        : null);
  };

  const finishToolDrag = (event: ReactPointerEvent<HTMLDivElement>, cancelled = false) => {
    toolDragRef.current = null;
    setDraggingTool(false);
    setConcentrateHighlighted(false);
    setImpurityHighlighted(false);
    const method = concentrationState.selectedMethod;
    if (cancelled || !method || attachedParticleIdsRef.current.length === 0) return;

    const ids = [...attachedParticleIdsRef.current];
    if (containsPoint(collectionRef(method.collectionTarget), event.clientX, event.clientY)) {
      attachedParticleIdsRef.current = [];
      depositParticles(ids, method.collectionTarget);
    } else {
      setStatusMessage(`Carry the attached particles to ${method.collectionTarget === 'concentrate' ? 'CONCENTRATE' : 'REMOVED IMPURITIES'}.`);
    }
  };

  const handleParticlePointerDown = (particle: Particle, event: ReactPointerEvent<HTMLDivElement>) => {
    if (particle.phase !== 'mixture' || concentrationState.separationComplete) return;
    particleDragRef.current = { id: particle.id, pointerX: event.clientX, pointerY: event.clientY, x: particle.x, y: particle.y };
    setDraggingParticleId(particle.id);
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handleParticlePointerMove = (id: string, event: ReactPointerEvent<HTMLDivElement>) => {
    const drag = particleDragRef.current;
    const stage = workspaceRef.current?.getBoundingClientRect();
    if (!drag || drag.id !== id || !stage) return;
    setConcentrationState((current) => ({
      ...current,
      mixture: current.mixture.map((particle) => particle.id === id ? {
        ...particle,
        x: clamp(drag.x + event.clientX - drag.pointerX, 0, stage.width - particle.size),
        y: clamp(drag.y + event.clientY - drag.pointerY, 0, stage.height - particle.size),
      } : particle),
    }));
    setConcentrateHighlighted(containsPoint(concentrateTrayRef.current, event.clientX, event.clientY));
    setImpurityHighlighted(containsPoint(impurityTrayRef.current, event.clientX, event.clientY));
  };

  const finishParticleDrag = (id: string, event: ReactPointerEvent<HTMLDivElement>, cancelled = false) => {
    const drag = particleDragRef.current;
    const element = event.currentTarget;
    particleDragRef.current = null;
    setDraggingParticleId(null);
    setConcentrateHighlighted(false);
    setImpurityHighlighted(false);
    if (!drag || drag.id !== id) return;
    const particle = mixture.find((item) => item.id === id);
    if (!particle) return;

    const target = !cancelled && containsPoint(concentrateTrayRef.current, event.clientX, event.clientY) ? 'concentrate'
      : !cancelled && containsPoint(impurityTrayRef.current, event.clientX, event.clientY) ? 'impurities'
        : null;
    if (target) {
      if (!separationStarted) {
        setStatusMessage('Operate the selected separator before collecting particles.');
        target === 'concentrate' ? setConcentrateHighlighted(false) : setImpurityHighlighted(false);
      } else {
        const expected = particle.materialType === 'ore' ? 'concentrate' : 'impurities';
        if (target !== expected) {
          setConcentrationState((current) => ({ ...current, mixture: current.mixture.map((item) => item.id === id ? { ...item, x: drag.x, y: drag.y } : item) }));
          gsap.fromTo(element, { x: particle.x - drag.x, y: particle.y - drag.y }, { x: 0, y: 0, duration: 0.32, ease: 'back.out(1.3)', onComplete: () => gsap.set(element, { clearProps: 'transform' }) });
          setStatusMessage('Try the other collection tray.');
          return;
        }
        depositParticles([id], target);
        return;
      }
    }

    const inMixture = containsPoint(mixtureTrayRef.current, event.clientX, event.clientY);
    if (!cancelled && inMixture) return;
    setConcentrationState((current) => ({ ...current, mixture: current.mixture.map((item) => item.id === id ? { ...item, x: drag.x, y: drag.y } : item) }));
    gsap.fromTo(element, { x: particle.x - drag.x, y: particle.y - drag.y, rotation: particle.rotation + 5 }, {
      x: 0, y: 0, rotation: particle.rotation, duration: 0.36, ease: 'back.out(1.35)',
      onComplete: () => gsap.set(element, { clearProps: 'transform' }),
    });
  };

  const updateObservation = (answer: string) => {
    if (answer === concentrationLab.correctAnswer) {
      completeStage('concentration');
      discoverObservation(concentrationLab.explanation);
    }
    setConcentrationState((current) => ({
      ...current,
      observationAnswered: true,
      selectedAnswer: answer,
      completed: answer === concentrationLab.correctAnswer,
    }));
  };

  const toolProps = {
    x: toolPosition.x,
    y: toolPosition.y,
    attachedCount: attachedParticleIdsRef.current.length,
    dragging: draggingTool,
    onPointerDown: handleToolPointerDown,
    onPointerMove: handleToolPointerMove,
    onPointerUp: (event: ReactPointerEvent<HTMLDivElement>) => finishToolDrag(event),
    onPointerCancel: (event: ReactPointerEvent<HTMLDivElement>) => finishToolDrag(event, true),
  };

  return (
    <div className="min-h-[calc(100vh-86px)] bg-paper px-4 py-5">
      <div className="mx-auto grid max-w-7xl gap-4 xl:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="laboratory-panel p-5">
          <p className="eyebrow">Experiment</p>
          <h1 className="mt-3 text-3xl font-semibold text-ink">Concentration</h1>
          {session.oreIdentified && session.oreName && (
            <p className="mt-1 text-sm text-slate-600">ORE: {session.oreName} · {session.oreFormula}</p>
          )}
          <p className="mt-5 text-sm leading-6 text-slate-700">{concentrationLab.problem}</p>
          <ConcentrationProgress
            methodSelected={selectedMethod !== null}
            separationStarted={separationStarted}
            separatedCount={separatedParticles.length}
            totalCount={mixture.length}
            complete={concentrationState.separationComplete}
          />
          {statusMessage && <p className="mt-4 text-sm text-oxide" role="status">{statusMessage}</p>}
          {concentrationState.separationComplete && <div className="experiment-complete mt-4">EXPERIMENT COMPLETE ✓</div>}
        </aside>

        <main className="laboratory-panel relative overflow-hidden px-3 py-4 sm:px-4">
          <div ref={workspaceRef} className="workspace-area concentration-workspace">
            <p className="concentration-instruction">{selectedMethod ? 'Operate the selected separator across the sample.' : 'Inspect the sample, then select an apparatus.'}</p>

            <MixtureTray ref={mixtureTrayRef} remaining={remainingParticles} active={draggingTool} />
            <CollectionTray ref={concentrateTrayRef} target="concentrate" count={concentrateParticles.length} visible={separationStarted} highlighted={concentrateHighlighted} />
            <CollectionTray ref={impurityTrayRef} target="impurities" count={impurityParticles.length} visible={separationStarted} highlighted={impurityHighlighted} />

            {mixture.map((particle) => (
              <MaterialParticle
                key={particle.id}
                ref={(node) => { if (node) node.dataset.materialParticle = particle.id; }}
                particle={particle}
                dragging={draggingParticleId === particle.id}
                onPointerDown={(event) => handleParticlePointerDown(particle, event)}
                onPointerMove={(event) => handleParticlePointerMove(particle.id, event)}
                onPointerUp={(event) => finishParticleDrag(particle.id, event)}
                onPointerCancel={(event) => finishParticleDrag(particle.id, event, true)}
              />
            ))}

            {selectedMethod && (
              <>
                {selectedMethod.id === 'magnetic' && <MagneticSeparator ref={toolRef} {...toolProps} />}
                {selectedMethod.id === 'electric' && <ElectricSeparator ref={toolRef} {...toolProps} />}
                {selectedMethod.id === 'surface-tension' && <SurfaceTensionSeparator ref={toolRef} {...toolProps} />}
              </>
            )}

            {concentrationState.separationComplete && <SeparationResult oreCount={concentrateParticles.length} impurityCount={impurityParticles.length} />}

            <SeparationSelector
              methods={separationMethods}
              selectedMethod={selectedMethod?.id ?? null}
              disabled={separationStarted}
              onSelect={handleSelectMethod}
            />
            {selectedMethod && !concentrationState.separationComplete && <p className="separation-model-note">{selectedMethod.separationRule} The source does not assign a specific particle response to this method; this is an educational model.</p>}
          </div>
        </main>
      </div>

      {concentrationState.separationComplete && (
        <div ref={observationRef} className="observation-handoff">
          <ConcentrationObservation
            selectedAnswer={concentrationState.selectedAnswer}
            completed={concentrationState.completed}
            onSelect={updateObservation}
            sourceRelationships={concentrationLab.sourceRelationships}
          />
        </div>
      )}

      {concentrationState.completed && (
        <div ref={continueRef} className="continue-handoff mx-auto mt-4 max-w-7xl text-right">
          <Link to="/roasting" onClick={() => setCurrentStage('roasting')} className="primary-button">
            Continue to Roasting
          </Link>
        </div>
      )}
    </div>
  );
}
