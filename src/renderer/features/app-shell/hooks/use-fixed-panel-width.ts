import {
  useCallback,
  useLayoutEffect,
  useRef,
  type RefObject,
} from "react";
import type { ImperativePanelHandle } from "react-resizable-panels";

interface UseFixedPanelWidthOptions {
  containerRef: RefObject<HTMLElement | null>;
  panelRef: RefObject<ImperativePanelHandle | null>;
  collapsedWidth?: number;
  enabled?: boolean;
}

export function useFixedPanelWidth({
  containerRef,
  panelRef,
  collapsedWidth,
  enabled = true,
}: UseFixedPanelWidthOptions) {
  const desiredWidthRef = useRef<number | null>(null);
  const containerWidthRef = useRef(0);
  const applyingWidthRef = useRef(false);

  const handleResize = useCallback((size: number) => {
    if (applyingWidthRef.current || panelRef.current?.isCollapsed()) {
      return;
    }

    const containerWidth = containerWidthRef.current
      || containerRef.current?.getBoundingClientRect().width
      || 0;
    if (containerWidth > 0) {
      desiredWidthRef.current = size * containerWidth / 100;
    }
  }, [containerRef, panelRef]);

  useLayoutEffect(() => {
    if (!enabled) {
      containerWidthRef.current = 0;
      return;
    }

    const container = containerRef.current;
    if (!container) {
      return;
    }

    const preservePanelWidth = () => {
      const panel = panelRef.current;
      const containerWidth = container.getBoundingClientRect().width;
      if (!panel || containerWidth <= 0) {
        return;
      }

      if (containerWidthRef.current === 0) {
        containerWidthRef.current = containerWidth;
        desiredWidthRef.current = panel.getSize() * containerWidth / 100;
        return;
      }

      const targetWidth = panel.isCollapsed()
        ? collapsedWidth
        : desiredWidthRef.current;
      containerWidthRef.current = containerWidth;
      if (targetWidth === undefined || targetWidth === null) {
        return;
      }

      applyingWidthRef.current = true;
      panel.resize(targetWidth * 100 / containerWidth);
      applyingWidthRef.current = false;
    };

    preservePanelWidth();
    const observer = new ResizeObserver(preservePanelWidth);
    observer.observe(container);
    return () => observer.disconnect();
  }, [collapsedWidth, containerRef, enabled, panelRef]);

  return handleResize;
}
