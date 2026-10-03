import type { ReactNode } from 'react';
import { useEffect, useRef, useState } from 'react';
import type { MouseEvent } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import gsap from 'gsap';
import { LabJournal } from '../../components/laboratory/LabJournal';
import { MasterLogo, PlatformLogo } from '../../components/ui/BrandMarks';
import { useIronLabSession } from '../../state/IronLabSession';
import { useLabAudio } from '../../audio/LabAudio';
import type { LabSound } from '../../audio/LabAudio';

type AppLayoutProps = { children: ReactNode };

export default function AppLayout({ children }: AppLayoutProps) {
  const path = useLocation().pathname;
  const navigate = useNavigate();
  const { session, discoveryNotice, dismissDiscoveryNotice } = useIronLabSession();
  const { muted, toggleMute, playSound } = useLabAudio();
  const headerOreName = path === '/reduction' ? 'Hematite' : session.oreName;
  const [journalOpen, setJournalOpen] = useState(false);
  const discoveryRef = useRef<HTMLDivElement | null>(null);
  const routeArrivalRef = useRef<HTMLDivElement | null>(null);
  const previousPathRef = useRef<string | null>(null);
  const experimentTitle = path === '/'
    ? 'The Extraction Challenge'
    : path === '/sintering'
    ? 'Sintering experiment'
      : path === '/concentration'
      ? 'Concentration experiment'
        : path === '/roasting'
          ? 'Roasting experiment'
        : path === '/reduction'
          ? 'Reduction'
            : path === '/iron-formation'
              ? 'Iron Formation'
          : path === '/mind-map'
            ? 'Your Iron Journey'
              : path === '/identification'
              ? 'Ore identification'
              : 'Crushing experiment';

  useEffect(() => {
    const toast = discoveryRef.current;
    if (!discoveryNotice || !toast) return;
    const timeline = gsap.timeline({ onComplete: dismissDiscoveryNotice });
    timeline
      .fromTo(toast, { y: -10, opacity: 0, scale: 0.98 }, { y: 0, opacity: 1, scale: 1, duration: 0.32, ease: 'power2.out' })
      .to(toast, { y: -6, opacity: 0, duration: 0.24, delay: 2.8, ease: 'power1.in' });
    return () => { timeline.kill(); };
  }, [discoveryNotice, dismissDiscoveryNotice]);

  useEffect(() => {
    const content = routeArrivalRef.current;
    if (!content || path === '/' || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    gsap.fromTo(content, { y: 8, opacity: 0 }, { y: 0, opacity: 1, duration: 0.3, ease: 'power1.out' });
  }, [path]);

  useEffect(() => {
    if (previousPathRef.current && previousPathRef.current !== path) playSound('stage-transition');
    previousPathRef.current = path;
  }, [path, playSound]);

  const playControlSound = (event: MouseEvent<HTMLDivElement>) => {
    if (!(event.target instanceof Element)) return;
    const control = event.target.closest<HTMLElement>('[data-lab-sound], button, a');
    if (!control || control.dataset.labSound === 'none') return;
    const sound = control.dataset.labSound;
    playSound(sound ? sound as LabSound : 'button-click');
  };

  return (
    <div className="min-h-screen bg-paper text-ink" onClickCapture={playControlSound}>
      <header className={`lab-header${path === '/' ? ' lab-header--home' : ''}`}>
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="header-brand-lockup">
            <MasterLogo className="header-master-logo" />
            <div>
              <div className="text-[10px] uppercase tracking-[0.28em] text-slate-500">Iron Lab · Roshetta</div>
              <div className="text-sm font-semibold text-ink">
                {experimentTitle}{session.oreIdentified && headerOreName ? ` — ${headerOreName}` : ''}
              </div>
              <div className="header-master-caption">WITH DR NASSER EL-BATAL</div>
            </div>
          </div>
          <div className="header-right-tools">
            <PlatformLogo className="header-platform-logo" />
            {path !== '/' && <div className="header-tools">
              {path !== '/identification' && (
                <button type="button" className="ore-progress-open" onClick={() => navigate('/identification')}>ORE PROGRESS</button>
              )}
              <button type="button" className="audio-toggle" data-lab-sound="none" onClick={toggleMute} aria-pressed={muted} aria-label={muted ? 'Unmute laboratory sounds' : 'Mute laboratory sounds'}>
                {muted ? 'SOUND OFF' : 'SOUND ON'}
              </button>
              <button type="button" className="journal-open-button" onClick={() => setJournalOpen(true)}>
                LAB JOURNAL
                {(session.observations.length > 0 || session.discoveredEquations.length > 0) && <span className="journal-count">{session.observations.length + session.discoveredEquations.length}</span>}
              </button>
            </div>}
          </div>
        </div>
      </header>

      <main><div key={path} ref={routeArrivalRef}>{children}</div></main>
      <footer className="site-credit">
        <div className="site-credit-brand">
          <MasterLogo className="site-credit-logo" />
          <span>With Dr Nasser El-Batal</span>
        </div>
        <span>Created by <strong>Mohannad Essam</strong></span>
        <a href="https://www.instagram.com/trz_mohannad112?stkn=MTBucGF1MndhaXpiNA==" target="_blank" rel="noreferrer">Instagram</a>
      </footer>
      {discoveryNotice && (
        <div ref={discoveryRef} className="knowledge-toast" role="status">
          <span className="knowledge-toast-mark" aria-hidden="true">✦</span>
          <div className="knowledge-toast-copy">
            <strong>KNOWLEDGE DISCOVERED</strong>
            <span>{discoveryNotice.text}</span>
          </div>
          <button type="button" onClick={() => { setJournalOpen(true); dismissDiscoveryNotice(); }}>OPEN JOURNAL</button>
        </div>
      )}
      <LabJournal isOpen={journalOpen} onClose={() => setJournalOpen(false)} />
    </div>
  );
}
