import { forwardRef } from 'react';
import type { PointerEventHandler } from 'react';

type OreSpecimenProps = {
  position: { x: number; y: number };
  dragging: boolean;
  cracking: boolean;
  disabled: boolean;
  onPointerDown: PointerEventHandler<HTMLDivElement>;
  onPointerMove: PointerEventHandler<HTMLDivElement>;
  onPointerUp: PointerEventHandler<HTMLDivElement>;
  onPointerCancel: PointerEventHandler<HTMLDivElement>;
};

export const OreSpecimen = forwardRef<HTMLDivElement, OreSpecimenProps>(function OreSpecimen(
  { position, dragging, cracking, disabled, onPointerDown, onPointerMove, onPointerUp, onPointerCancel },
  ref,
) {
  return (
    <div
      ref={ref}
      className={`ore-specimen${dragging ? ' is-dragging' : ''}${cracking ? ' is-cracking' : ''}${disabled ? ' is-locked' : ''}`}
      style={{ left: `${position.x}px`, top: `${position.y}px` }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerCancel}
      aria-label="Iron ore specimen"
      role="img"
      draggable={false}
    >
      <span className="ore-facet ore-facet-one" />
      <span className="ore-facet ore-facet-two" />
      <span className="ore-sheen" />
      {cracking && (
        <svg className="ore-fractures" viewBox="0 0 180 170" aria-hidden="true">
          <path d="M93 11 80 45 99 62 77 83 91 102 70 130 78 158" />
          <path d="m80 45-31 8 14 18-22 14" />
          <path d="m99 62 29-13-8 29 24 15" />
          <path d="m77 83-27 19 20 28" />
          <path d="m91 102 29 8-8 31 20 11" />
        </svg>
      )}
    </div>
  );
});
