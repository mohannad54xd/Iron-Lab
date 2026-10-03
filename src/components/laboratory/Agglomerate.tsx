import { forwardRef } from 'react';
import type { PointerEventHandler } from 'react';
import type { AgglomerateState } from '../../types/sintering';

type AgglomerateProps = {
  agglomerate: AgglomerateState;
  dragging: boolean;
  visible: boolean;
  onPointerDown: PointerEventHandler<HTMLDivElement>;
  onPointerMove: PointerEventHandler<HTMLDivElement>;
  onPointerUp: PointerEventHandler<HTMLDivElement>;
  onPointerCancel: PointerEventHandler<HTMLDivElement>;
};

export const Agglomerate = forwardRef<HTMLDivElement, AgglomerateProps>(function Agglomerate(
  { agglomerate, dragging, visible, onPointerDown, onPointerMove, onPointerUp, onPointerCancel },
  ref,
) {
  return (
    <div
      ref={ref}
      id={agglomerate.id}
      className={`sintering-agglomerate${visible ? ' is-visible' : ''}${dragging ? ' is-dragging' : ''}`}
      style={{ left: `${agglomerate.x}px`, top: `${agglomerate.y}px`, width: `${agglomerate.size}px`, height: `${agglomerate.size * 0.78}px`, rotate: `${agglomerate.rotation}deg` }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerCancel}
      aria-label="Agglomerated ore piece"
      role="img"
      draggable={false}
    >
      <span className="sintering-agglomerate-facet" />
    </div>
  );
});
