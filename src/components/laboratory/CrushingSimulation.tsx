import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import type { PointerEvent as ReactPointerEvent } from 'react';
import { Link } from 'react-router-dom';
import { crushingLab } from '../../data/extraction';
import { useIronLabSession } from '../../state/IronLabSession';
import type { Particle } from '../../types/crushing';
import { Crusher } from './Crusher';
import { ObservationPanel } from './ObservationPanel';
import { OreSpecimen } from './OreSpecimen';
import { VirtualScale } from './VirtualScale';
import { useContinueHandoff, useObservationHandoff } from '../../hooks/useObservationHandoff';
import { useLabAudio } from '../../audio/LabAudio';

const ORIGINAL_MASS = crushingLab.beforeMass;
const PARTICLE_MASS_WEIGHTS = [24, 28, 32, 36, 40, 26, 30, 34];

type Position = { x: number; y: number };
type DragStart = Position & { pointerX: number; pointerY: number };
type ParticleDragStart = DragStart & {
  id: string;
  members: Array<{ id: string; x: number; y: number }>;
};

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

function isPointOnElement(x: number, y: number, element: HTMLElement | null) {
  if (!element) return false;
  const rect = element.getBoundingClientRect();
  return x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
}

function overlaps(a: DOMRect, b: DOMRect) {
  return a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
}

function makeParticles(area: DOMRect, stage: DOMRect, origin: Position, totalMass: number): Particle[] {
  const columns = window.innerWidth < 768 ? 1 : 4;
  const rows = Math.ceil(PARTICLE_MASS_WEIGHTS.length / columns);
  const left = area.left - stage.left + 12;
  const top = area.top - stage.top + 28;
  const usableWidth = Math.max(36, area.width - 24);
  const usableHeight = Math.max(80, area.height - 42);
  const cellWidth = usableWidth / columns;
  const cellHeight = usableHeight / rows;
  const weightTotal = PARTICLE_MASS_WEIGHTS.reduce((total, weight) => total + weight, 0);
  const masses = PARTICLE_MASS_WEIGHTS.map((weight) => Number((totalMass * weight / weightTotal).toFixed(3)));
  const roundingError = Number((totalMass - masses.reduce((total, mass) => total + mass, 0)).toFixed(3));
  masses[masses.length - 1] = Number((masses[masses.length - 1] + roundingError).toFixed(3));

  return masses.map((mass, index) => {
    const size = 18 + ((index * 7) % 13);
    const column = index % columns;
    const row = Math.floor(index / columns);
    const jitterX = (Math.random() - 0.5) * Math.min(10, Math.max(0, cellWidth - size - 6));
    const jitterY = (Math.random() - 0.5) * Math.min(12, Math.max(0, cellHeight - size - 6));
    const x = clamp(left + column * cellWidth + (cellWidth - size) / 2 + jitterX, left, left + usableWidth - size);
    const y = clamp(top + row * cellHeight + (cellHeight - size) / 2 + jitterY, top, top + usableHeight - size);

    return {
      id: `ore-piece-${index + 1}`,
      x,
      y,
      size,
      mass,
      rotation: Math.round(Math.random() * 70 - 35),
      flightX: origin.x,
      flightY: origin.y,
      collected: false,
    };
  });
}

export function CrushingSimulation() {
  const { session, setCurrentStage, completeStage, discoverObservation } = useIronLabSession();
  const { playSound } = useLabAudio();
  const workspaceRef = useRef<HTMLDivElement | null>(null);
  const collectionAreaRef = useRef<HTMLDivElement | null>(null);
  const comparisonRef = useRef<HTMLDivElement | null>(null);
  const observationRef = useRef<HTMLDivElement | null>(null);
  const continueRef = useRef<HTMLDivElement | null>(null);
  const scaleRef = useRef<HTMLDivElement | null>(null);
  const trayRef = useRef<HTMLDivElement | null>(null);
  const oreRef = useRef<HTMLDivElement | null>(null);
  const crusherRef = useRef<HTMLDivElement | null>(null);
  const massCounterRef = useRef({ value: 0 });
  const massTweenRef = useRef<gsap.core.Tween | null>(null);
  const oreDragRef = useRef<DragStart | null>(null);
  const crusherDragRef = useRef<DragStart | null>(null);
  const particleDragRef = useRef<ParticleDragStart | null>(null);
  const comparisonDelayRef = useRef<gsap.core.Tween | null>(null);
  const impactOriginRef = useRef<Position>({ x: 0, y: 0 });
  const hasStartedRef = useRef(false);

  const [originalMass, setOriginalMass] = useState(ORIGINAL_MASS);
  const [orePosition, setOrePosition] = useState<Position>({ x: 220, y: 300 });
  const [crusherPosition, setCrusherPosition] = useState<Position>({ x: 650, y: 450 });
  const [isOreWeighed, setIsOreWeighed] = useState(false);
  const [measuredBeforeMass, setMeasuredBeforeMass] = useState<number | null>(null);
  const [isCrushing, setIsCrushing] = useState(false);
  const [isCrushed, setIsCrushed] = useState(false);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [collectedParticleIds, setCollectedParticleIds] = useState<string[]>([]);
  const [crushedMass, setCrushedMass] = useState(0);
  const [currentMass, setCurrentMass] = useState(0);
  const [areParticlesWeighed, setAreParticlesWeighed] = useState(false);
  const [showComparison, setShowComparison] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [completed, setCompleted] = useState(false);
  const [isOreDragging, setIsOreDragging] = useState(false);
  const [isCrusherDragging, setIsCrusherDragging] = useState(false);
  const [draggingParticleId, setDraggingParticleId] = useState<string | null>(null);
  const [isScaleDropTarget, setIsScaleDropTarget] = useState(false);
  const [crusherNearOre, setCrusherNearOre] = useState(false);

  const totalParticleMass = particles.reduce((total, particle) => total + particle.mass, 0);
  const oreName = session.oreName ?? 'Iron ore';
  const oreFormula = session.oreFormula;
  const scaleStatus = !isOreWeighed
    ? 'Place the ore on the scale'
    : isCrushing
      ? 'Crushing specimen...'
      : !isCrushed
        ? 'Measurement recorded'
            : `${collectedParticleIds.length} / ${particles.length} pieces weighed · ${crushedMass.toFixed(1)} g / ${originalMass.toFixed(1)} g`;

        useObservationHandoff(showComparison, observationRef, 0);
        useContinueHandoff(completed, continueRef);

  useEffect(() => {
    setCurrentStage('crushing');
  }, [setCurrentStage]);

  useEffect(() => {
    const placeEquipment = () => {
      const rect = workspaceRef.current?.getBoundingClientRect();
      if (!rect || hasStartedRef.current) return;

      if (window.innerWidth < 768) {
        setOrePosition({
          x: 10,
          y: clamp(rect.height - 260, 120, rect.height - 180),
        });
        setCrusherPosition({
          x: clamp(rect.width - 140, 0, rect.width - 136),
          y: clamp(rect.height - 190, 100, rect.height - 190),
        });
      } else {
        setOrePosition({
          x: clamp(rect.width * 0.22, 18, rect.width - 190),
          y: clamp(rect.height * 0.44, 190, rect.height - 180),
        });
        setCrusherPosition({
          x: clamp(rect.width * 0.66 - 68, 18, rect.width - 150),
          y: clamp(rect.height * 0.67 - 90, 140, rect.height - 190),
        });
      }
    };

    placeEquipment();
    window.addEventListener('resize', placeEquipment);
    return () => window.removeEventListener('resize', placeEquipment);
  }, []);

  useEffect(() => {
    if (!isCrushing || particles.length === 0) return;

    const stage = workspaceRef.current;
    const ore = oreRef.current;
    const crusher = crusherRef.current;
    if (!stage || !ore || !crusher) return;
    const impactRing = stage.querySelector<HTMLElement>('.impact-ring');
    const impactSparks = stage.querySelectorAll<HTMLElement>('.impact-spark');

    const timeline = gsap.timeline({
      onComplete: () => {
        gsap.set(stage, { clearProps: 'transform' });
        gsap.set(crusher, { clearProps: 'transform' });
        setIsCrushing(false);
        setIsCrushed(true);
        setCrusherNearOre(false);
      },
    });

    timeline
      .to(crusher, { y: 26, duration: 0.14, ease: 'power4.in' })
      .to(stage, { x: 5, duration: 0.045, repeat: 5, yoyo: true, ease: 'none' }, '<')
      .to(ore, { scale: 1.08, rotation: -3, duration: 0.13, ease: 'power2.out' }, '<')
      .to(crusher, { y: 0, duration: 0.22, ease: 'back.out(2)' })
      .to(ore.querySelector('.ore-fractures'), { opacity: 1, duration: 0.12 }, 0.12)
      .to(ore, { scale: 0.94, rotation: 2, duration: 0.18 }, 0.28)
      .to(ore, { opacity: 0, scale: 0.42, duration: 0.18, ease: 'power2.in' }, 0.52);

    if (impactRing) {
      timeline.fromTo(impactRing, { scale: 0.2, opacity: 0.8 }, { scale: 4.2, opacity: 0, duration: 0.42, ease: 'power2.out' }, 0.12);
    }

    impactSparks.forEach((spark, index) => {
      const angle = (Math.PI * 2 * index) / impactSparks.length;
      timeline.fromTo(spark, { x: 0, y: 0, scale: 0.4, opacity: 0.95 }, {
        x: Math.cos(angle) * 46,
        y: Math.sin(angle) * 34,
        scale: 0.1,
        opacity: 0,
        duration: 0.4,
        ease: 'power2.out',
      }, 0.12);
    });

    particles.forEach((particle, index) => {
      const element = stage.querySelector<HTMLElement>(`#${particle.id}`);
      if (!element) return;

      timeline.fromTo(
        element,
        {
          x: (particle.flightX ?? impactOriginRef.current.x) - particle.x,
          y: (particle.flightY ?? impactOriginRef.current.y) - particle.y,
          opacity: 0,
          scale: 0.18,
          rotation: particle.rotation ?? 0,
        },
        {
          x: 0,
          y: 0,
          opacity: 1,
          scale: 1,
          rotation: particle.rotation ?? 0,
          duration: 0.66,
          ease: 'power3.out',
        },
        0.32 + index * 0.018,
      );
    });

    return () => {
      timeline.kill();
    };
  }, [isCrushing, particles]);

  useEffect(() => () => {
    massTweenRef.current?.kill();
    comparisonDelayRef.current?.kill();
  }, []);

  useEffect(() => {
    if (!showComparison || !comparisonRef.current) return;

    const context = gsap.context(() => {
      gsap.fromTo('.comparison-before-sample', { scale: 0.82, rotation: -5, opacity: 0 }, {
        scale: 1, rotation: 0, opacity: 1, duration: 0.55, ease: 'back.out(1.4)',
      });
      gsap.fromTo('.comparison-after-piece', { scale: 0.4, y: 10, opacity: 0 }, {
        scale: 1, y: 0, opacity: 1, duration: 0.4, stagger: 0.045, ease: 'back.out(1.6)', delay: 0.16,
      });
      gsap.fromTo('.comparison-connector', { scaleX: 0, opacity: 0, transformOrigin: 'left center' }, {
        scaleX: 1, opacity: 1, duration: 0.55, ease: 'power2.out', delay: 0.12,
      });
    }, comparisonRef);

    return () => context.revert();
  }, [showComparison]);

  const animateMass = (targetMass: number) => {
    massTweenRef.current?.kill();
    massTweenRef.current = gsap.to(massCounterRef.current, {
      value: targetMass,
      duration: 0.62,
      ease: 'power2.out',
      onUpdate: () => setCurrentMass(Math.round(massCounterRef.current.value * 10) / 10),
      onComplete: () => {
        massCounterRef.current.value = targetMass;
        setCurrentMass(targetMass);
      },
    });
  };

  const animateTray = (mass: number) => {
    if (!trayRef.current) return;
    const currentY = Number(gsap.getProperty(trayRef.current, 'y')) || 0;
    const pressureY = clamp((mass / originalMass) * 8, 0, 8);
    gsap.killTweensOf(trayRef.current);
    gsap.timeline()
      .fromTo(trayRef.current, { y: currentY }, { y: pressureY + 3, duration: 0.11, ease: 'power1.in' })
      .to(trayRef.current, { y: pressureY, duration: 0.32, ease: 'elastic.out(1, 0.62)' });
  };

  const positionOnTray = (width: number, height: number): Position => {
    const tray = trayRef.current?.getBoundingClientRect();
    const stage = workspaceRef.current?.getBoundingClientRect();
    if (!tray || !stage) return { x: 0, y: 0 };

    return {
      x: clamp(tray.left + tray.width / 2 - stage.left - width / 2, 0, stage.width - width),
      y: clamp(tray.top + tray.height / 2 - stage.top - height / 2, 0, stage.height - height),
    };
  };

  const animateToPosition = (element: HTMLElement, from: Position, to: Position) => {
    gsap.fromTo(
      element,
      { x: from.x - to.x, y: from.y - to.y, scale: 1.04, rotation: 3 },
      { x: 0, y: 0, scale: 1, rotation: 0, duration: 0.38, ease: 'back.out(1.5)', onComplete: () => gsap.set(element, { clearProps: 'transform' }) },
    );
  };

  const handleOrePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (isOreWeighed || isCrushing || isCrushed) return;
    hasStartedRef.current = true;
    oreDragRef.current = { pointerX: event.clientX, pointerY: event.clientY, ...orePosition };
    setIsOreDragging(true);
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handleOrePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!oreDragRef.current) return;
    const stage = workspaceRef.current?.getBoundingClientRect();
    if (!stage) return;

    setOrePosition({
      x: clamp(event.clientX - stage.left - 90, 0, stage.width - 180),
      y: clamp(event.clientY - stage.top - 85, 0, stage.height - 170),
    });
    setIsScaleDropTarget(isPointOnElement(event.clientX, event.clientY, trayRef.current));
  };

  const finishOreDrag = (event: ReactPointerEvent<HTMLDivElement>, cancelled = false) => {
    const drag = oreDragRef.current;
    const element = event.currentTarget;
    oreDragRef.current = null;
    setIsOreDragging(false);
    setIsScaleDropTarget(false);
    if (!drag) return;

    const from = orePosition;
    const accepted = !cancelled && isPointOnElement(event.clientX, event.clientY, trayRef.current);
    if (!accepted) {
      const target = { x: drag.x, y: drag.y };
      setOrePosition(target);
      gsap.fromTo(element, { x: from.x - target.x, y: from.y - target.y, rotation: -4 }, {
        x: 0, y: 0, rotation: 0, duration: 0.42, ease: 'back.out(1.45)',
        onComplete: () => gsap.set(element, { clearProps: 'transform' }),
      });
      return;
    }

    const target = positionOnTray(180, 170);
    setOrePosition(target);
    animateToPosition(element, from, target);
    setOriginalMass(ORIGINAL_MASS);
    setMeasuredBeforeMass(ORIGINAL_MASS);
    setIsOreWeighed(true);
    animateMass(ORIGINAL_MASS);
    animateTray(ORIGINAL_MASS);
  };

  const handleCrusherPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!isOreWeighed || isCrushing || isCrushed) return;
    hasStartedRef.current = true;
    crusherDragRef.current = { pointerX: event.clientX, pointerY: event.clientY, ...crusherPosition };
    setIsCrusherDragging(true);
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handleCrusherPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!crusherDragRef.current) return;
    const stage = workspaceRef.current?.getBoundingClientRect();
    if (!stage) return;

    setCrusherPosition({
      x: clamp(event.clientX - stage.left - 68, 0, stage.width - 136),
      y: clamp(event.clientY - stage.top - 90, 100, stage.height - 190),
    });

    const oreRect = oreRef.current?.getBoundingClientRect();
    setCrusherNearOre(Boolean(oreRect && Math.hypot(event.clientX - (oreRect.left + oreRect.width / 2), event.clientY - (oreRect.top + oreRect.height / 2)) < 150));
  };

  const finishCrusherDrag = (event: ReactPointerEvent<HTMLDivElement>, cancelled = false) => {
    const drag = crusherDragRef.current;
    const element = event.currentTarget;
    crusherDragRef.current = null;
    setIsCrusherDragging(false);
    setCrusherNearOre(false);
    if (!drag) return;

    const stage = workspaceRef.current?.getBoundingClientRect();
    const oreRect = oreRef.current?.getBoundingClientRect();
    if (!stage || !oreRect) return;

    const target = {
      x: clamp(event.clientX - stage.left - 68, 0, stage.width - 136),
      y: clamp(event.clientY - stage.top - 90, 100, stage.height - 190),
    };
    const toolRect = new DOMRect(stage.left + target.x, stage.top + target.y, element.offsetWidth, element.offsetHeight);
    setCrusherPosition(target);

    if (cancelled || !overlaps(toolRect, oreRect)) {
      setCrusherPosition({ x: drag.x, y: drag.y });
      gsap.fromTo(element, { x: target.x - drag.x, y: target.y - drag.y, rotation: 4 }, {
        x: 0, y: 0, rotation: 0, duration: 0.42, ease: 'back.out(1.45)',
        onComplete: () => gsap.set(element, { clearProps: 'transform' }),
      });
      return;
    }

    const workspace = workspaceRef.current;
    const collectionArea = collectionAreaRef.current?.getBoundingClientRect();
    if (!workspace || !collectionArea || !stage) return;
    playSound('crush-impact');
    impactOriginRef.current = { x: orePosition.x + 90, y: orePosition.y + 85 };
    setParticles(makeParticles(collectionArea, stage, impactOriginRef.current, originalMass));
    setCollectedParticleIds([]);
    setCrushedMass(0);
    setAreParticlesWeighed(false);
    setShowComparison(false);
    setIsCrushing(true);
    animateMass(0);
    animateTray(0);
  };

  const handleParticlePointerDown = (particle: Particle, event: ReactPointerEvent<HTMLDivElement>) => {
    if (!isCrushed || isCrushing || particle.collected) return;
    hasStartedRef.current = true;
    particleDragRef.current = {
      id: particle.id,
      pointerX: event.clientX,
      pointerY: event.clientY,
      x: particle.x,
      y: particle.y,
      members: particles.filter((item) => !item.collected).map(({ id, x, y }) => ({ id, x, y })),
    };
    setDraggingParticleId('group');
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handleParticlePointerMove = (particleId: string, event: ReactPointerEvent<HTMLDivElement>) => {
    const drag = particleDragRef.current;
    const stage = workspaceRef.current?.getBoundingClientRect();
    if (!drag || drag.id !== particleId || !stage) return;

    const deltaX = event.clientX - drag.pointerX;
    const deltaY = event.clientY - drag.pointerY;
    const heldParticle = particles.find((item) => item.id === drag.id);
    if (!heldParticle) return;
    const orderedIds = [drag.id, ...drag.members.map((member) => member.id).filter((id) => id !== drag.id)];
    const memberIndexes = new Map(orderedIds.map((id, index) => [id, index]));
    const centerX = drag.x + deltaX + heldParticle.size / 2;
    const centerY = drag.y + deltaY + heldParticle.size / 2;
    setParticles((current) => current.map((particle) => {
      const index = memberIndexes.get(particle.id);
      if (index === undefined) return particle;
      const offset = attractionOffset(index);
      return {
        ...particle,
        x: clamp(centerX + offset.x - particle.size / 2, 0, stage.width - particle.size),
        y: clamp(centerY + offset.y - particle.size / 2, 0, stage.height - particle.size),
        rotation: (particle.rotation ?? 0) + clamp(event.movementX * 0.025, -1, 1),
      };
    }));
    setIsScaleDropTarget(isPointOnElement(event.clientX, event.clientY, trayRef.current));
  };

  const finishParticleDrag = (particleId: string, event: ReactPointerEvent<HTMLDivElement>, cancelled = false) => {
    const drag = particleDragRef.current;
    const element = event.currentTarget;
    particleDragRef.current = null;
    setDraggingParticleId(null);
    setIsScaleDropTarget(false);
    if (!drag || drag.id !== particleId) return;

    const particle = particles.find((item) => item.id === particleId);
    if (!particle) return;
    const droppedOnTray = !cancelled && isPointOnElement(event.clientX, event.clientY, trayRef.current);
    const startingPositions = new Map(drag.members.map((member) => [member.id, member]));
    if (!droppedOnTray) {
      setParticles((current) => current.map((item) => {
        const start = startingPositions.get(item.id);
        return start ? { ...item, x: start.x, y: start.y } : item;
      }));
      particles.forEach((item) => {
        const start = startingPositions.get(item.id);
        const node = workspaceRef.current?.querySelector<HTMLElement>(`#${item.id}`);
        if (!start || !node) return;
        gsap.fromTo(node, { x: item.x - start.x, y: item.y - start.y, rotation: (item.rotation ?? 0) + 5 }, {
          x: 0, y: 0, rotation: item.rotation ?? 0, duration: 0.36, ease: 'back.out(1.5)',
          onComplete: () => gsap.set(node, { clearProps: 'transform' }),
        });
      });
      return;
    }

    const tray = trayRef.current?.getBoundingClientRect();
    const stage = workspaceRef.current?.getBoundingClientRect();
    if (!tray || !stage) return;
    playSound('particle-collection');
    const batchIds = particles.map((item) => item.id);
    const nextCollected = [...new Set([...collectedParticleIds, ...batchIds])];
    const columns = 4;
    const rows = Math.ceil(particles.length / columns);
    const cellWidth = tray.width / columns;
    const cellHeight = tray.height / rows;
    const targets = new Map(particles.map((item, index) => [item.id, {
      x: tray.left - stage.left + (index % columns) * cellWidth + (cellWidth - item.size) / 2,
      y: tray.top - stage.top + Math.floor(index / columns) * cellHeight + (cellHeight - item.size) / 2,
    }]));

    setParticles((current) => current.map((item) => {
      const target = targets.get(item.id);
      return target ? { ...item, ...target, collected: true, rotation: (item.rotation ?? 0) * 0.25 } : item;
    }));
    particles.forEach((item, index) => {
      const target = targets.get(item.id);
      const node = workspaceRef.current?.querySelector<HTMLElement>(`#${item.id}`);
      if (!target || !node) return;
      gsap.fromTo(node, { x: item.x - target.x, y: item.y - target.y, scale: 1.08 }, {
        x: 0, y: 0, scale: 1, duration: 0.36, delay: index * 0.025, ease: 'back.out(1.5)',
        onComplete: () => gsap.set(node, { clearProps: 'transform' }),
      });
    });

    setCollectedParticleIds(nextCollected);
    const collectedMass = particles.reduce((total, item) => total + item.mass, 0);
    setCrushedMass(collectedMass);
    animateMass(collectedMass);
    animateTray(collectedMass);
    const allWeighed = nextCollected.length === particles.length;
    setAreParticlesWeighed(allWeighed);
    if (allWeighed) {
      comparisonDelayRef.current?.kill();
      comparisonDelayRef.current = gsap.delayedCall(0.92, () => setShowComparison(true));
    }
  };

  const handleObservation = (answer: string) => {
    setSelectedAnswer(answer);
    if (answer === 'B') {
      setCompleted(true);
      completeStage('crushing');
      discoverObservation(crushingLab.concept);
    }
  };

  const stepState = [
    { label: 'Drag the ore to the scale.', done: isOreWeighed, active: !isOreWeighed },
    { label: 'Drag the crusher onto the ore.', done: isCrushed, active: isOreWeighed && !isCrushed },
    { label: 'Weigh each crushed piece.', done: areParticlesWeighed, active: isCrushed && !areParticlesWeighed },
  ];

  return (
    <div className="min-h-[calc(100vh-86px)] bg-paper px-4 py-5">
      <div className="mx-auto grid max-w-7xl gap-4 xl:grid-cols-[280px_minmax(0,1fr)_340px]">
        <aside className="laboratory-panel p-5">
          <p className="eyebrow">Experiment</p>
          <h1 className="mt-3 text-3xl font-semibold text-ink">{oreName}</h1>
          {oreFormula && <p className="mt-1 text-sm text-slate-600">{oreFormula}</p>}
          <div className="mt-6 space-y-4 text-sm text-slate-700">
            {stepState.map((step, index) => (
              <div key={step.label} className={`experiment-step${step.active ? ' is-active' : ''}${step.done ? ' is-complete' : ''}`} aria-current={step.active ? 'step' : undefined}>
                <div className="text-[10px] uppercase tracking-[0.2em] text-slate-500">Step {index + 1}{step.done ? '  ✓' : ''}</div>
                <div className="mt-2 font-medium text-ink">{step.done ? ['Measurement recorded.', 'Ore crushed.', 'All pieces weighed.'][index] : step.label}</div>
              </div>
            ))}
            {completed && <div className="experiment-complete">EXPERIMENT COMPLETE ✓</div>}
            {areParticlesWeighed && !completed && <div className="experiment-complete mt-4">EXPERIMENT COMPLETE ✓</div>}
          </div>
        </aside>

        <main className="laboratory-panel relative overflow-hidden px-3 py-4 sm:px-4">
          <div ref={workspaceRef} className={`workspace-area${isCrushing ? ' is-impacting' : ''}`}>
            <div ref={scaleRef} className={`scale-station${isScaleDropTarget ? ' is-drop-target' : ''}`} aria-label="Digital scale drop zone">
              <VirtualScale mass={currentMass} status={scaleStatus} trayRef={trayRef} dropTarget={isScaleDropTarget} />
            </div>

            <div
              ref={collectionAreaRef}
              className={`ore-collection-area${isCrushing || isCrushed ? ' is-active' : ''}`}
              aria-label="Crushed ore tray"
              aria-hidden={!isCrushing && !isCrushed}
            >
              <span className="ore-collection-label">CRUSHED ORE</span>
              <span className="ore-tray-rim" />
            </div>

            {!isCrushed && (
              <OreSpecimen
                ref={oreRef}
                position={orePosition}
                dragging={isOreDragging}
                cracking={isCrushing}
                disabled={isOreWeighed || isCrushing}
                onPointerDown={handleOrePointerDown}
                onPointerMove={handleOrePointerMove}
                onPointerUp={(event) => finishOreDrag(event)}
                onPointerCancel={(event) => finishOreDrag(event, true)}
              />
            )}

            {isCrushing && (
              <div
                className="impact-burst"
                style={{ left: `${impactOriginRef.current.x}px`, top: `${impactOriginRef.current.y}px` }}
                aria-hidden="true"
              >
                <span className="impact-ring" />
                {Array.from({ length: 8 }, (_, index) => <span key={index} className="impact-spark" />)}
              </div>
            )}

            {particles.map((particle) => (
              <div
                key={particle.id}
                id={particle.id}
                data-impact-piece="true"
                className={`ore-particle${draggingParticleId === 'group' && !particle.collected ? ' is-dragging' : ''}${particle.collected ? ' is-collected' : ''}`}
                style={{
                  left: `${particle.x}px`,
                  top: `${particle.y}px`,
                  width: `${particle.size}px`,
                  height: `${particle.size}px`,
                  rotate: `${particle.rotation ?? 0}deg`,
                  opacity: isCrushing ? 0 : 1,
                  pointerEvents: isCrushed ? 'auto' : 'none',
                }}
                onPointerDown={(event) => handleParticlePointerDown(particle, event)}
                onPointerMove={(event) => handleParticlePointerMove(particle.id, event)}
                onPointerUp={(event) => finishParticleDrag(particle.id, event)}
                onPointerCancel={(event) => finishParticleDrag(particle.id, event, true)}
                aria-label={`Iron ore piece, ${particle.mass} grams`}
                role="img"
                draggable={false}
              />
            ))}

            <Crusher
              ref={crusherRef}
              position={crusherPosition}
              locked={!isOreWeighed || isCrushing || isCrushed}
              spent={isCrushed}
              dragging={isCrusherDragging}
              nearOre={crusherNearOre}
              onPointerDown={handleCrusherPointerDown}
              onPointerMove={handleCrusherPointerMove}
              onPointerUp={(event) => finishCrusherDrag(event)}
              onPointerCancel={(event) => finishCrusherDrag(event, true)}
            />
          </div>
        </main>
      </div>

      {showComparison && (
        <div ref={comparisonRef} className="mx-auto mt-6 max-w-5xl border-y border-ink/10 py-5">
          <p className="eyebrow">Compare your measurements</p>
          <h2 className="mt-2 text-2xl font-semibold text-ink">Original mass vs crushed ore mass</h2>
          <div className="comparison-visual">
            <div className="comparison-side">
              <div className="text-[10px] uppercase tracking-[0.18em] text-slate-500">Mass before crushing</div>
              <div className="comparison-specimen comparison-before-sample" aria-label="One large ore specimen" />
              <div className="comparison-mass">{(measuredBeforeMass ?? originalMass).toFixed(1)} g</div>
            </div>
            <div className="comparison-connector" aria-hidden="true" />
            <div className="comparison-side">
              <div className="text-[10px] uppercase tracking-[0.18em] text-slate-500">Mass after crushing</div>
              <div className="comparison-pieces" aria-label={`${particles.length} smaller ore pieces`}>
                {particles.map((particle) => <span key={particle.id} className="comparison-after-piece" />)}
              </div>
              <div className="comparison-mass">{crushedMass.toFixed(1)} g</div>
            </div>
          </div>
          <div className="mt-2 text-xs text-slate-500">Collected mass: {collectedParticleIds.length} / {particles.length} pieces · {totalParticleMass.toFixed(1)} g total</div>
          <p className="mt-2 max-w-3xl text-xs leading-5 text-slate-500">{crushingLab.massMeasurementNote}</p>
        </div>
      )}

      {showComparison && (
        <div ref={observationRef} className="observation-handoff">
          <ObservationPanel
            question="What did you observe?"
            options={[
              { id: 'A', label: 'Mass decreased' },
              { id: 'B', label: 'Particle size decreased' },
              { id: 'C', label: 'Both decreased' },
            ]}
            selectedAnswer={selectedAnswer}
            onSelect={handleObservation}
            hint={selectedAnswer && selectedAnswer !== 'B' ? 'Compare the two measurements.' : null}
            completed={completed}
            mass={crushedMass}
          />
        </div>
      )}

      {completed && (
        <div ref={continueRef} className="continue-handoff mx-auto mt-6 max-w-5xl text-right">
          <Link to="/sintering" onClick={() => setCurrentStage('sintering')} className="primary-button">Continue to Sintering</Link>
        </div>
      )}
    </div>
  );
}
