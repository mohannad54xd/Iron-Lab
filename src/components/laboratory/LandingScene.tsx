import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { useNavigate } from 'react-router-dom';
import { MasterLogo, PlatformLogo } from '../ui/BrandMarks';

export function LandingScene() {
  const navigate = useNavigate();
  const [booting, setBooting] = useState(false);
  const transitionRef = useRef<HTMLDivElement | null>(null);
  const timelineRef = useRef<gsap.core.Timeline | null>(null);

  useEffect(() => {
    if (!booting) return;
    const transition = transitionRef.current;
    if (!transition) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      navigate('/identification');
      return;
    }
    const timeline = gsap.timeline();
    timelineRef.current = timeline;
    timeline
      .fromTo(transition, { opacity: 0, scale: 1.02 }, { opacity: 1, scale: 1, duration: 0.24, ease: 'power2.out' })
      .fromTo('.activation-boot-copy > *', { y: 8, opacity: 0 }, { y: 0, opacity: 1, duration: 0.24, stagger: 0.08, ease: 'power2.out' }, 0.18)
      .to(transition, { opacity: 0, duration: 0.2, ease: 'power1.in' }, '+=0.1');
    const navigationTimer = window.setTimeout(() => navigate('/identification'), 1450);
    return () => {
      timeline.kill();
      window.clearTimeout(navigationTimer);
    };
  }, [booting, navigate]);

  useEffect(() => () => { timelineRef.current?.kill(); }, []);

  return (
    <section className={`activation-screen${booting ? ' is-booting' : ''}`} aria-labelledby="mission-title">
      <div className="activation-grid" aria-hidden="true" />
      <div className="activation-particles" aria-hidden="true">
        <i /><i /><i /><i /><i /><i /><i /><i />
      </div>
      <span className="activation-track activation-track-left" aria-hidden="true" />
      <span className="activation-track activation-track-right" aria-hidden="true" />

      <header className="activation-header">
        <div className="activation-master-lockup">
          <MasterLogo className="activation-master-logo" />
          <div><strong>Dr Nasser El-Batal</strong><span>IRON ROSHETTA · DIGITAL LAB</span></div>
        </div>
        <PlatformLogo className="activation-platform-logo" />
      </header>

      <main className="activation-core">
        <div className="activation-system-line"><span className="activation-live-dot" /> ROS HETTA // SYSTEM ONLINE</div>
        <p className="activation-protocol">IRON EXTRACTION PROTOCOL · 01</p>
        <h1 id="mission-title">THE IRON ROSHETTA</h1>
        <p className="activation-brief">Four ores. One reaction map. Begin the laboratory sequence.</p>

        <div className="activation-control">
          <span className="activation-control-label">POWER / STANDBY</span>
          <button type="button" className="machine-start" onClick={() => setBooting(true)} disabled={booting} aria-label="Start and activate Iron Roshetta">
            <span className="machine-start-rim" aria-hidden="true" />
            <span className="machine-start-copy"><strong>START</strong><small>ACTIVATE IRON ROSHETTA</small></span>
          </button>
          <span className="activation-control-foot">PRESS TO INITIALIZE</span>
        </div>

        <p className="activation-easter-egg" lang="ar" dir="rtl">الروشتة أم تقنية عالية</p>
      </main>

      <footer className="activation-footer">
        <span>Fe · 26</span><span>CHEMISTRY MODE: ON</span><span>EDNUVA · STUDENT LAB</span>
      </footer>

      {booting && (
        <div ref={transitionRef} className="activation-transition" role="status" aria-live="polite">
          <MasterLogo className="activation-transition-logo" />
          <div className="activation-boot-copy">
            <strong>ROS HETTA // SYSTEM ONLINE</strong>
            <span>IRON EXTRACTION PROTOCOL INITIALIZING</span>
          </div>
          <div className="activation-loading-bar"><span /></div>
        </div>
      )}
    </section>
  );
}