import { lazy, Suspense } from "react";
import { resolvedAppearance } from "@/app/view-state";
import { LinksTab } from "@/features/links/components/links-tab/links-tab";
import { MediaTab } from "@/features/media/components/media-tab/media-tab";
import { RelationTab } from "@/features/relations/components/relation-tab/relation-tab";
import { TextTab } from "@/features/text-document/components/text-tab/text-tab";
import "./active-tab-content.css";
import type { ActiveTabContentProps } from "./active-tab-content.types";

const MapTab = lazy(async () => {
  const mapModule = await import("@/features/map/components/map-tab/map-tab");
  return { default: mapModule.MapTab };
});

export function ActiveTabContent({
  api,
  bundle,
  tab,
  settings,
  run,
  desktopAction,
  onBundleChange,
  onInspect,
  onRelationAdd,
  onRelationPersonEdit,
  onRelationEdit,
  onRelatedPersonOpen,
  onPersonArchive,
  onRelationshipDelete,
  onRelationMove,
  onNewLink,
  onEditLink,
  onDeleteRequest,
  onPreview,
}: ActiveTabContentProps) {
  if (tab.kind === "text") {
    return (
      <TextTab
        key={tab.id}
        tab={tab}
        document={bundle.textDocuments.find((document) => document.tabId === tab.id)}
        onSave={async (content) => {
          const savedDocument = await api.saveTextDocument({
            personId: bundle.person.id,
            tabId: tab.id,
            content,
          });
          onBundleChange((currentBundle) => ({
            ...currentBundle,
            textDocuments: [
              ...currentBundle.textDocuments.filter((document) => document.tabId !== tab.id),
              savedDocument,
            ],
          }));
        }}
      />
    );
  }

  if (tab.kind === "media") {
    return (
      <MediaTab
        tab={tab}
        items={bundle.mediaItems.filter((mediaItem) => mediaItem.tabId === tab.id)}
        mediaUrl={(mediaItem) => api.mediaUrl(mediaItem)}
        desktop={api.capabilities.nativeFileDialog}
        onFiles={(files) => {
          void run(
            () => api.uploadMedia(bundle.person.id, tab.id, files),
            "evidence ingested",
          );
        }}
        onNativePick={() => {
          void run(
            () => api.chooseMedia(bundle.person.id, tab.id),
            "evidence ingested",
          );
        }}
        onInspect={onInspect}
        onShowInFolder={(mediaItem) => {
          void desktopAction(() => api.showMediaInFolder(mediaItem.id));
        }}
        onDelete={(mediaItem) => onDeleteRequest({
          label: mediaItem.originalName,
          run: () => api.deleteMedia(mediaItem.id),
        })}
        onPreview={onPreview}
        onSetProfilePhoto={(mediaItem) => {
          void run(
            () => api.setProfilePhoto(bundle.person.id, mediaItem.id),
            "profile photo updated",
          );
        }}
      />
    );
  }

  if (tab.kind === "relation") {
    const relationships = bundle.relationships.filter(
      (relationship) => relationship.tabId === tab.id,
    );
    const personIds = new Set(
      relationships.map((relationship) => relationship.relatedPersonId),
    );
    return (
      <RelationTab
        tab={tab}
        person={bundle.person}
        people={bundle.relatedPeople.filter((person) => personIds.has(person.id))}
        relationships={relationships}
        positions={bundle.relationPositions.filter((position) => position.tabId === tab.id)}
        avatarUrl={(person) => person.profilePhotoId
          ? api.profileThumbnailUrl({ id: person.profilePhotoId })
          : undefined}
        onAdd={() => onRelationAdd(bundle.person)}
        onAddConnection={onRelationAdd}
        onInspect={onInspect}
        onOpenPerson={onRelatedPersonOpen}
        onEditPerson={onRelationPersonEdit}
        onEditRelationship={onRelationEdit}
        onDeleteRelationship={(relationship) => {
          const relatedName = bundle.relatedPeople.find(
            (person) => person.id === relationship.relatedPersonId,
          )?.name ?? "related person";
          onRelationshipDelete(relationship, relatedName);
        }}
        onRemovePerson={onPersonArchive}
        onMove={onRelationMove}
      />
    );
  }

  if (tab.kind === "map") {
    return (
      <Suspense fallback={<div className="map-tab" aria-busy="true" />}>
        <MapTab
          tab={tab}
          document={bundle.maps.find((mapDocument) => mapDocument.tabId === tab.id)}
          themeKey={`${settings.theme}:${resolvedAppearance(settings.appearance)}`}
          onSave={async (features, folders) => {
            const savedMap = await api.saveMapDocument({
              personId: bundle.person.id,
              tabId: tab.id,
              features,
              folders,
            });
            onBundleChange((currentBundle) => ({
              ...currentBundle,
              maps: [
                ...currentBundle.maps.filter((mapDocument) => mapDocument.tabId !== tab.id),
                savedMap,
              ],
            }));
            return savedMap;
          }}
        />
      </Suspense>
    );
  }

  return (
    <LinksTab
      tab={tab}
      links={bundle.links.filter((link) => link.tabId === tab.id)}
      iconUrl={(link) => api.linkIconUrl(link)}
      onAdd={onNewLink}
      onEdit={onEditLink}
      onDelete={(link) => onDeleteRequest({
        label: `source “${link.label}”`,
        run: () => api.deleteLink(link.id),
      })}
    />
  );
}
