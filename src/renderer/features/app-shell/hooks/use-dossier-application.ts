import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { toast } from "sonner";
import type {
  AppSettings,
  CaseInput,
  CaseSummary,
  DossierApi,
  LinkItem,
  MediaItem,
  Person,
  PersonBundle,
  PersonInput,
  PersonTab,
  RelationPosition,
  Relationship,
  SearchResult,
} from "@shared/types";
import {
  readScrollState,
  readViewState,
  resolvedAppearance,
  saveScrollState,
  saveViewState,
} from "@/app/view-state";
import { SEARCH_DEBOUNCE_MS } from "@/app/layout-constants";
import type {
  PendingDelete,
  RelationPersonEdit,
  ReturnTarget,
  SelectedObject,
} from "@/app/app.types";

const defaultSettings: AppSettings = {
  theme: "terminal",
  appearance: "dark",
  startAtLogin: false,
  showMenuBarIcon: false,
  showRelatedPeopleInSidebar: false,
  seedDismissed: false,
  externalBrowser: { kind: "system" },
};

interface UseDossierApplicationOptions {
  api: DossierApi;
  contentFullscreen: boolean;
  exitFullscreen: () => void;
}

export function useDossierApplication({
  api,
  contentFullscreen,
  exitFullscreen,
}: UseDossierApplicationOptions) {
  const initialView = useMemo(readViewState, []);
  const [cases, setCases] = useState<CaseSummary[]>([]);
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(
    initialView.selectedCaseId,
  );
  const [people, setPeople] = useState<Awaited<ReturnType<DossierApi["listPeople"]>>>([]);
  const [query, setQuery] = useState("");
  const [archivedPeople, setArchivedPeople] = useState<Person[]>([]);
  const [trashOpen, setTrashOpen] = useState(initialView.trashOpen);
  const [selectedId, setSelectedId] = useState<string | null>(initialView.selectedId);
  const [bundle, setBundle] = useState<PersonBundle | null>(null);
  const [activeTabId, setActiveTabId] = useState<string | null>(initialView.activeTabId);
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [selectedObject, setSelectedObject] = useState<SelectedObject>(null);
  const [personDialog, setPersonDialog] = useState<Person | "add" | null>(null);
  const [caseDialogOpen, setCaseDialogOpen] = useState(false);
  const [relationPersonTarget, setRelationPersonTarget] = useState<Person | null>(null);
  const [relationPersonEdit, setRelationPersonEdit] = useState<RelationPersonEdit>(null);
  const [relationEdit, setRelationEdit] = useState<Relationship | null>(null);
  const [returnTarget, setReturnTarget] = useState<ReturnTarget>(null);
  const [archiveTarget, setArchiveTarget] = useState<Person | null>(null);
  const [tabDialog, setTabDialog] = useState(false);
  const [tabEdit, setTabEdit] = useState<PersonTab | null>(null);
  const [tabRemove, setTabRemove] = useState<PersonTab | null>(null);
  const [linkDialog, setLinkDialog] = useState<LinkItem | "new" | null>(null);
  const [mediaEdit, setMediaEdit] = useState<MediaItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<PendingDelete>(null);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [lightbox, setLightbox] = useState<MediaItem | null>(null);
  const [sidebarSheet, setSidebarSheet] = useState(false);
  const [rightSidebarSheet, setRightSidebarSheet] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [width, setWidth] = useState(window.innerWidth);
  const [sidebarCompact, setSidebarCompact] = useState(false);
  const sidebarCompactRef = useRef(false);
  const dossierScroll = useRef<HTMLDivElement | null>(null);
  const scrollState = useRef(readScrollState());
  const relationMoveVersion = useRef<Record<string, number>>({});

  const refreshCases = useCallback(async () => {
    const nextCases = await api.listCases();
    setCases(nextCases);
    setSelectedCaseId((current) => (
      current && nextCases.some((caseItem) => caseItem.id === current)
        ? current
        : (nextCases[0]?.id ?? null)
    ));
  }, [api]);

  const refreshPeople = useCallback(async () => {
    if (!selectedCaseId) {
      setPeople([]);
      setSelectedId(null);
      return;
    }
    const activePeople = await api.listPeople(
      "",
      "active",
      settings.showRelatedPeopleInSidebar,
      selectedCaseId,
    );
    setPeople(activePeople);
    setSelectedId((current) => (
      current && activePeople.some((person) => person.id === current)
        ? current
        : (activePeople[0]?.id ?? null)
    ));
  }, [api, selectedCaseId, settings.showRelatedPeopleInSidebar]);

  const refreshArchived = useCallback(async () => {
    if (!selectedCaseId) {
      setArchivedPeople([]);
      return;
    }
    setArchivedPeople(await api.listPeople("", "archived", false, selectedCaseId));
  }, [api, selectedCaseId]);

  const refreshBundle = useCallback(async () => {
    if (!selectedId) {
      setBundle(null);
      setSelectedObject(null);
      return;
    }
    const nextBundle = await api.getPerson(selectedId);
    setBundle(nextBundle);
    if (!nextBundle) {
      setSelectedObject(null);
      return;
    }
    setActiveTabId((current) => current && nextBundle.tabs.some((tab) => tab.id === current)
      ? current
      : (nextBundle.tabs[0]?.id ?? null));
    setSelectedObject(null);
  }, [api, selectedId]);

  useEffect(() => {
    void api.getSettings().then(setSettings);
  }, [api]);

  useEffect(() => {
    const colorScheme = window.matchMedia("(prefers-color-scheme: dark)");
    const applyAppearance = () => {
      document.documentElement.dataset.theme = resolvedAppearance(settings.appearance);
      document.documentElement.dataset.design = settings.theme;
    };
    applyAppearance();
    if (settings.appearance === "system") {
      colorScheme.addEventListener("change", applyAppearance);
    }
    return () => colorScheme.removeEventListener("change", applyAppearance);
  }, [settings.appearance, settings.theme]);

  useEffect(() => api.onOpenSettings(() => setSettingsOpen(true)), [api]);

  useEffect(() => {
    void refreshCases();
  }, [refreshCases]);

  useEffect(() => {
    void refreshPeople();
    void refreshArchived();
  }, [refreshPeople, refreshArchived]);

  useEffect(() => {
    void refreshBundle();
  }, [refreshBundle]);

  useEffect(() => {
    saveViewState({
      selectedCaseId,
      selectedId,
      activeTabId,
      trashOpen,
    });
  }, [selectedCaseId, selectedId, activeTabId, trashOpen]);

  useEffect(() => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    setSearchResults([]);
    let cancelled = false;
    const searchTimer = setTimeout(() => {
      void api.search(query, selectedCaseId ?? undefined).then((results) => {
        if (!cancelled) {
          setSearchResults(results);
        }
      });
    }, SEARCH_DEBOUNCE_MS);
    return () => {
      cancelled = true;
      clearTimeout(searchTimer);
    };
  }, [api, query, selectedCaseId]);

  useEffect(() => {
    const handleResize = () => setWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (
        ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "r")
        || event.key === "F5"
      ) {
        event.preventDefault();
        event.stopPropagation();
        return;
      }
      if ((event.metaKey || event.ctrlKey) && event.key === ",") {
        event.preventDefault();
        setSettingsOpen(true);
      }
      const tabShortcutMatch = /^Digit([1-9])$/.exec(event.code);
      const canSwitchTab = event.altKey
        && !event.metaKey
        && !event.ctrlKey
        && !event.shiftKey
        && bundle
        && tabShortcutMatch;
      if (canSwitchTab) {
        const tab = bundle.tabs[Number(tabShortcutMatch[1]) - 1];
        if (tab) {
          event.preventDefault();
          setActiveTabId(tab.id);
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown, { capture: true });
    return () => window.removeEventListener("keydown", handleKeyDown, { capture: true });
  }, [bundle]);

  const run = async (action: () => Promise<unknown>, message: string) => {
    try {
      await action();
      toast.success(`> ${message}`);
      await Promise.all([refreshCases(), refreshPeople(), refreshArchived()]);
      await refreshBundle();
    } catch (error) {
      toast.error(`! ${error instanceof Error ? error.message : "command failed"}`);
    }
  };

  const activeTab = useMemo(
    () => bundle?.tabs.find((tab) => tab.id === activeTabId) ?? null,
    [bundle, activeTabId],
  );

  const setPersonSidebarCompact = useCallback((compact: boolean) => {
    sidebarCompactRef.current = compact;
    setSidebarCompact(compact);
  }, []);

  const activeContentKey = selectedId && activeTabId ? `${selectedId}:${activeTabId}` : null;
  useEffect(() => {
    setSelectedObject(null);
    setRightSidebarSheet(false);
    exitFullscreen();
  }, [activeContentKey, exitFullscreen, trashOpen]);

  useEffect(() => {
    if (contentFullscreen) {
      setSidebarSheet(false);
      setRightSidebarSheet(false);
    }
  }, [contentFullscreen]);

  useLayoutEffect(() => {
    if (dossierScroll.current && activeContentKey) {
      dossierScroll.current.scrollTop = scrollState.current[activeContentKey] ?? 0;
    }
  }, [activeContentKey, bundle]);

  const rememberScroll = () => {
    if (!dossierScroll.current || !activeContentKey) {
      return;
    }
    scrollState.current[activeContentKey] = dossierScroll.current.scrollTop;
    saveScrollState(scrollState.current);
  };

  const updateSettings = async (input: Partial<AppSettings>) => {
    try {
      setSettings(await api.updateSettings(input));
    } catch (error) {
      toast.error(`! ${error instanceof Error ? error.message : "settings update failed"}`);
    }
  };

  const changeAppearance = async () => {
    const currentAppearance = resolvedAppearance(settings.appearance);
    const nextAppearance = currentAppearance === "dark" ? "light" : "dark";
    await updateSettings({ appearance: nextAppearance });
  };

  const actionResult = async (action: () => Promise<{ ok: boolean; message: string }>) => {
    const result = await action();
    if (result.ok) {
      toast.success(`> ${result.message}`);
    } else {
      toast.error(`! ${result.message}`);
    }
  };

  const desktopAction = async (action: () => Promise<{ ok: boolean; message: string }>) => {
    if (!api.capabilities.desktop) {
      toast.warning("> Desktop only");
      return;
    }
    await actionResult(action);
  };

  const savePerson = async (input: PersonInput) => {
    if (personDialog && personDialog !== "add") {
      await run(() => api.updatePerson(personDialog.id, input), "subject file updated");
      return;
    }
    if (!selectedCaseId) {
      toast.error("! select a case before adding a subject");
      return;
    }
    let createdId = "";
    await run(async () => {
      const created = await api.createPerson(input, selectedCaseId);
      createdId = created.person.id;
    }, "subject added");
    if (createdId) {
      setSelectedId(createdId);
    }
  };

  const saveCase = async (input: CaseInput) => {
    try {
      const created = await api.createCase(input);
      setCases((current) => [...current, created]);
      setSelectedCaseId(created.id);
      setSelectedId(null);
      setTrashOpen(false);
      setReturnTarget(null);
      toast.success("> case created");
    } catch (error) {
      toast.error(`! ${error instanceof Error ? error.message : "case creation failed"}`);
      throw error;
    }
  };

  const selectCase = (caseId: string) => {
    setSelectedCaseId(caseId);
    setSelectedId(null);
    setBundle(null);
    setReturnTarget(null);
    setTrashOpen(false);
  };

  const selectPerson = (personId: string) => {
    setReturnTarget(null);
    setTrashOpen(false);
    setSelectedId(personId);
    setSidebarSheet(false);
  };

  const openRelatedPerson = (person: Person) => {
    if (bundle) {
      setReturnTarget({ id: bundle.person.id, name: bundle.person.name, tabId: activeTabId });
    }
    setTrashOpen(false);
    setSelectedId(person.id);
    setSidebarSheet(false);
  };

  const returnToMainPerson = () => {
    if (!returnTarget) {
      return;
    }
    setActiveTabId(returnTarget.tabId);
    setSelectedId(returnTarget.id);
    setReturnTarget(null);
  };

  const archivePerson = (person: Person) => setArchiveTarget(person);
  const confirmArchivePerson = () => {
    const person = archiveTarget;
    if (!person) {
      return;
    }
    setArchiveTarget(null);
    void run(async () => {
      await api.setPersonArchived(person.id, true);
      if (selectedId === person.id) {
        setSelectedId(null);
      }
    }, "subject moved to trash");
  };

  const restorePerson = (person: Person) => {
    void run(() => api.setPersonArchived(person.id, false), "subject restored");
  };
  const togglePersonPin = (person: Person) => {
    void run(
      () => api.setPersonPinned(person.id, !person.pinned),
      person.pinned ? "subject unpinned" : "subject pinned",
    );
  };
  const permanentlyDeletePerson = (person: Person) => setDeleteTarget({
    label: person.name,
    confirmText: person.name,
    run: () => api.deletePerson(person.id),
  });

  const updateInspectedMedia = async (
    mediaItem: MediaItem,
    input: Parameters<DossierApi["updateMedia"]>[1],
  ) => {
    try {
      const updatedMedia = await api.updateMedia(mediaItem.id, input);
      setSelectedObject(updatedMedia);
      setBundle((current) => current ? {
        ...current,
        mediaItems: current.mediaItems.map((candidate) => (
          candidate.id === updatedMedia.id ? updatedMedia : candidate
        )),
      } : current);
      toast.success("> evidence metadata updated");
      return updatedMedia;
    } catch (error) {
      toast.error(`! ${error instanceof Error ? error.message : "metadata update failed"}`);
      throw error;
    }
  };

  const setRelationPosition = (position: RelationPosition) => {
    setBundle((current) => current?.person.id === position.viewPersonId ? {
      ...current,
      relationPositions: [
        ...current.relationPositions.filter((candidate) => (
          candidate.tabId !== position.tabId || candidate.personId !== position.personId
        )),
        position,
      ],
    } : current);
  };

  const moveRelationNode = (
    viewPersonId: string,
    tabId: string,
    personId: string,
    x: number,
    y: number,
  ) => {
    const positionKey = `${viewPersonId}:${tabId}:${personId}`;
    const version = (relationMoveVersion.current[positionKey] ?? 0) + 1;
    relationMoveVersion.current[positionKey] = version;
    setRelationPosition({ viewPersonId, tabId, personId, x, y });
    void api.updateRelationPosition(viewPersonId, tabId, personId, x, y)
      .then((position) => {
        if (relationMoveVersion.current[positionKey] === version) {
          setRelationPosition(position);
        }
      })
      .catch(async (error) => {
        if (relationMoveVersion.current[positionKey] !== version) {
          return;
        }
        toast.error(`! ${error instanceof Error ? error.message : "position update failed"}`);
        await refreshBundle();
      });
  };

  const reorderTabs = (tabs: PersonTab[]) => {
    const positionedTabs = tabs.map((tab, position) => ({ ...tab, position }));
    setBundle((current) => current ? { ...current, tabs: positionedTabs } : current);
    void Promise.all(
      positionedTabs.map((tab) => api.updateTab(tab.id, { position: tab.position })),
    ).catch(async (error) => {
      toast.error(`! ${error instanceof Error ? error.message : "tab reorder failed"}`);
      await refreshBundle();
    });
  };

  const nextTabAfterRemoval = tabRemove && bundle
    ? activeTabId === tabRemove.id
      ? bundle.tabs.find((tab) => tab.id !== tabRemove.id)
      : bundle.tabs.find((tab) => tab.id === activeTabId)
    : undefined;

  return {
    cases, selectedCaseId, people, query, archivedPeople, trashOpen, selectedId, bundle,
    activeTabId, settings, selectedObject, personDialog, caseDialogOpen, relationPersonTarget,
    relationPersonEdit, relationEdit,
    returnTarget, archiveTarget, tabDialog, tabEdit, tabRemove, linkDialog, mediaEdit,
    deleteTarget, searchResults, lightbox, sidebarSheet, rightSidebarSheet,
    settingsOpen, width, sidebarCompact, dossierScroll, activeTab,
    nextTabAfterRemoval, setQuery, setTrashOpen, setBundle,
    setActiveTabId, setSelectedObject, setPersonDialog, setCaseDialogOpen, setRelationPersonTarget,
    setRelationPersonEdit, setRelationEdit, setArchiveTarget, setTabDialog, setTabEdit,
    setTabRemove, setLinkDialog, setMediaEdit, setDeleteTarget, setLightbox, setSidebarSheet,
    setRightSidebarSheet, setSettingsOpen, run, setPersonSidebarCompact,
    rememberScroll, updateSettings, changeAppearance, actionResult, desktopAction, savePerson,
    saveCase, selectCase, selectPerson, openRelatedPerson, returnToMainPerson,
    archivePerson, confirmArchivePerson,
    restorePerson, togglePersonPin, permanentlyDeletePerson, updateInspectedMedia,
    moveRelationNode, reorderTabs,
  };
}
