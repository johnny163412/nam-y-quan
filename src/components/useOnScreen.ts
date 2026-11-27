import { RefObject, useEffect, useState } from 'react';

/**
 * True while the element is inside the viewport. All four rooms stay mounted on the sliding track,
 * so animation loops use this to stop drawing in the rooms you are not looking at.
 * Starts true so loops still run where IntersectionObserver is missing (tests, old browsers).
 */
export function useOnScreen(ref: RefObject<Element>): boolean {
  const [onScreen, setOnScreen] = useState(true);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver(([entry]) => setOnScreen(entry.isIntersecting));
    io.observe(el);
    return () => io.disconnect();
  }, [ref]);
  return onScreen;
}
