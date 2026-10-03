import { forwardRef } from 'react';
import type { SeparatorToolProps } from '../../types/concentration';

export const MagneticSeparator = forwardRef<HTMLDivElement, SeparatorToolProps>(function MagneticSeparator(
  { x, y, attachedCount, dragging, onPointerDown, onPointerMove, onPointerUp, onPointerCancel }, ref,
) {
  return (
    <div ref={ref} className={`separation-tool magnetic-separator${dragging ? ' is-dragging' : ''}`} style={{ left: `${x}px`, top: `${y}px` }} onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerCancel={onPointerCancel} aria-label="Draggable magnetic separator" role="img" draggable={false}>
      <span className="magnet-yoke" />
      <span className="magnet-pole magnet-pole--north">N</span>
      <span className="magnet-pole magnet-pole--south">S</span>
      {attachedCount > 0 && <span className="tool-load-count">{attachedCount}</span>}
    </div>
  );
});
