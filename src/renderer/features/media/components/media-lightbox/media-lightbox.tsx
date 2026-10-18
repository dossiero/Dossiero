import * as DialogPrimitive from "@radix-ui/react-dialog";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import "./media-lightbox.css";
import type { MediaLightboxProps } from "./media-lightbox.types";

const GALLERY_CHROME_HIDE_DELAY_MS = 1_800;

export function MediaLightbox({
  open,
  onOpenChange,
  item,
  items,
  mediaUrl,
  onItemChange,
}: MediaLightboxProps) {
  const [chromeVisible, setChromeVisible] = useState(true);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const activeThumbnail = useRef<HTMLButtonElement | null>(null);
  const activeIndex = item ? items.findIndex((candidate) => candidate.id === item.id) : -1;
  const hasPrevious = activeIndex > 0;
  const hasNext = activeIndex >= 0 && activeIndex < items.length - 1;

  const showChrome = useCallback(() => {
    setChromeVisible(true);
    if (hideTimer.current) {
      clearTimeout(hideTimer.current);
    }
    hideTimer.current = setTimeout(
      () => setChromeVisible(false),
      GALLERY_CHROME_HIDE_DELAY_MS,
    );
  }, []);

  const navigate = useCallback((offset: number) => {
    const nextItem = items[activeIndex + offset];
    if (nextItem) {
      onItemChange(nextItem);
    }
  }, [activeIndex, items, onItemChange]);

  useEffect(() => {
    if (!open) {
      return;
    }
    showChrome();
    return () => {
      if (hideTimer.current) {
        clearTimeout(hideTimer.current);
      }
    };
  }, [open, item?.id, showChrome]);

  useEffect(() => {
    if (open) {
      activeThumbnail.current?.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "center",
      });
    }
  }, [open, item?.id]);

  useEffect(() => {
    if (!open) {
      return;
    }
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "ArrowLeft" && hasPrevious) {
        event.preventDefault();
        navigate(-1);
      }
      if (event.key === "ArrowRight" && hasNext) {
        event.preventDefault();
        navigate(1);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [hasNext, hasPrevious, navigate, open]);

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="gallery-overlay" />
        <DialogPrimitive.Content
          className="gallery-dialog"
          onPointerMove={showChrome}
          onPointerDown={showChrome}
          aria-describedby={undefined}
        >
          <DialogPrimitive.Title className="gallery-title">
            {item?.caption || item?.originalName || "Evidence preview"}
          </DialogPrimitive.Title>
          {item && (
            <>
              <div className="gallery-stage">
                {item.mimeType.startsWith("video/") ? (
                  <video
                    key={item.id}
                    src={mediaUrl(item)}
                    autoPlay
                    controls
                    playsInline
                    draggable={false}
                  />
                ) : (
                  <img
                    key={item.id}
                    src={mediaUrl(item)}
                    alt={item.caption || item.originalName}
                    draggable={false}
                  />
                )}
              </div>
              <div className={`gallery-chrome ${chromeVisible ? "is-visible" : ""}`}>
                <div className="gallery-topbar">
                  <div>
                    <strong>{item.caption || item.originalName}</strong>
                    <span>{activeIndex + 1} / {items.length} · {item.mimeType}</span>
                  </div>
                  <DialogPrimitive.Close asChild>
                    <button className="gallery-close" aria-label="Close gallery">
                      <X size={22} />
                    </button>
                  </DialogPrimitive.Close>
                </div>
                <button
                  className="gallery-arrow gallery-arrow--left"
                  disabled={!hasPrevious}
                  onClick={() => navigate(-1)}
                  aria-label="Previous media"
                >
                  <ChevronLeft size={32} />
                </button>
                <button
                  className="gallery-arrow gallery-arrow--right"
                  disabled={!hasNext}
                  onClick={() => navigate(1)}
                  aria-label="Next media"
                >
                  <ChevronRight size={32} />
                </button>
                <div className="gallery-thumbnails" aria-label="Media thumbnails">
                  <div className="gallery-thumbnails-track">
                    {items.map((candidate, candidateIndex) => {
                      const candidateUrl = mediaUrl(candidate);
                      const isActive = candidate.id === item.id;
                      return (
                        <button
                          ref={isActive ? activeThumbnail : null}
                          key={candidate.id}
                          className={`gallery-thumbnail ${isActive ? "is-active" : ""}`}
                          onClick={() => onItemChange(candidate)}
                          aria-label={`View ${candidate.caption || candidate.originalName}`}
                          aria-current={isActive ? "true" : undefined}
                        >
                          {candidate.mimeType.startsWith("video/") ? (
                            <>
                              <video src={candidateUrl} muted preload="metadata" draggable={false} />
                              <span className="gallery-video-mark">▶</span>
                            </>
                          ) : (
                            <img src={candidateUrl} alt="" draggable={false} />
                          )}
                          <small>{String(candidateIndex + 1).padStart(2, "0")}</small>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
