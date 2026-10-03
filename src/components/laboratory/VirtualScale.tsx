import type { Ref } from 'react';

type VirtualScaleProps = {
  mass: number;
  status: string;
  trayRef: Ref<HTMLDivElement>;
  dropTarget: boolean;
};

export function VirtualScale({ mass, status, trayRef, dropTarget }: VirtualScaleProps) {
  return (
    <div className={`virtual-scale${dropTarget ? ' is-drop-target' : ''}`}>
      <div className="scale-plate">
        <div ref={trayRef} className="scale-tray" aria-label="Scale weighing tray">
          <span className="scale-tray-rim" />
        </div>
      </div>
      <div className="scale-readout" aria-live="polite">
        <div className="text-[10px] uppercase tracking-[0.2em] text-slate-500">Mass</div>
        <div className="scale-mass" aria-label={`${mass.toFixed(1)} grams`}>
          <span>{mass.toFixed(1)}</span><small>g</small>
        </div>
      </div>
      <div className="scale-status" aria-live="polite">{status}</div>
    </div>
  );
}
