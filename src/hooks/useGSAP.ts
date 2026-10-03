import { useEffect, type RefObject } from 'react';
import gsap from 'gsap';

export function useGSAP(target: RefObject<HTMLElement | null>, animation: gsap.TweenVars) {
  useEffect(() => {
    if (!target.current) {
      return;
    }

    gsap.to(target.current, animation);
  }, [animation, target]);
}
