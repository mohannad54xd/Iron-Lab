import { forwardRef } from 'react';
import type { SeparatorToolProps } from '../../types/concentration';

export const ElectricSeparator = forwardRef<HTMLDivElement, SeparatorToolProps>(function ElectricSeparator(
  { x, y, attachedCount, dragging, onPointerDown, onPointerMove, onPointerUp, onPointerCancel }, ref,
) {
  return (
    <div ref={ref} className={`separation-tool electric-separator${dragging ? ' is-dragging' : ''}`} style={{ left: `${x}px`, top: `${y}px` }} onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerCancel={onPointerCancel} aria-label="Draggable electric separator" role="img" draggable={false}>
      <span className="electric-handle" />
      <span className="electric-plate electric-plate--one" />
      <span className="electric-plate electric-plate--two" />
      {attachedCount > 0 && <span className="tool-load-count">{attachedCount}</span>}
    </div>
  );
});
