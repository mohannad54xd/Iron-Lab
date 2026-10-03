import { forwardRef } from 'react';
import type { CollectionTarget } from '../../types/concentration';

type CollectionTrayProps = {
  target: CollectionTarget;
  count: number;
  visible: boolean;
  highlighted: boolean;
};

export const CollectionTray = forwardRef<HTMLDivElement, CollectionTrayProps>(function CollectionTray(
  { target, count, visible, highlighted }, ref,
) {
  return (
    <div ref={ref} className={`collection-tray collection-tray--${target}${visible ? ' is-visible' : ''}${highlighted ? ' is-highlighted' : ''}`} aria-label={target === 'concentrate' ? 'Concentrate collection tray' : 'Removed impurities collection tray'}>
      <div className="collection-tray-rim" />
      <span className="collection-tray-title">{target === 'concentrate' ? 'CONCENTRATE' : 'REMOVED IMPURITIES'}</span>
      <span className="collection-tray-count">{count} collected</span>
    </div>
  );
});
