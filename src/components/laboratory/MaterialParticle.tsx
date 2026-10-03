import { forwardRef } from 'react';
import type { PointerEventHandler } from 'react';
import type { Particle } from '../../types/concentration';

type MaterialParticleProps = {
  particle: Particle;
  dragging: boolean;
  onPointerDown: PointerEventHandler<HTMLDivElement>;
  onPointerMove: PointerEventHandler<HTMLDivElement>;
  onPointerUp: PointerEventHandler<HTMLDivElement>;
  onPointerCancel: PointerEventHandler<HTMLDivElement>;
};

export const MaterialParticle = forwardRef<HTMLDivElement, MaterialParticleProps>(function MaterialParticle(
  { particle, dragging, onPointerDown, onPointerMove, onPointerUp, onPointerCancel },
  ref,
) {
  return (
    <div
      ref={ref}
      id={particle.id}
      className={`material-particle material-particle--${particle.materialType}${particle.phase === 'attached' ? ' is-attached' : ''}${particle.phase === 'concentrate' || particle.phase === 'impurities' ? ' is-collected' : ''}${dragging ? ' is-dragging' : ''}`}
      style={{ left: `${particle.x}px`, top: `${particle.y}px`, width: `${particle.size}px`, height: `${particle.size}px`, rotate: `${particle.rotation}deg` }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerCancel}
      aria-label="Sample particle"
      title="Sample particle"
      role="img"
      draggable={false}
    />
  );
});
