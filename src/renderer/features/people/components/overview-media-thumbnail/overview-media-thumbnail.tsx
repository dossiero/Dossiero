import { FileAudio, FileText, FileVideo, Image as ImageIcon } from "lucide-react";
import type { MediaItem } from "@shared/types";
import { shortId } from "@/lib/identifier-format";
import "./overview-media-thumbnail.css";

interface OverviewMediaThumbnailProps {
  media: MediaItem;
  url: string;
  onClick: () => void;
}

export function OverviewMediaThumbnail({
  media,
  url,
  onClick,
}: OverviewMediaThumbnailProps) {
  const isImage = media.mimeType.startsWith("image/");
  const isVideo = media.mimeType.startsWith("video/");
  const isAudio = media.mimeType.startsWith("audio/");
  let Icon = FileText;
  if (isVideo) {
    Icon = FileVideo;
  } else if (isAudio) {
    Icon = FileAudio;
  } else if (isImage) {
    Icon = ImageIcon;
  }
  const title = media.caption || media.originalName;

  return (
    <button
      className="person-overview-media"
      type="button"
      title={title}
      aria-label={`Inspect ${title}`}
      onClick={onClick}
    >
      {isImage ? (
        <img src={url} alt="" loading="lazy" draggable={false} />
      ) : (
        <Icon size={20} />
      )}
      <span>{shortId(media.id).slice(0, 4)}</span>
    </button>
  );
}
