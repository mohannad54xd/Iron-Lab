import { forwardRef } from 'react';

type ParticleBedProps = {
  ready: boolean;
  placedCount: number;
  totalCount: number;
};

export const ParticleBed = forwardRef<HTMLDivElement, ParticleBedProps>(function ParticleBed(
  { ready, placedCount, totalCount },
  ref,
) {
  return (
    <div ref={ref} className={`sintering-particle-bed${ready ? ' is-ready' : ''}`} aria-label="Sintering particle bed">
      <span className="particle-bed-caption">
        {ready ? 'FINE ORE LOADED' : `${placedCount} / ${totalCount} FINE PARTICLES`}
      </span>
      <span className="particle-bed-grain-line" />
    </div>
  );
});
