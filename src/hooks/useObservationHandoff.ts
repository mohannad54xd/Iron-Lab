import { useEffect, type RefObject } from 'react';
import gsap from 'gsap';

function useElementHandoff(ready: boolean, targetRef: RefObject<HTMLElement | null>, delay: number) {
  useEffect(() => {
    const target = targetRef.current;
    if (!ready || !target) return;

    let reveal: gsap.core.Tween | null = null;
    const timeout = window.setTimeout(() => {
      const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      target.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'center' });
      if (!reducedMotion) {
        reveal = gsap.fromTo(target, { y: 10, opacity: 0.72 }, {
          y: 0,
          opacity: 1,
          duration: 0.42,
          ease: 'power2.out',
          clearProps: 'transform,opacity',
        });
      }
    }, delay);

    return () => {
      window.clearTimeout(timeout);
      reveal?.kill();
    };
  }, [ready, targetRef, delay]);
}

export function useObservationHandoff(ready: boolean, targetRef: RefObject<HTMLElement | null>, delay = 750) {
  useElementHandoff(ready, targetRef, delay);
}

export function useContinueHandoff(ready: boolean, targetRef: RefObject<HTMLElement | null>) {
  useElementHandoff(ready, targetRef, 100);
}