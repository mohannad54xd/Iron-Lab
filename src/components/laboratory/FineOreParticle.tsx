import { forwardRef } from 'react';
import type { PointerEventHandler } from 'react';

export type FineOreParticleProps = {
  id: string;
  x: number;
  y: number;
  size: number;
  rotation: number;
  placed: boolean;
  dragging: boolean;
  disabled: boolean;
  onPointerDown: PointerEventHandler<HTMLDivElement>;
  onPointerMove: PointerEventHandler<HTMLDivElement>;
  onPointerUp: PointerEventHandler<HTMLDivElement>;
  onPointerCancel: PointerEventHandler<HTMLDivElement>;
};

export const FineOreParticle = forwardRef<HTMLDivElement, FineOreParticleProps>(function FineOreParticle(
  { id, x, y, size, rotation, placed, dragging, disabled, onPointerDown, onPointerMove, onPointerUp, onPointerCancel },
  ref,
) {
  return (
    <div
      ref={ref}
      id={id}
      className={`sintering-fine-particle${placed ? ' is-placed' : ''}${dragging ? ' is-dragging' : ''}${disabled ? ' is-disabled' : ''}`}
      style={{ left: `${x}px`, top: `${y}px`, width: `${size}px`, height: `${size}px`, rotate: `${rotation}deg` }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerCancel}
      aria-label="Fine iron ore particle"
      role="img"
      draggable={false}
    />
  );
});
