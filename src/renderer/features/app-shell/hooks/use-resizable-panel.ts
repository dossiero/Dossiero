import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type PointerEvent,
} from "react";

const KEYBOARD_RESIZE_STEP = 12;

interface UseResizablePanelOptions {
  collapsedWidth?: number;
  defaultWidth: number;
  direction?: 1 | -1;
  maximumWidth: number;
  minimumWidth: number;
  onCompactChange?: (compact: boolean) => void;
  snapThreshold?: number;
  storageKey: string;
}

function readStoredWidth(
  storageKey: string,
  defaultWidth: number,
  minimumWidth: number,
  maximumWidth: number,
  collapsedWidth?: number,
  snapThreshold?: number,
): number {
  const storedWidth = Number.parseFloat(localStorage.getItem(storageKey) ?? "");
  const requestedWidth = Number.isFinite(storedWidth) ? storedWidth : defaultWidth;
  if (
    collapsedWidth !== undefined
    && snapThreshold !== undefined
    && requestedWidth < snapThreshold
  ) {
    return collapsedWidth;
  }

  return Math.max(minimumWidth, Math.min(maximumWidth, requestedWidth));
}

export function useResizablePanel({
  collapsedWidth,
  defaultWidth,
  direction = 1,
  maximumWidth,
  minimumWidth,
  onCompactChange,
  snapThreshold,
  storageKey,
}: UseResizablePanelOptions) {
  const [width, setWidth] = useState(() => readStoredWidth(
    storageKey,
    defaultWidth,
    minimumWidth,
    maximumWidth,
    collapsedWidth,
    snapThreshold,
  ));
  const dragStartRef = useRef<{ pointerX: number; width: number } | null>(null);

  const resize = useCallback((requestedWidth: number) => {
    const shouldCompact = collapsedWidth !== undefined
      && snapThreshold !== undefined
      && requestedWidth < snapThreshold;
    const nextWidth = shouldCompact
      ? collapsedWidth
      : Math.max(minimumWidth, Math.min(maximumWidth, requestedWidth));
    setWidth(nextWidth);
  }, [collapsedWidth, maximumWidth, minimumWidth, snapThreshold]);

  useEffect(() => {
    localStorage.setItem(storageKey, String(width));
  }, [storageKey, width]);

  useLayoutEffect(() => {
    const compact = collapsedWidth !== undefined && width <= collapsedWidth;
    onCompactChange?.(compact);
  }, [collapsedWidth, onCompactChange, width]);

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    dragStartRef.current = {
      pointerX: event.clientX,
      width,
    };
  };

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const dragStart = dragStartRef.current;
    if (!dragStart) {
      return;
    }

    resize(dragStart.width + (event.clientX - dragStart.pointerX) * direction);
  };

  const handlePointerUp = (event: PointerEvent<HTMLDivElement>) => {
    dragStartRef.current = null;
    event.currentTarget.releasePointerCapture(event.pointerId);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") {
      return;
    }

    event.preventDefault();
    const keyboardDirection = event.key === "ArrowRight" ? 1 : -1;
    const resizeDirection = keyboardDirection * direction;
    const compact = collapsedWidth !== undefined && width <= collapsedWidth;
    const expandedKeyboardWidth = snapThreshold !== undefined
      ? snapThreshold + KEYBOARD_RESIZE_STEP
      : minimumWidth;
    const nextWidth = compact && resizeDirection > 0
      ? expandedKeyboardWidth
      : width + KEYBOARD_RESIZE_STEP * resizeDirection;
    resize(nextWidth);
  };

  return {
    width,
    resizeHandleProps: {
      onKeyDown: handleKeyDown,
      onPointerDown: handlePointerDown,
      onPointerMove: handlePointerMove,
      onPointerUp: handlePointerUp,
      role: "separator",
      tabIndex: 0,
    },
  };
}
