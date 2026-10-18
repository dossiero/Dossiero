import type { MouseEvent, ReactNode } from "react";
import {
  FileAudio,
  FileText,
  FileVideo,
  FolderOpen,
  Image as ImageIcon,
  Trash2,
  UserRound,
} from "lucide-react";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/context-menu/context-menu";
import { formatBytes, formatDate } from "@/lib/display-format";
import { shortId } from "@/lib/identifier-format";
import "./media-card.css";
import type { MediaCardProps } from "./media-card.types";

const MEDIA_CARD_REVEAL_DELAY_MS = 35;

export function MediaCard({
  item,
  url,
  index,
  onInspect,
  onShowInFolder,
  onDelete,
  onPreview,
  onSetProfilePhoto,
}: MediaCardProps) {
  const isImage = item.mimeType.startsWith("image/");
  const isVideo = item.mimeType.startsWith("video/");
  const isAudio = item.mimeType.startsWith("audio/");
  const isPreviewable = isImage || isVideo;
  const fileType = item.mimeType.split("/")[1]?.toUpperCase() || "FILE";

  let preview: ReactNode;
  if (isImage && url) {
    preview = <img src={url} alt={item.caption || item.originalName} draggable={false} />;
  } else if (isVideo && url) {
    preview = <video src={url} muted preload="metadata" draggable={false} />;
  } else {
    let FileIcon = FileText;
    if (isVideo) {
      FileIcon = FileVideo;
    } else if (isAudio) {
      FileIcon = FileAudio;
    } else if (isImage) {
      FileIcon = ImageIcon;
    }

    preview = (
      <div className="file-glyph">
        <FileIcon size={34} />
        <span>{fileType}</span>
      </div>
    );
  }

  const openPreview = (event: MouseEvent) => {
    if (!isPreviewable) {
      return;
    }

    event.stopPropagation();
    onPreview();
  };

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <article
          className="media-card panel-brackets"
          style={{ animationDelay: `${index * MEDIA_CARD_REVEAL_DELAY_MS}ms` }}
          onClick={onInspect}
        >
          <div
            className={`media-visual ${isPreviewable ? "is-previewable" : ""}`}
            title={isPreviewable ? "Double-click to open gallery" : undefined}
            onDoubleClick={openPreview}
          >
            {preview}
            <div className="media-scan" />
          </div>
          <div className="media-meta">
            <span className="evidence-id">EV_{shortId(item.id).slice(0, 5)}</span>
            <strong title={item.originalName}>{item.caption || item.originalName}</strong>
            <small>{formatBytes(item.size)} · {formatDate(item.importedAt)}</small>
          </div>
        </article>
      </ContextMenuTrigger>
      <ContextMenuContent>
        {isImage && (
          <>
            <ContextMenuItem onSelect={onSetProfilePhoto}>
              <UserRound size={13} /> Set as profile photo
            </ContextMenuItem>
            <ContextMenuSeparator />
          </>
        )}
        <ContextMenuItem onSelect={onShowInFolder}>
          <FolderOpen size={13} /> Show in folder
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem onSelect={onDelete} danger>
          <Trash2 size={13} /> Remove
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}
