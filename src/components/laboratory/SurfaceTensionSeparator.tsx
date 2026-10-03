import { forwardRef } from 'react';
import type { SeparatorToolProps } from '../../types/concentration';

export const SurfaceTensionSeparator = forwardRef<HTMLDivElement, SeparatorToolProps>(function SurfaceTensionSeparator(
  { x, y, attachedCount, dragging, onPointerDown, onPointerMove, onPointerUp, onPointerCancel }, ref,
) {
  return (
    <div ref={ref} className={`separation-tool surface-separator${dragging ? ' is-dragging' : ''}`} style={{ left: `${x}px`, top: `${y}px` }} onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerCancel={onPointerCancel} aria-label="Draggable surface tension separator" role="img" draggable={false}>
      <span className="surface-handle" />
      <span className="surface-skimmer" />
      <span className="surface-ripple" />
      {attachedCount > 0 && <span className="tool-load-count">{attachedCount}</span>}
    </div>
  );
});
