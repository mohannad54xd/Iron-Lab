import { forwardRef } from 'react';
import type { PointerEventHandler } from 'react';

type CrusherProps = {
  position: { x: number; y: number };
  locked: boolean;
  spent: boolean;
  dragging: boolean;
  nearOre: boolean;
  onPointerDown: PointerEventHandler<HTMLDivElement>;
  onPointerMove: PointerEventHandler<HTMLDivElement>;
  onPointerUp: PointerEventHandler<HTMLDivElement>;
  onPointerCancel: PointerEventHandler<HTMLDivElement>;
};

export const Crusher = forwardRef<HTMLDivElement, CrusherProps>(function Crusher(
  { position, locked, spent, dragging, nearOre, onPointerDown, onPointerMove, onPointerUp, onPointerCancel },
  ref,
) {
  return (
    <div
      ref={ref}
      className={`crusher-tool${locked ? ' is-locked' : ''}${spent ? ' is-spent' : ''}${dragging ? ' is-dragging' : ''}${nearOre ? ' is-near' : ''}`}
      style={{ left: `${position.x}px`, top: `${position.y}px` }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerCancel}
      aria-label={locked ? 'Crusher locked until the ore is weighed' : 'Draggable iron ore crusher'}
      role="img"
      draggable={false}
    >
      <span className="crusher-handle" />
      <span className="crusher-grip" />
      <span className="crusher-head">
        <span className="crusher-head-highlight" />
      </span>
    </div>
  );
});
