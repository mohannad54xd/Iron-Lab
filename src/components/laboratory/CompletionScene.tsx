import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { useNavigate } from 'react-router-dom';
import { ironOres } from '../../data/ironOres';
import type { IronOreId } from '../../data/ironOres';
import { ReactionMapScene } from './ReactionMapScene';
import { MasterLogo } from '../ui/BrandMarks';
import { useIronLabSession } from '../../state/IronLabSession';
import { useLabAudio } from '../../audio/LabAudio';

const oreOrder: IronOreId[] = ['hematite', 'magnetite', 'limonite', 'siderite'];
const journey = [
  { id: 'identification', label: 'ORE' },
  { id: 'crushing', label: 'CRUSHING' },
  { id: 'sintering', label: 'SINTERING' },
  { id: 'concentration', label: 'CONCENTRATION' },
  { id: 'roasting', label: 'ROASTING' },
  { id: 'reduction', label: 'REDUCTION' },
  { id: 'iron', label: 'IRON' },
];
const experiments = [
  { id: 'crushing', label: 'Crushing' },
  { id: 'sintering', label: 'Sintering' },
  { id: 'concentration', label: 'Concentration' },
  { id: 'roasting', label: 'Roasting' },
  { id: 'reduction', label: 'Reduction' },
  { id: 'iron-formation', label: 'Iron formation' },
];

export function CompletionScene() {
  const navigate = useNavigate();
  const { session, progress, viewOreJourney, resumeOre, restartCurrentRun, resetAllProgress } = useIronLabSession();
  const { playSound } = useLabAudio();
  const [lockedOreMessage, setLockedOreMessage] = useState<string | null>(null);
  const [journeyRevealed, setJourneyRevealed] = useState(false);
  const mapRef = useRef<HTMLDivElement | null>(null);
  const equationsRef = useRef<HTMLElement | null>(null);
  const runSummaryRef = useRef<HTMLElement | null>(null);
  const sceneRef = useRef<HTMLDivElement | null>(null);
  const selectedOre = session.oreType ? ironOres[session.oreType] : null;
  const completedExperiments = experiments.filter((experiment) => session.completedStages.includes(experiment.id));
  const journeyKey = `${session.oreType ?? 'none'}:${session.completedStages.join(',')}`;

  useEffect(() => {
    const map = mapRef.current;
    setJourneyRevealed(false);
    if (!map) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setJourneyRevealed(true);
      return;
    }
    const context = gsap.context(() => {
      const timeline = gsap.timeline();
      timeline.fromTo(map, { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 0.34, ease: 'power1.out' });
      const nodes = map.querySelectorAll<HTMLElement>('.journey-node-wrap');
      const links = map.querySelectorAll<HTMLElement>('.journey-link');
      nodes.forEach((node, index) => {
        timeline.fromTo(node, { y: 9, opacity: 0, scale: 0.99 }, {
          y: 0,
          opacity: 1,
          scale: 1,
          duration: 0.25,
          ease: 'power2.out',
        }, index === 0 ? '>' : '>');
        if (links[index]) {
          timeline.fromTo(links[index], { scaleY: 0.1, opacity: 0, transformOrigin: 'top center' }, {
            scaleY: 1,
            opacity: 1,
            duration: 0.16,
            ease: 'power1.out',
          }, '>-=0.035');
        }
      });
      const ironNode = map.querySelector<HTMLElement>('.journey-node.is-iron');
      if (ironNode) {
        timeline.fromTo(ironNode, { scale: 0.94, boxShadow: '0 0 0 rgba(185,104,60,0)' }, {
          scale: 1,
          boxShadow: '0 0 22px rgba(185,104,60,0.22)',
          duration: 0.46,
          ease: 'power2.out',
        }, '+=0.1');
      }
      timeline.call(() => {
        setJourneyRevealed(true);
        playSound('stage-complete');
      });
      if (equationsRef.current) {
        timeline.fromTo(equationsRef.current, { y: 10, opacity: 0 }, {
          y: 0,
          opacity: 1,
          duration: 0.42,
          ease: 'power2.out',
        }, '+=0.18');
      }
      if (runSummaryRef.current) {
        timeline.fromTo(runSummaryRef.current, { y: 8, opacity: 0 }, {
          y: 0,
          opacity: 1,
          duration: 0.34,
          ease: 'power2.out',
        }, '+=0.12');
      }
    }, map);
    return () => context.revert();
  }, [journeyKey, playSound]);

  const startAnotherOre = () => {
    navigate('/identification', { replace: true });
  };

  const restartCurrent = () => {
    if (!session.oreType) return;
    restartCurrentRun();
    navigate('/crushing', { replace: true });
  };

  const resetAll = () => {
    resetAllProgress();
    navigate('/identification', { replace: true });
  };

  const openOreProgress = (oreId: IronOreId) => {
    const oreProgress = progress.ores[oreId];
    if (oreProgress.completed) {
      viewOreJourney(oreId);
      setLockedOreMessage(`${ironOres[oreId].name} saved journey opened.`);
      return;
    }
    if (oreProgress.started) {
      const stage = oreProgress.runSnapshot?.currentStage ?? oreProgress.currentStage;
      resumeOre(oreId);
      navigate(`/${stage === 'identification' ? 'crushing' : stage}`);
      return;
    }
    setLockedOreMessage('This ore has not been started yet. Open ore identification to begin it.');
  };

  return (
    <div ref={sceneRef} className="mind-map-completion bg-paper">
      <ReactionMapScene />
      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="completion-brand-row">
          <div><p className="eyebrow">Final map</p><h1 className="mt-2 text-4xl font-semibold text-ink">Your Iron Journey</h1></div>
          <div className="completion-master-lockup"><MasterLogo className="completion-master-logo" /><span>DR NASSER EL-BATAL<br />ROS HETTA NETWORK</span></div>
        </div>
        {selectedOre && <p className="mt-2 text-lg text-slate-700">Ore identified: <strong className="text-ink">{selectedOre.name}</strong> · {selectedOre.formula}</p>}

        <div ref={mapRef}>
          <section className={`journey-map${journeyRevealed ? ' is-revealed' : ''}`} aria-label="Your completed extraction stages">
            {journey.map((stage, index) => {
              const complete = stage.id === 'iron'
                ? session.completedStages.includes('iron') && session.completedStages.includes('iron-formation')
                : session.completedStages.includes(stage.id);
              return (
                <div className="journey-node-wrap" key={stage.id}>
                  <div className={`journey-node${complete ? ' is-complete' : ''}${stage.id === 'iron' ? ' is-iron' : ''}${stage.id === 'iron' && journeyRevealed ? ' is-activated' : ''}`}>
                    <span className="journey-node-index">{complete ? '✓' : String(index + 1).padStart(2, '0')}</span>
                    <span>{stage.label}</span>
                    {stage.id === 'identification' && selectedOre && <small>{selectedOre.name} · {selectedOre.formula}</small>}
                    {stage.id === 'iron' && <small>Fe</small>}
                  </div>
                  {index < journey.length - 1 && <span className={`journey-link${complete ? ' is-complete' : ''}`} aria-hidden="true" />}
                </div>
              );
            })}
          </section>

          <section ref={equationsRef} className="mt-8 border-y border-ink/10 py-6">
            <p className="eyebrow">EQUATIONS YOU DISCOVERED</p>
            {session.discoveredEquations.length > 0 ? (
              <ul className="mt-4 space-y-2">
                {session.discoveredEquations.map((equation) => <li key={equation} className="discovered-equation">{equation}</li>)}
              </ul>
            ) : (
              <p className="mt-3 text-sm text-slate-600">No equations were discovered during this run.</p>
            )}
            {session.observations.length > 0 && (
              <div className="mt-5">
                <p className="eyebrow">OBSERVATIONS DISCOVERED</p>
                <ul className="mt-2 space-y-1 text-sm text-slate-700">{session.observations.map((observation) => <li key={observation}>{observation}</li>)}</ul>
              </div>
            )}
          </section>

          <section ref={runSummaryRef} className="run-summary" aria-labelledby="run-summary-heading">
            <p id="run-summary-heading" className="eyebrow">LAB JOURNAL · SCIENTIFIC RUN RECORD</p>
            <div className="run-summary-grid">
              <div className="run-summary-entry">
                <h2>ORE IDENTIFIED</h2>
                {selectedOre ? <p>{selectedOre.name} · {selectedOre.formula}</p> : <p>Not recorded</p>}
              </div>
              <div className="run-summary-entry">
                <h2>EXPERIMENTS COMPLETED</h2>
                <p>{completedExperiments.length} / {experiments.length}</p>
                {completedExperiments.length > 0 && <ul>{completedExperiments.map((experiment) => <li key={experiment.id}>✓ {experiment.label}</li>)}</ul>}
              </div>
              <div className="run-summary-entry">
                <h2>OBSERVATIONS DISCOVERED</h2>
                {session.observations.length > 0 ? <ul>{session.observations.map((observation) => <li key={observation}>{observation}</li>)}</ul> : <p>None recorded</p>}
              </div>
              <div className="run-summary-entry">
                <h2>EQUATIONS DISCOVERED</h2>
                {session.discoveredEquations.length > 0 ? <ul>{session.discoveredEquations.map((equation) => <li key={equation}>{equation}</li>)}</ul> : <p>None recorded</p>}
              </div>
            </div>
          </section>
        </div>

        <section className="mt-7">
          <p className="eyebrow">IRON LAB PROGRESS</p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
            {oreOrder.map((oreId) => {
              const ore = ironOres[oreId];
              const isSelected = oreId === session.oreType;
              const oreProgress = progress.ores[oreId];
              const isCompleted = oreProgress.completed;
              const isInProgress = oreProgress.started && !isCompleted;
              return (
                <button
                  key={oreId}
                  type="button"
                  className={`ore-map-node${isCompleted ? ' is-unlocked is-completed' : ''}${isInProgress ? ' is-in-progress' : ''}${isSelected ? ' is-current' : ''}`}
                  aria-label={`${isCompleted ? 'Completed' : isInProgress ? 'In progress' : 'Locked'} ore: ${ore.name}`}
                  onClick={() => openOreProgress(oreId)}
                >
                  <span>{isCompleted ? '✓' : isInProgress ? '◐' : '🔒'}</span>
                  <span>{ore.name}</span>
                  <small>{isCompleted ? 'COMPLETED' : isInProgress ? 'IN PROGRESS' : 'LOCKED'}</small>
                </button>
              );
            })}
          </div>
          {lockedOreMessage && <p className="mt-3 text-sm text-slate-600" role="status">{lockedOreMessage}</p>}
        </section>

        <div className="journey-actions mt-8">
          <button type="button" className="primary-button" onClick={restartCurrent}>RESTART CURRENT RUN</button>
          <button type="button" className="secondary-button" onClick={startAnotherOre}>RUN ANOTHER ORE</button>
          <button type="button" className="secondary-button" onClick={resetAll}>RESET ALL PROGRESS</button>
        </div>
      </div>
    </div>
  );
}
