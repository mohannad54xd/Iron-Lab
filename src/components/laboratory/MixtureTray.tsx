import { forwardRef } from 'react';

type MixtureTrayProps = {
  remaining: number;
  active: boolean;
};

export const MixtureTray = forwardRef<HTMLDivElement, MixtureTrayProps>(function MixtureTray({ remaining, active }, ref) {
  return (
    <div ref={ref} className={`mixture-tray${active ? ' is-active' : ''}`} aria-label="Mixed sample tray">
      <div className="mixture-tray-lip" />
      <div className="mixture-tray-label">MIXED SAMPLE</div>
      <div className="mixture-tray-count">{remaining} particles remain</div>
    </div>
  );
});
