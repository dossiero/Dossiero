import { Toaster } from "sonner";
import { useDossierApi } from "@/api/use-dossier-api";
import type { SelectedObject } from "@/app/app.types";
import { resolvedAppearance } from "@/app/view-state";
import {
  PERSON_SIDEBAR_BREAKPOINT,
  WIDE_WORKSPACE_BREAKPOINT,
} from "@/app/layout-constants";
import { AppToolbar } from "@/components/app-toolbar/app-toolbar";
import { InspectorPanel } from "@/features/inspector/components/inspector-panel/inspector-panel";
import { PersonDossierPanel } from "@/features/people/components/person-dossier-panel/person-dossier-panel";
import { PersonSidebar } from "@/features/people/components/person-sidebar/person-sidebar";
import { TrashView } from "@/features/people/components/trash-view/trash-view";
import { useContentFullscreen } from "@/components/content-fullscreen/use-content-fullscreen";
import { Atmosphere } from "@/features/app-shell/components/atmosphere/atmosphere";
import { ActiveTabContent } from "@/features/app-shell/components/active-tab-content/active-tab-content";
import { ResponsiveWorkspace } from "@/features/app-shell/components/responsive-workspace/responsive-workspace";
import { AppDialogs } from "@/features/app-shell/components/app-dialogs/app-dialogs";
import { FirstRun } from "@/features/app-shell/components/first-run/first-run";
import { PersonDossierWorkspace } from "@/features/app-shell/components/person-dossier-workspace/person-dossier-workspace";
import { useDossierApplication } from "@/features/app-shell/hooks/use-dossier-application";
import "./dossier-application.css";

export function DossierApplication() {
  const api = useDossierApi();
  const { isFullscreen: contentFullscreen, exitFullscreen } = useContentFullscreen();
  const {
    cases,
    selectedCaseId,
    people,
    query,
    archivedPeople,
    trashOpen,
    selectedId,
    bundle,
    activeTabId,
    settings,
    selectedObject,
    personDialog,
    caseDialogOpen,
    relationPersonTarget,
    relationPersonEdit,
    relationEdit,
    returnTarget,
    archiveTarget,
    tabDialog,
    tabEdit,
    tabRemove,
    linkDialog,
    mediaEdit,
    deleteTarget,
    searchResults,
    lightbox,
    sidebarSheet,
    rightSidebarSheet,
    settingsOpen,
    width,
    sidebarCompact,
    dossierScroll,
    initialWideSidebarSize,
    activeTab,
    nextTabAfterRemoval,
    setQuery,
    setTrashOpen,
    setBundle,
    setActiveTabId,
    setSelectedObject,
    setPersonDialog,
    setCaseDialogOpen,
    setRelationPersonTarget,
    setRelationPersonEdit,
    setRelationEdit,
    setArchiveTarget,
    setTabDialog,
    setTabEdit,
    setTabRemove,
    setLinkDialog,
    setMediaEdit,
    setDeleteTarget,
    setLightbox,
    setSidebarSheet,
    setRightSidebarSheet,
    setSettingsOpen,
    run,
    resizePersonSidebar,
    rememberScroll,
    updateSettings,
    changeAppearance,
    actionResult,
    desktopAction,
    savePerson,
    saveCase,
    selectCase,
    selectPerson,
    openRelatedPerson,
    returnToMainPerson,
    archivePerson,
    confirmArchivePerson,
    restorePerson,
    togglePersonPin,
    permanentlyDeletePerson,
    updateInspectedMedia,
    moveRelationNode,
    reorderTabs,
  } = useDossierApplication({ api, contentFullscreen, exitFullscreen });
  const sidebar = (
    <PersonSidebar
      cases={cases}
      selectedCaseId={selectedCaseId}
      people={people}
      selectedId={selectedId}
      onSelect={selectPerson}
      onEdit={setPersonDialog}
      onPin={togglePersonPin}
      onArchive={archivePerson}
      onCaseSelect={selectCase}
      onCaseAdd={() => setCaseDialogOpen(true)}
      onAdd={() => setPersonDialog("add")}
      onBackup={() => void actionResult(() => api.exportBackup())}
      onFolder={() => void desktopAction(() => api.openMediaFolder())}
      onTrash={() => {
        setTrashOpen(true);
        setSidebarSheet(false);
      }}
      trashActive={trashOpen}
      archivedCount={archivedPeople.length}
      avatarUrl={(person) =>
        person.profilePhotoId ? api.profileThumbnailUrl({ id: person.profilePhotoId }) : undefined}
      browserFallback={!api.capabilities.persistentServer}
      compact={sidebarCompact && width >= PERSON_SIDEBAR_BREAKPOINT}
      compactClose={width < PERSON_SIDEBAR_BREAKPOINT
        ? () => setSidebarSheet(false)
        : undefined}
    />
  );
  const closeRightSidebar = () => {
    setSelectedObject(null);
    setRightSidebarSheet(false);
  };
  const openSidebarDetail = (selection: Exclude<SelectedObject, null>) => {
    setSelectedObject(selection);
    if (width < WIDE_WORKSPACE_BREAKPOINT) {
      setRightSidebarSheet(true);
    }
  };
  const rightSidebar = selectedObject
    ? (
      <InspectorPanel
        selected={selectedObject}
        onClose={closeRightSidebar}
        onMediaUpdate={updateInspectedMedia}
        onMediaExport={(item) => void actionResult(() => api.exportMedia(item.id))}
        onOpenPerson={(id) => {
          const person = bundle?.relatedPeople.find((item) => item.id === id);
          if (person) {
            openRelatedPerson(person);
          }
        }}
      />
    )
    : null;
  const activeContent = activeTab && bundle
    ? (
      <ActiveTabContent
        api={api}
        bundle={bundle}
        tab={activeTab}
        settings={settings}
        run={run}
        desktopAction={desktopAction}
        onBundleChange={(updater) => setBundle((current) => (
          current ? updater(current) : current
        ))}
        onInspect={openSidebarDetail}
        onRelationAdd={setRelationPersonTarget}
        onRelationPersonEdit={(person, relationship) => {
          if (!relationship) {
            setPersonDialog(person);
            return;
          }
          const targetName = relationship.ownerPersonId === bundle.person.id
            ? bundle.person.name
            : bundle.relatedPeople.find((relatedPerson) => (
              relatedPerson.id === relationship.ownerPersonId
            ))?.name ?? "connected person";
          setRelationPersonEdit({ person, relationship, targetName });
        }}
        onRelationEdit={setRelationEdit}
        onRelatedPersonOpen={openRelatedPerson}
        onPersonArchive={archivePerson}
        onRelationshipDelete={(relationship, relatedName) => setDeleteTarget({
          label: `${relatedName} from this network`,
          description: (
            <>
              <strong>{relatedName}</strong>{" "}
              will be disconnected from this network. Any branch connected through this person
              will also disappear from this view, but every dossier will remain intact.
            </>
          ),
          confirmLabel: "Remove from network",
          successMessage: "person removed from network",
          run: () => api.deleteRelationship(relationship.id),
        })}
        onRelationMove={(personId, x, y) => {
          moveRelationNode(bundle.person.id, activeTab.id, personId, x, y);
        }}
        onNewLink={() => setLinkDialog("new")}
        onEditLink={setLinkDialog}
        onDeleteRequest={setDeleteTarget}
        onPreview={setLightbox}
      />
    )
    : null;
  const main = trashOpen
    ? (
      <TrashView
        people={archivedPeople}
        avatarUrl={(person) =>
          person.profilePhotoId
            ? api.profileThumbnailUrl({ id: person.profilePhotoId })
            : undefined}
        onRestore={restorePerson}
        onDelete={permanentlyDeletePerson}
        onMenu={() => setSidebarSheet(true)}
      />
    )
    : (
      <main className={`dossier-main panel${contentFullscreen ? " is-content-fullscreen" : ""}`}>
        {bundle
          ? (
            contentFullscreen
              ? (
                <div className="dossier-scroll" ref={dossierScroll} onScroll={rememberScroll}>
                  {activeContent}
                </div>
              )
              : (
                <PersonDossierWorkspace
                  renderPanel={(compact) => (
                    <PersonDossierPanel
                      person={bundle.person}
                      profileUrl={bundle.person.profilePhotoId
                        ? api.profileThumbnailUrl({ id: bundle.person.profilePhotoId })
                        : undefined}
                      tabs={bundle.tabs}
                      activeTabId={activeTabId}
                      compact={compact}
                      backTargetName={returnTarget?.name}
                      onBack={returnTarget ? returnToMainPerson : undefined}
                      onMenu={() => setSidebarSheet(true)}
                      onEditPerson={() => setPersonDialog(bundle.person)}
                      onArchivePerson={() => archivePerson(bundle.person)}
                      onActiveTab={setActiveTabId}
                      onAddTab={() => setTabDialog(true)}
                      onEditTab={setTabEdit}
                      onDeleteTab={setTabRemove}
                      onReorderTabs={reorderTabs}
                    />
                  )}
                >
                  <div
                    className="dossier-scroll person-dossier-workspace__scroll"
                    ref={dossierScroll}
                    onScroll={rememberScroll}
                  >
                    {activeContent}
                  </div>
                </PersonDossierWorkspace>
              )
          )
          : <FirstRun onAdd={() => setPersonDialog("add")} onMenu={() => setSidebarSheet(true)} />}
      </main>
    );

  const workspaceLayout = (
    <ResponsiveWorkspace
      width={width}
      contentFullscreen={contentFullscreen}
      initialWideSidebarSize={initialWideSidebarSize}
      sidebar={sidebar}
      main={main}
      rightSidebar={rightSidebar}
      onPersonSidebarResize={resizePersonSidebar}
    />
  );
  return (
    <div className="app-shell">
      <Atmosphere />
      <AppToolbar
        query={query}
        results={searchResults}
        onQuery={setQuery}
        onSelect={selectPerson}
        appearance={resolvedAppearance(settings.appearance)}
        onAppearance={() => void changeAppearance()}
        onSettings={() => setSettingsOpen(true)}
      />
      {workspaceLayout}
      {sidebarSheet && (
        <div className="sheet-layer">
          <button
            className="sheet-scrim"
            onClick={() => setSidebarSheet(false)}
            aria-label="Close sidebar"
          />
          <div className="sheet-panel left">{sidebar}</div>
        </div>
      )}
      {rightSidebarSheet
        && rightSidebar
        && width < WIDE_WORKSPACE_BREAKPOINT
        && !contentFullscreen && (
          <div className="sheet-layer">
            <button
              className="sheet-scrim"
              onClick={closeRightSidebar}
              aria-label="Close details sidebar"
            />
            <div className="sheet-panel right">{rightSidebar}</div>
          </div>
        )}
      <AppDialogs
        api={api}
        settings={settings}
        bundle={bundle}
        activeTab={activeTab}
        personDialog={personDialog}
        caseDialogOpen={caseDialogOpen}
        relationPersonTarget={relationPersonTarget}
        relationPersonEdit={relationPersonEdit}
        relationEdit={relationEdit}
        archiveTarget={archiveTarget}
        tabDialogOpen={tabDialog}
        tabEdit={tabEdit}
        tabRemove={tabRemove}
        nextTabAfterRemoval={nextTabAfterRemoval}
        linkDialog={linkDialog}
        mediaEdit={mediaEdit}
        deleteTarget={deleteTarget}
        lightbox={lightbox}
        settingsOpen={settingsOpen}
        onPersonDialogChange={setPersonDialog}
        onCaseDialogOpenChange={setCaseDialogOpen}
        onRelationPersonTargetChange={setRelationPersonTarget}
        onRelationPersonEditChange={setRelationPersonEdit}
        onRelationEditChange={setRelationEdit}
        onArchiveTargetChange={setArchiveTarget}
        onTabDialogOpenChange={setTabDialog}
        onTabEditChange={setTabEdit}
        onTabRemoveChange={setTabRemove}
        onLinkDialogChange={setLinkDialog}
        onMediaEditChange={setMediaEdit}
        onDeleteTargetChange={setDeleteTarget}
        onLightboxChange={setLightbox}
        onSettingsOpenChange={setSettingsOpen}
        onSavePerson={savePerson}
        onSaveCase={saveCase}
        onConfirmArchive={confirmArchivePerson}
        onSettingsUpdate={updateSettings}
        run={run}
      />
      <Toaster
        position="bottom-right"
        theme={settings.appearance}
        toastOptions={{ className: "terminal-toast" }}
      />
    </div>
  );
}
