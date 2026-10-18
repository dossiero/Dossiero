import { ArchiveAlert } from "@/components/archive-alert/archive-alert";
import { DeleteAlert } from "@/components/delete-alert/delete-alert";
import { RemoveTabAlert } from "@/components/remove-tab-alert/remove-tab-alert";
import { LinkDialog } from "@/features/links/components/link-dialog/link-dialog";
import { MediaEditDialog } from "@/features/media/components/media-edit-dialog/media-edit-dialog";
import { MediaLightbox } from "@/features/media/components/media-lightbox/media-lightbox";
import { PersonDialog } from "@/features/people/components/person-dialog/person-dialog";
import { CaseDialog } from "@/features/cases/components/case-dialog/case-dialog";
import { RelationPersonDialog } from "@/features/relations/components/relation-person-dialog/relation-person-dialog";
import { RelationTypeDialog } from "@/features/relations/components/relation-type-dialog/relation-type-dialog";
import { SettingsWindow } from "@/features/settings/components/settings-window/settings-window";
import { AddTabDialog } from "@/features/tabs/components/add-tab-dialog/add-tab-dialog";
import { EditTabDialog } from "@/features/tabs/components/edit-tab-dialog/edit-tab-dialog";
import type { AppDialogsProps } from "./app-dialogs.types";

export function AppDialogs({
  api,
  settings,
  bundle,
  activeTab,
  personDialog,
  caseDialogOpen,
  relationPersonTarget,
  relationPersonEdit,
  relationEdit,
  archiveTarget,
  tabDialogOpen,
  tabEdit,
  tabRemove,
  nextTabAfterRemoval,
  linkDialog,
  mediaEdit,
  deleteTarget,
  lightbox,
  settingsOpen,
  onPersonDialogChange,
  onCaseDialogOpenChange,
  onRelationPersonTargetChange,
  onRelationPersonEditChange,
  onRelationEditChange,
  onArchiveTargetChange,
  onTabDialogOpenChange,
  onTabEditChange,
  onTabRemoveChange,
  onLinkDialogChange,
  onMediaEditChange,
  onDeleteTargetChange,
  onLightboxChange,
  onSettingsOpenChange,
  onSavePerson,
  onSaveCase,
  onConfirmArchive,
  onSettingsUpdate,
  run,
}: AppDialogsProps) {
  return (
    <>
      <PersonDialog
        open={personDialog !== null}
        onOpenChange={(open) => !open && onPersonDialogChange(null)}
        person={personDialog === "add" ? null : personDialog}
        onSave={onSavePerson}
      />
      <CaseDialog
        open={caseDialogOpen}
        onOpenChange={onCaseDialogOpenChange}
        onSave={onSaveCase}
      />
      <RelationPersonDialog
        open={relationPersonTarget !== null}
        onOpenChange={(open) => !open && onRelationPersonTargetChange(null)}
        targetName={relationPersonTarget?.name ?? bundle?.person.name ?? "current subject"}
        onSave={async (relationType, input) => {
          if (bundle && activeTab?.kind === "relation" && relationPersonTarget) {
            await run(
              () => api.createRelatedPerson(
                bundle.person.id,
                activeTab.id,
                relationPersonTarget.id,
                relationType,
                input,
              ),
              "related person added",
            );
          }
        }}
      />
      <RelationPersonDialog
        open={relationPersonEdit !== null}
        onOpenChange={(open) => !open && onRelationPersonEditChange(null)}
        targetName={relationPersonEdit?.targetName ?? "connected person"}
        person={relationPersonEdit?.person}
        initialRelationType={relationPersonEdit?.relationship.relationType}
        onSave={async (relationType, input) => {
          if (relationPersonEdit) {
            await run(async () => {
              await Promise.all([
                api.updatePerson(relationPersonEdit.person.id, input),
                api.updateRelationship(relationPersonEdit.relationship.id, relationType),
              ]);
            }, "related person updated");
          }
        }}
      />
      <RelationTypeDialog
        open={relationEdit !== null}
        onOpenChange={(open) => !open && onRelationEditChange(null)}
        value={relationEdit?.relationType ?? ""}
        onSave={async (relationType) => {
          if (relationEdit) {
            await run(
              () => api.updateRelationship(relationEdit.id, relationType),
              "relationship updated",
            );
          }
        }}
      />
      <ArchiveAlert
        open={archiveTarget !== null}
        onOpenChange={(open) => !open && onArchiveTargetChange(null)}
        subject={archiveTarget?.name ?? ""}
        onConfirm={onConfirmArchive}
      />
      <AddTabDialog
        open={tabDialogOpen}
        onOpenChange={onTabDialogOpenChange}
        onSave={async (input) => {
          if (bundle) {
            await run(() => api.createTab(bundle.person.id, input), "tab initialized");
          }
        }}
      />
      <EditTabDialog
        open={tabEdit !== null}
        onOpenChange={(open) => !open && onTabEditChange(null)}
        tab={tabEdit}
        onSave={async (input) => {
          if (tabEdit) {
            await run(() => api.updateTab(tabEdit.id, input), "tab updated");
          }
        }}
      />
      <RemoveTabAlert
        open={tabRemove !== null}
        onOpenChange={(open) => !open && onTabRemoveChange(null)}
        tabName={tabRemove?.name ?? ""}
        nextTabName={nextTabAfterRemoval?.name}
        onConfirm={() => {
          const tab = tabRemove;
          onTabRemoveChange(null);
          if (tab) {
            void run(() => api.deleteTab(tab.id), "tab removed");
          }
        }}
      />
      <LinkDialog
        open={linkDialog !== null}
        onOpenChange={(open) => !open && onLinkDialogChange(null)}
        link={linkDialog === "new" ? null : linkDialog}
        onSave={async (input) => {
          if (!bundle || !activeTab) {
            return;
          }
          if (linkDialog && linkDialog !== "new") {
            await run(() => api.updateLink(linkDialog.id, input), "source node updated");
            return;
          }
          await run(
            () => api.createLink({
              personId: bundle.person.id,
              tabId: activeTab.id,
              ...input,
            }),
            "source node attached",
          );
        }}
      />
      <MediaEditDialog
        open={mediaEdit !== null}
        onOpenChange={(open) => !open && onMediaEditChange(null)}
        item={mediaEdit}
        onSave={async (input) => {
          if (mediaEdit) {
            await run(() => api.updateMedia(mediaEdit.id, input), "evidence metadata updated");
          }
        }}
      />
      <DeleteAlert
        open={deleteTarget !== null}
        onOpenChange={(open) => !open && onDeleteTargetChange(null)}
        subject={deleteTarget?.label ?? ""}
        confirmText={deleteTarget?.confirmText}
        description={deleteTarget?.description}
        confirmLabel={deleteTarget?.confirmLabel}
        onConfirm={() => {
          const target = deleteTarget;
          onDeleteTargetChange(null);
          if (target) {
            void run(target.run, target.successMessage ?? "object deleted");
          }
        }}
      />
      <MediaLightbox
        open={lightbox !== null}
        onOpenChange={(open) => !open && onLightboxChange(null)}
        item={lightbox}
        items={(bundle?.mediaItems ?? []).filter((mediaItem) => (
          mediaItem.tabId === lightbox?.tabId
          && (
            mediaItem.mimeType.startsWith("image/")
            || mediaItem.mimeType.startsWith("video/")
          )
        ))}
        mediaUrl={(mediaItem) => api.mediaUrl(mediaItem)}
        onItemChange={onLightboxChange}
      />
      <SettingsWindow
        open={settingsOpen}
        onOpenChange={onSettingsOpenChange}
        api={api}
        settings={settings}
        onUpdate={onSettingsUpdate}
      />
    </>
  );
}
