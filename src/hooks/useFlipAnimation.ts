import { useCallback, useLayoutEffect, useRef } from "react";

/**
 * FLIP (First, Last, Invert, Play) animation hook for animating row reordering.
 *
 * Usage:
 * 1. Call `useFlipAnimation(animationKey)` — only when ORDER BY stage is active.
 * 2. Pass `registerRow(rowId, el)` as a ref callback on each <tr>.
 * 3. On animationKey change (new stage), the hook:
 *    - Reads "Last" positions from the DOM (after React has committed)
 *    - Compares them to "First" positions captured from the previous render
 *    - Applies an inverted CSS transform to each row that moved
 *    - Removes the transform with a CSS transition so the row slides into place
 *
 * Only activates for rows that were present in both the previous and current
 * render. Added/removed rows are left to CSS keyframe animations.
 */
export function useFlipAnimation(animationKey: number) {
  /**
   * "First" positions: captured at the end of each render cycle so they are
   * ready as the "previous" positions when the next render fires.
   */
  const firstPositions = useRef<Map<string, number>>(new Map());

  /**
   * Live element refs keyed by _rowId.
   */
  const elements = useRef<Map<string, HTMLTableRowElement>>(new Map());

  /**
   * Register / unregister a row element. Called as a ref callback on <tr>.
   */
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

    // Compare each currently mounted row's position to where it was before.
    for (const [id, el] of elements.current.entries()) {
      const fromY = prev.get(id);
      if (fromY === undefined) continue; // new row — CSS animation handles it

      const toRect = el.getBoundingClientRect();
      const dy = fromY - toRect.top;

      if (Math.abs(dy) < 1) continue; // sub-pixel diff, skip

      movers.push({ el, dy });
    }

    // Apply inverted transform synchronously (before browser paint).
    for (const { el, dy } of movers) {
      el.style.transform = `translateY(${dy}px)`;
      el.style.transition = "none";
    }

    if (movers.length > 0) {
      // Force a style recalculation then animate to final position.
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          for (const { el } of movers) {
            el.style.transition =
              "transform 550ms cubic-bezier(0.22, 1, 0.36, 1)";
            el.style.transform = "";
          }
        });
      });
    }

    // Capture "First" positions for the NEXT render cycle.
    const snapshot = new Map<string, number>();
    for (const [id, el] of elements.current.entries()) {
      snapshot.set(id, el.getBoundingClientRect().top);
    }
    firstPositions.current = snapshot;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [animationKey]);

  return { registerRow };
}
