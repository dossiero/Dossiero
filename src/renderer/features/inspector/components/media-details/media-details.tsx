import { ChevronRight, Download, FileAudio, FileText, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/button/button";
import { Input, Textarea } from "@/components/form-control/form-control";
import { useDossierApi } from "@/api/use-dossier-api";
import { ExifDetails } from "@/features/inspector/components/exif-details/exif-details";
import { MediaProperty } from "@/features/inspector/components/media-property/media-property";
import { formatDuration, formatImportedAt } from "@/features/inspector/inspector.logic";
import type {
  ExifState,
  MediaProperties,
  MediaUpdateInput,
} from "@/features/inspector/inspector.types";
import { formatBytes } from "@/lib/display-format";
import "./media-details.css";
import type { MediaDetailsProps } from "./media-details.types";

export function MediaDetails({ item, onUpdate, onExport, onClose }: MediaDetailsProps) {
  const api = useDossierApi();
  const [properties, setProperties] = useState<MediaProperties>({});
  const [title, setTitle] = useState(item.caption || item.originalName);
  const [notes, setNotes] = useState(item.notes);
  const [sourceUrl, setSourceUrl] = useState(item.sourceUrl);
  const [propertiesOpen, setPropertiesOpen] = useState(true);
  const [exifOpen, setExifOpen] = useState(false);
  const [exifState, setExifState] = useState<ExifState>({ status: "idle", entries: [] });

  useEffect(() => {
    setProperties({});
    setTitle(item.caption || item.originalName);
    setNotes(item.notes);
    setSourceUrl(item.sourceUrl);
    setPropertiesOpen(true);
    setExifOpen(false);
    setExifState({ status: "idle", entries: [] });

    const mediaUrl = api.mediaUrl(item);
    if (item.mimeType.startsWith("image/")) {
      const image = new Image();
      image.onload = () => setProperties({
        width: image.naturalWidth,
        height: image.naturalHeight,
      });
      image.src = mediaUrl;
      return () => {
        image.onload = null;
        image.src = "";
      };
    }

    if (item.mimeType.startsWith("video/") || item.mimeType.startsWith("audio/")) {
      const elementType = item.mimeType.startsWith("video/") ? "video" : "audio";
      const media = document.createElement(elementType);
      media.preload = "metadata";
      media.onloadedmetadata = () => setProperties({
        duration: Number.isFinite(media.duration) ? media.duration : undefined,
        width: "videoWidth" in media ? media.videoWidth : undefined,
        height: "videoHeight" in media ? media.videoHeight : undefined,
      });
      media.src = mediaUrl;
      return () => {
        media.onloadedmetadata = null;
        media.removeAttribute("src");
        media.load();
      };
    }
  }, [api, item]);

  const toggleExif = () => {
    const nextOpen = !exifOpen;
    setExifOpen(nextOpen);
    if (!nextOpen || exifState.status !== "idle") {
      return;
    }

    setExifState({ status: "loading", entries: [] });
    void import("@/lib/exif")
      .then(({ readExif }) => readExif(item.id, () => api.readMediaBytes(item.id)))
      .then((entries) => setExifState({ status: "ready", entries }))
      .catch((error: unknown) => setExifState({
        status: "error",
        entries: [],
        message: error instanceof Error ? error.message : "Metadata read failed",
      }));
  };

  const save = async (input: MediaUpdateInput) => {
    if (!onUpdate) {
      return;
    }
    try {
      const updated = await onUpdate(item, input);
      setTitle(updated.caption || updated.originalName);
      setNotes(updated.notes);
      setSourceUrl(updated.sourceUrl);
    } catch {
      setTitle(item.caption || item.originalName);
      setNotes(item.notes);
      setSourceUrl(item.sourceUrl);
    }
  };

  const storedTitle = item.caption || item.originalName;
  const previewUrl = api.mediaUrl(item);
  const isImage = item.mimeType.startsWith("image/");
  const isVideo = item.mimeType.startsWith("video/");
  const isAudio = item.mimeType.startsWith("audio/");
  const fileType = item.originalName.split(".").pop()?.toUpperCase()
    || item.mimeType.split("/")[1]?.toUpperCase()
    || "FILE";

  let preview;
  if (isImage) {
    preview = <img src={previewUrl} alt={title} draggable={false} />;
  } else if (isVideo) {
    preview = <video src={previewUrl} controls preload="metadata" draggable={false} />;
  } else if (isAudio) {
    preview = (
      <div className="media-inspector-audio">
        <FileAudio size={38} />
        <audio src={previewUrl} controls preload="metadata" />
      </div>
    );
  } else {
    preview = (
      <div className="media-inspector-file">
        <FileText size={42} />
        <span>{fileType}</span>
      </div>
    );
  }

  return (
    <div className="media-inspector">
      {onClose && (
        <Button
          className="media-inspector-close"
          variant="ghost"
          size="icon"
          onClick={onClose}
          aria-label="Close media details"
        >
          <X size={17} />
        </Button>
      )}
      <div className="media-inspector-preview">{preview}</div>
      <div className="media-inspector-fields">
        <Input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          onBlur={() => {
            if (title !== storedTitle) {
              void save({ caption: title });
            }
          }}
          placeholder="Media title"
          aria-label="Media title"
        />
        <Textarea
          className="media-notes-input"
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          onBlur={() => {
            if (notes !== item.notes) {
              void save({ notes });
            }
          }}
          placeholder="Media notes…"
          aria-label="Media notes"
          rows={3}
        />
        <Input
          type="url"
          value={sourceUrl}
          onChange={(event) => setSourceUrl(event.target.value)}
          onBlur={() => {
            if (sourceUrl !== item.sourceUrl) {
              void save({ sourceUrl });
            }
          }}
          placeholder="https://source.example/file"
          aria-label="Source URL"
        />
      </div>
      <section className={`media-inspector-section ${exifOpen ? "is-open" : ""}`}>
        <button
          className="media-inspector-toggle"
          type="button"
          onClick={toggleExif}
          aria-expanded={exifOpen}
        >
          <span>EXIF</span>
          <ChevronRight size={15} />
        </button>
        {exifOpen && <ExifDetails state={exifState} />}
      </section>
      <section className={`media-inspector-section ${propertiesOpen ? "is-open" : ""}`}>
        <button
          className="media-inspector-toggle"
          type="button"
          onClick={() => setPropertiesOpen((current) => !current)}
          aria-expanded={propertiesOpen}
        >
          <span>PROPERTIES</span>
          <ChevronRight size={15} />
        </button>
        {propertiesOpen && (
          <div className="media-properties">
            <MediaProperty label="Filename" value={item.originalName} />
            {properties.width && properties.height && (
              <MediaProperty
                label="Dimensions"
                value={`${properties.width} × ${properties.height}`}
              />
            )}
            {properties.duration !== undefined && (
              <MediaProperty label="Duration" value={formatDuration(properties.duration)} />
            )}
            <MediaProperty label="Size" value={formatBytes(item.size)} />
            <MediaProperty label="Type" value={fileType} />
            <MediaProperty label="Imported" value={formatImportedAt(item.importedAt)} />
          </div>
        )}
      </section>
      <div className="media-export">
        <Button variant="signal" onClick={() => onExport?.(item)}>
          <Download size={15} /> Export
        </Button>
      </div>
    </div>
  );
}
