import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { useNavigate } from 'react-router-dom';
import { ironOres } from '../../data/ironOres';
import type { IronOreId } from '../../data/ironOres';
import { useIronLabSession } from '../../state/IronLabSession';

const oreIds: IronOreId[] = ['hematite', 'magnetite', 'limonite', 'siderite'];

export function OreIdentificationScene() {
  const navigate = useNavigate();
  const { session, progress, identifyOre, startOre, resumeOre, viewOreJourney, resetAllProgress } = useIronLabSession();
  const confirmationRef = useRef<HTMLDivElement | null>(null);
  const transitionTweenRef = useRef<gsap.core.Tween | null>(null);
  const [selectedOre, setSelectedOre] = useState<IronOreId | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [resetConfirmation, setResetConfirmation] = useState(false);

  const selectOre = (oreId: IronOreId) => {
    setSelectedOre(oreId);
    setConfirmed(false);
  };

  const confirmOre = () => {
    if (!selectedOre) return;
    identifyOre(selectedOre);
    setConfirmed(true);
    transitionTweenRef.current?.kill();
    transitionTweenRef.current = gsap.delayedCall(1.8, () => navigate('/crushing'));
  };

  const currentRunInProgress = (oreId: IronOreId) => session.oreIdentified
    && session.oreType === oreId
    && !session.completedStages.includes('iron');

  const continueOre = (oreId: IronOreId) => {
    const stage = currentRunInProgress(oreId)
      ? session.currentStage
      : progress.ores[oreId].runSnapshot?.currentStage ?? progress.ores[oreId].currentStage;
    resumeOre(oreId);
    navigate(`/${stage === 'identification' ? 'crushing' : stage}`);
  };

  const runAgain = (oreId: IronOreId) => {
    transitionTweenRef.current?.kill();
    startOre(oreId);
    navigate('/crushing');
  };

  const resetAll = () => {
    transitionTweenRef.current?.kill();
    resetAllProgress();
    setSelectedOre(null);
    setConfirmed(false);
    setResetConfirmation(false);
  };

  useEffect(() => () => {
    transitionTweenRef.current?.kill();
  }, []);

  useEffect(() => {
    if (!confirmed || !confirmationRef.current) return;
    gsap.fromTo(confirmationRef.current, { y: 12, opacity: 0, scale: 0.98 }, {
      y: 0,
      opacity: 1,
      scale: 1,
      duration: 0.48,
      ease: 'power2.out',
    });
  }, [confirmed]);

  const selectedDefinition = selectedOre ? ironOres[selectedOre] : null;
  const selectedProgress = selectedOre ? progress.ores[selectedOre] : null;
  const hasSavedProgress = oreIds.some((oreId) => progress.ores[oreId].started);

  return (
    <div className="min-h-[calc(100vh-86px)] bg-paper px-4 py-7">
      <div className="mx-auto max-w-7xl">
        <div className="investigation-heading">
          <p className="eyebrow">First stage · ore identification</p>
          <h1 className="mt-2 text-3xl font-semibold text-ink">Examine the unknown sample</h1>
          <p className="mt-2 text-sm text-slate-600">The source names four iron ores but provides no distinguishing physical test.</p>
        </div>

        <main className="laboratory-panel relative mt-5 overflow-hidden px-3 py-4 sm:px-4">
          <div className="workspace-area identification-workspace">
            <div className="identification-sample-label">UNKNOWN SAMPLE</div>
            <div className="investigation-sample">
            <div
              className="unknown-ore-specimen"
              style={{ background: selectedOre ? ironOres[selectedOre].color : '#8f999d' }}
              aria-hidden="true"
            />
            </div>
            <div className="identification-panel">
              <p className="eyebrow">Candidate ores</p>
              <p className="mt-2 text-sm text-slate-600">Select the ore assigned to this sample.</p>
              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                {oreIds.map((oreId) => (
                  <button
                    key={oreId}
                    type="button"
                    onClick={() => selectOre(oreId)}
                    data-lab-sound="ore-selection"
                    disabled={confirmed}
                    aria-pressed={selectedOre === oreId}
                    className={`ore-choice${selectedOre === oreId ? ' is-selected' : ''}`}
                    style={{ borderLeft: `6px solid ${ironOres[oreId].color}` }}
                  >
                    <span className="ore-choice-name">{ironOres[oreId].name}</span>
                    <small>{ironOres[oreId].formula}</small>
                    <em className={`ore-progress-status${progress.ores[oreId].completed ? ' is-completed' : progress.ores[oreId].started ? ' is-in-progress' : ''}`}>
                      {progress.ores[oreId].completed ? '✓ COMPLETED' : progress.ores[oreId].started ? '◐ IN PROGRESS' : '▶ START'}
                    </em>
                  </button>
                ))}
              </div>
              {selectedOre && selectedProgress && !confirmed && !selectedProgress.started && (
                <button type="button" className="identify-confirm" onClick={confirmOre}>
                  CONFIRM IDENTIFICATION
                </button>
              )}
              {selectedOre && selectedDefinition && selectedProgress?.started && !selectedProgress.completed && !confirmed && (
                <div className="ore-progress-panel" role="status">
                  <p className="eyebrow">◐ IN PROGRESS · {selectedDefinition.name}</p>
                  <p>{selectedProgress.discoveredEquations.length} equations · {selectedProgress.observations.length} observations · {selectedProgress.completedStages.length} stages</p>
                  <button type="button" className="identify-confirm" onClick={() => continueOre(selectedOre)}>CONTINUE</button>
                </div>
              )}
              {selectedOre && selectedDefinition && selectedProgress?.completed && !confirmed && (
                <div className="ore-progress-panel" role="status">
                  <p className="eyebrow">✓ COMPLETED</p>
                  <h2 className="mt-2 text-xl font-semibold text-ink">{selectedDefinition.name}</h2>
                  <p className="mt-2">YOUR DISCOVERIES</p>
                  <p>{selectedProgress.discoveredEquations.length} equations · {selectedProgress.observations.length} observations · {selectedProgress.completedStages.length} completed stages</p>
                  <div className="ore-progress-actions">
                    <button type="button" className="identify-confirm" onClick={() => { viewOreJourney(selectedOre); navigate('/mind-map'); }}>VIEW JOURNEY</button>
                    <button type="button" className="identify-confirm lab-action--secondary" onClick={() => runAgain(selectedOre)}>RUN AGAIN</button>
                    {selectedProgress.runSnapshot && <button type="button" className="identify-confirm" onClick={() => continueOre(selectedOre)}>CONTINUE CURRENT RUN</button>}
                  </div>
                </div>
              )}
              {confirmed && selectedDefinition && (
                <div ref={confirmationRef} className="ore-identified-result" role="status">
                  <p className="eyebrow">IDENTIFICATION CONFIRMED</p>
                  <h2 className="mt-2 text-2xl font-semibold text-ink">{selectedDefinition.name}</h2>
                  <p className="mt-1 text-lg text-slate-700">{selectedDefinition.formula}</p>
                  <p className="mt-3 text-sm text-slate-600">Preparing the crushing station…</p>
                </div>
              )}
            </div>
          </div>
        </main>
        {hasSavedProgress && (
          <section className="ore-reset-row" aria-label="Progress reset controls">
            {!resetConfirmation ? (
              <button type="button" className="secondary-button" onClick={() => setResetConfirmation(true)}>RESET ALL PROGRESS</button>
            ) : (
              <div className="ore-reset-confirmation" role="group" aria-label="Confirm reset all progress">
                <span>Erase saved progress for all ores?</span>
                <button type="button" className="secondary-button" onClick={resetAll}>CONFIRM RESET</button>
                <button type="button" className="secondary-button" onClick={() => setResetConfirmation(false)}>CANCEL</button>
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  );
}
