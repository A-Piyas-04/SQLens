import { useCallback, useLayoutEffect, useRef } from "react";

type Options = {
  durationMs?: number;
  onComplete?: () => void;
};

export function useFlipAnimation(animationKey: number, options?: Options) {
  const firstPositions = useRef<Map<string, number>>(new Map());
  const elements = useRef<Map<string, HTMLTableRowElement>>(new Map());

  const registerRow = useCallback(
    (id: string, el: HTMLTableRowElement | null) => {
      if (el) {
        elements.current.set(id, el);
      } else {
        elements.current.delete(id);
      }
    },
    []
  );

  useLayoutEffect(() => {
    const prev = firstPositions.current;
    const movers: Array<{ el: HTMLTableRowElement; dy: number }> = [];

    if (animationKey >= 0) {
      for (const [id, el] of elements.current.entries()) {
        const fromY = prev.get(id);
        if (fromY === undefined) continue;

        const toRect = el.getBoundingClientRect();
        const dy = fromY - toRect.top;

        if (Math.abs(dy) < 1) continue;

        movers.push({ el, dy });
      }

      for (const { el, dy } of movers) {
        el.style.transform = `translateY(${dy}px)`;
        el.style.transition = "none";
      }

      if (movers.length > 0) {
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            for (const { el, dy } of movers) {
              const duration = options?.durationMs ?? 550;
              if (Math.abs(dy) > 20) {
                el.setAttribute("data-pb-flip-glow", "true");
                el.classList.add("pb-row-sliding");
              }
              el.style.transition =
                `transform ${duration}ms cubic-bezier(0.22, 1, 0.36, 1), filter ${duration}ms ease`;
              el.style.transform = "";
              setTimeout(() => {
                el.removeAttribute("data-pb-flip-glow");
                el.classList.remove("pb-row-sliding");
                el.style.filter = "";
              }, duration + 50);
            }
            if (options?.onComplete) {
              setTimeout(options.onComplete, options.durationMs ?? 550);
            }
          });
        });
      }
    }

    const snapshot = new Map<string, number>();
    for (const [id, el] of elements.current.entries()) {
      snapshot.set(id, el.getBoundingClientRect().top);
    }
    firstPositions.current = snapshot;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [animationKey]);

  return { registerRow };
}
