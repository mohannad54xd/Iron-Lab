import { forwardRef } from 'react';
import type { Ref } from 'react';
import { ParticleBed } from './ParticleBed';
import { SinteringChamber } from './SinteringChamber';

type SinteringTrayProps = {
  bedRef: Ref<HTMLDivElement>;
  ready: boolean;
  heating: boolean;
  progress: number;
  placedCount: number;
  totalCount: number;
  isDropTarget: boolean;
};

export const SinteringTray = forwardRef<HTMLDivElement, SinteringTrayProps>(function SinteringTray(
  { bedRef, ready, heating, progress, placedCount, totalCount, isDropTarget },
  ref,
) {
  return (
    <div
      ref={ref}
      className={`sintering-tray${ready ? ' is-ready' : ''}${heating ? ' is-heating' : ''}${isDropTarget ? ' is-drop-target' : ''}`}
      aria-label="Sintering ore tray"
    >
      <span className="sintering-tray-rim" />
      <ParticleBed ref={bedRef} ready={ready} placedCount={placedCount} totalCount={totalCount} />
      <SinteringChamber heating={heating} progress={progress} />
    </div>
  );
});
