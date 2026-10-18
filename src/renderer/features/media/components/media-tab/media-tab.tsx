import { Radar, UploadCloud } from "lucide-react";
import { Button } from "@/components/button/button";
import { ProfileContent } from "@/components/profile-content/profile-content";
import { ProfileContentBody } from "@/components/profile-content-body/profile-content-body";
import { ProfileContentHeader } from "@/components/profile-content-header/profile-content-header";
import { ProfileTabEmptyState } from "@/components/profile-tab-empty-state/profile-tab-empty-state";
import { MediaCard } from "@/features/media/components/media-card/media-card";
import "./media-tab.css";
import type { MediaTabProps } from "./media-tab.types";
import { useMediaIngest } from "./use-media-ingest";

export function MediaTab({
  tab,
  items,
  mediaUrl,
  onFiles,
  onNativePick,
  onInspect,
  onShowInFolder,
  onDelete,
  onPreview,
  onSetProfilePhoto,
  desktop,
}: MediaTabProps) {
  const {
    fileInputRef,
    isDragging,
    ingestFiles,
    handleDragEnter,
    handleDragOver,
    handleDragLeave,
    handleDrop,
  } = useMediaIngest({ onFiles });
  const entryCount = String(items.length).padStart(2, "0");

  const chooseFiles = () => {
    if (desktop) {
      onNativePick();
      return;
    }

    fileInputRef.current?.click();
  };

  return (
    <ProfileContent
      className={`media-tab ${isDragging ? "is-dragging" : ""}`}
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <ProfileContentHeader
        eyebrow={`EVIDENCE_VAULT / ENTRIES:${entryCount}`}
        title={tab.name}
        actions={(
          <>
            <input
              ref={fileInputRef}
              hidden
              multiple
              type="file"
              onChange={(event) => {
                if (event.target.files) {
                  void ingestFiles(event.target.files);
                }
                event.target.value = "";
              }}
            />
            <Button variant="signal" size="sm" onClick={chooseFiles}>
              <UploadCloud size={13} /> Import evidence
            </Button>
          </>
        )}
      />
      <ProfileContentBody>
        {items.length > 0 ? (
          <div className="media-grid">
            {items.map((item, index) => (
              <MediaCard
                key={item.id}
                item={item}
                url={mediaUrl(item)}
                index={index}
                onInspect={() => onInspect(item)}
                onShowInFolder={() => onShowInFolder(item)}
                onDelete={() => onDelete(item)}
                onPreview={() => onPreview(item)}
                onSetProfilePhoto={() => onSetProfilePhoto(item)}
              />
            ))}
          </div>
        ) : (
          <ProfileTabEmptyState
            icon={Radar}
            title="// EVIDENCE ARRAY EMPTY"
            description="Drag a file here or paste a copied image to begin the contact sheet."
            actionLabel="Initialize channel"
            onAction={() => fileInputRef.current?.click()}
          />
        )}
      </ProfileContentBody>
    </ProfileContent>
  );
}
