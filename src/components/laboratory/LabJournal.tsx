import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ironOres } from '../../data/ironOres';
import { reactionRegistry } from '../../data/reactions';
import { useIronLabSession } from '../../state/IronLabSession';
import type { DiscoveryNotice } from '../../state/IronLabSession';

type LabJournalProps = {
  isOpen: boolean;
  onClose: () => void;
};

export function LabJournal({ isOpen, onClose }: LabJournalProps) {
  const journalRef = useRef<HTMLElement | null>(null);
  const { session, discoveryNotice } = useIronLabSession();
  const [pendingDiscoveries, setPendingDiscoveries] = useState<DiscoveryNotice[]>([]);
  const selectedOre = session.oreType ? ironOres[session.oreType] : null;

  useEffect(() => {
    if (!discoveryNotice) return;
    setPendingDiscoveries((current) => current.some((item) => item.id === discoveryNotice.id) ? current : [...current, discoveryNotice]);
  }, [discoveryNotice]);

  useEffect(() => {
    if (!isOpen) return;
    const journal = journalRef.current;
    if (!journal) return;
    const context = gsap.context(() => {
      gsap.fromTo(journal, { x: 22, opacity: 0 }, { x: 0, opacity: 1, duration: 0.28, ease: 'power2.out' });
      const entries = journal.querySelectorAll('.journal-entry:not(.is-newly-discovered)');
      if (entries.length > 0) {
        gsap.fromTo(entries, { y: 7, opacity: 0 }, {
          y: 0,
          opacity: 1,
          duration: 0.24,
          stagger: 0.045,
          delay: 0.08,
          ease: 'power1.out',
        });
      }
    }, journal);
    return () => context.revert();
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || pendingDiscoveries.length === 0) return;
    const journal = journalRef.current;
    if (!journal) return;
    const timeline = gsap.timeline({ onComplete: () => setPendingDiscoveries([]) });
    let entryCount = 0;
    pendingDiscoveries.forEach((notice) => {
      const entry = journal.querySelector<HTMLElement>(`[data-discovery-id="${notice.id}"]`);
      if (!entry) return;
      timeline.fromTo(entry, { x: 12, y: 4, opacity: 0.45 }, {
        x: 0,
        y: 0,
        opacity: 1,
        duration: 0.34,
        ease: 'power2.out',
        clearProps: 'transform,opacity',
      }, entryCount === 0 ? 0 : '>');
      entryCount += 1;
    });
    if (entryCount === 0) setPendingDiscoveries([]);
    return () => { timeline.kill(); };
  }, [isOpen, pendingDiscoveries]);

  useEffect(() => {
    if (!isOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const pendingDiscoveryFor = (text: string, kind: 'observation' | 'equation') => pendingDiscoveries.find((item) => item.text === text && item.kind === kind);
  const hasLockedKnowledge = !selectedOre || session.observations.length === 0 || session.discoveredEquations.length === 0;

  return (
    <div className="journal-backdrop" onClick={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section ref={journalRef} className="journal-drawer" role="dialog" aria-modal="true" aria-labelledby="journal-title">
        <header className="journal-header">
          <div>
            <p className="eyebrow">Iron Lab</p>
            <h2 id="journal-title">Lab journal</h2>
          </div>
          <button type="button" className="journal-close" onClick={onClose} aria-label="Close lab journal">×</button>
        </header>

        <div className="journal-content">
          <section aria-labelledby="journal-discovered">
            <h3 id="journal-discovered" className="journal-section-title">DISCOVERED</h3>
            {selectedOre && (
              <div className="journal-entry journal-ore-entry">
                <span className="journal-check" aria-hidden="true">✓</span>
                <div><strong>Ore identified</strong><span>{selectedOre.name} · {selectedOre.formula}</span></div>
              </div>
            )}
            {session.observations.length > 0 && (
              <div className="journal-knowledge-group">
                <h4>✓ Observations discovered</h4>
                <ul>
                  {session.observations.map((observation) => (
                    <li key={observation} data-discovery-id={pendingDiscoveryFor(observation, 'observation')?.id} className={`journal-entry${pendingDiscoveryFor(observation, 'observation') ? ' is-newly-discovered' : ''}`}>{observation}</li>
                  ))}
                </ul>
              </div>
            )}
            {session.discoveredEquations.length > 0 && (
              <div className="journal-knowledge-group">
                <h4>✓ Equations discovered</h4>
                <ul>
                  {session.discoveredEquations.map((equation) => {
                    const reaction = reactionRegistry.find((item) => item.equation === equation);
                    return (
                      <li key={equation} data-discovery-id={pendingDiscoveryFor(equation, 'equation')?.id} className={`journal-entry journal-equation-entry${pendingDiscoveryFor(equation, 'equation') ? ' is-newly-discovered' : ''}`}>
                        <strong>{equation}</strong>
                        {reaction && <small className="journal-reaction-meta">{reaction.categoryLabel} · {reaction.condition}<br />Observation: {reaction.observation}</small>}
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
            {!selectedOre && session.observations.length === 0 && session.discoveredEquations.length === 0 && (
              <p className="journal-empty">Nothing recorded yet.</p>
            )}
          </section>

          {hasLockedKnowledge && (
            <section className="journal-locked" aria-labelledby="journal-locked-title">
              <h3 id="journal-locked-title" className="journal-section-title">LOCKED</h3>
              {!selectedOre && <p>🔒 Ore identification</p>}
              {session.observations.length === 0 && <p>🔒 Observations not discovered yet</p>}
              {session.discoveredEquations.length === 0 && <p>🔒 Equations not discovered yet</p>}
              <p className="journal-lock-note">Knowledge not discovered yet.</p>
            </section>
          )}
        </div>
      </section>
    </div>
  );
}