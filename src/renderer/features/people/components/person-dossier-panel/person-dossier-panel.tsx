import {
  Archive,
  ArrowLeft,
  CalendarDays,
  Edit3,
  MapPin,
  Menu,
  MoreHorizontal,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import {
  useState,
  type DragEvent,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import type { Person, PersonTab } from "@shared/types";
import { Button } from "@/components/button/button";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/context-menu/context-menu";
import {
  Dropdown,
  DropdownContent,
  DropdownItem,
  DropdownTrigger,
} from "@/components/dropdown-menu/dropdown-menu";
import { Title } from "@/components/title/title";
import { Tooltip } from "@/components/tooltip/tooltip";
import { formatBirthDate } from "@/features/people/person-overview.logic";
import { cn } from "@/lib/class-names";
import { shortId } from "@/lib/identifier-format";
import { defaultTabIcon, tabIcons } from "@/lib/tab-icons";
import "./person-dossier-panel.css";
import "./person-dossier-panel-compact.css";
import "./person-dossier-panel-facts.css";

type DropTarget = { id: string; edge: "before" | "after" } | null;

interface PersonDossierPanelProps {
  person: Person;
  profileUrl?: string;
  tabs: PersonTab[];
  activeTabId: string | null;
  compact: boolean;
  backTargetName?: string;
  onBack?: () => void;
  onMenu: () => void;
  onEditPerson: () => void;
  onArchivePerson: () => void;
  onActiveTab: (id: string) => void;
  onAddTab: () => void;
  onEditTab: (tab: PersonTab) => void;
  onDeleteTab: (tab: PersonTab) => void;
  onReorderTabs: (tabs: PersonTab[]) => void;
}

export function PersonDossierPanel({
  person,
  profileUrl,
  tabs,
  activeTabId,
  compact,
  backTargetName,
  onBack,
  onMenu,
  onEditPerson,
  onArchivePerson,
  onActiveTab,
  onAddTab,
  onEditTab,
  onDeleteTab,
  onReorderTabs,
}: PersonDossierPanelProps) {
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dropTarget, setDropTarget] = useState<DropTarget>(null);
  const initials = person.name
    .split(/\s+/)
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const moveTab = (id: string, targetId: string, edge: "before" | "after") => {
    if (id === targetId) {
      return;
    }

    const movingTab = tabs.find((tab) => tab.id === id);
    if (!movingTab) {
      return;
    }

    const reorderedTabs = tabs.filter((tab) => tab.id !== id);
    const targetIndex = reorderedTabs.findIndex((tab) => tab.id === targetId);
    if (targetIndex < 0) {
      return;
    }

    const insertionIndex = targetIndex + (edge === "after" ? 1 : 0);
    reorderedTabs.splice(insertionIndex, 0, movingTab);
    const orderChanged = reorderedTabs.some((tab, index) => tab.id !== tabs[index]?.id);
    if (orderChanged) {
      onReorderTabs(reorderedTabs);
    }
  };

  const resolveDropEdge = (event: DragEvent<HTMLDivElement>) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    return event.clientY < bounds.top + bounds.height / 2 ? "before" : "after";
  };

  const moveTabWithKeyboard = (
    event: KeyboardEvent<HTMLButtonElement>,
    index: number,
  ) => {
    const isReorderKey = event.altKey
      && (event.key === "ArrowUp" || event.key === "ArrowDown");
    if (!isReorderKey) {
      return;
    }

    event.preventDefault();
    const destination = event.key === "ArrowUp" ? index - 1 : index + 1;
    if (destination < 0 || destination >= tabs.length) {
      return;
    }

    const reorderedTabs = [...tabs];
    const [movingTab] = reorderedTabs.splice(index, 1);
    reorderedTabs.splice(destination, 0, movingTab);
    onReorderTabs(reorderedTabs);
  };

  const withCompactTooltip = (label: string, content: ReactNode) => {
    return compact ? <Tooltip label={label}>{content}</Tooltip> : content;
  };

  return (
    <aside
      className={cn(
        "person-dossier-panel",
        compact && "person-dossier-panel--compact",
      )}
    >
      <div
        className={cn(
          "person-dossier-panel__mobile-actions",
          compact && "person-dossier-panel__mobile-actions--compact",
        )}
      >
        <Button variant="ghost" size="icon" onClick={onMenu} aria-label="Open subjects">
          <Menu size={18} />
        </Button>
      </div>

      {onBack && (
        <div
          className={cn(
            "person-dossier-panel__return",
            compact && "person-dossier-panel__return--compact",
          )}
        >
          {withCompactTooltip(
            `Back to ${backTargetName}`,
            <Button
              className="person-dossier-panel__return-button"
              variant="ghost"
              size={compact ? "icon" : "sm"}
              onClick={onBack}
            >
              <ArrowLeft size={14} />
              {!compact && (
                <span className="person-dossier-panel__return-label">
                  Back to {backTargetName}
                </span>
              )}
            </Button>,
          )}
        </div>
      )}

      <div
        className={cn(
          "person-dossier-panel__identity",
          compact && "person-dossier-panel__identity--compact",
        )}
      >
        {withCompactTooltip(
          person.name,
          <div
            className={cn(
              "person-dossier-panel__photo",
              profileUrl && "person-dossier-panel__photo--has-photo",
              compact && "person-dossier-panel__photo--compact",
              !profileUrl && "panel-brackets",
            )}
            onDoubleClick={onEditPerson}
            title="Double-click to edit person"
          >
            {profileUrl
              ? (
                <img
                  className="person-dossier-panel__photo-image"
                  src={profileUrl}
                  alt={`${person.name} profile`}
                  draggable={false}
                />
              )
              : <span className="person-dossier-panel__photo-initials">{initials}</span>}
          </div>,
        )}
        <div
          className={cn(
            "person-dossier-panel__identity-copy",
            compact && "person-dossier-panel__identity-copy--hidden",
          )}
        >
          <div className="person-dossier-panel__code">
            TARGET //
            {" "}
            <span className="person-dossier-panel__code-id">
              {shortId(person.id)}
            </span>
          </div>
          <Title
            className="person-dossier-panel__name"
            level={1}
            onDoubleClick={onEditPerson}
            title="Double-click to edit person"
          >
            {person.name}
          </Title>
          {person.aliases.length > 0 && (
            <div
              className="person-dossier-panel__aliases"
              onDoubleClick={onEditPerson}
              title="Double-click to edit person"
            >
              ALIASES: {person.aliases.join(" / ")}
            </div>
          )}
          <p
            className="person-dossier-panel__summary"
            onDoubleClick={onEditPerson}
            title="Double-click to edit person"
          >
            {person.summary || "// Summary channel is empty. Add a concise subject overview."}
          </p>
        </div>
        <div
          className={cn(
            "person-dossier-panel__person-actions",
            compact && "person-dossier-panel__person-actions--compact",
          )}
        >
          <Tooltip label="Edit person">
            <Button
              variant={compact ? "ghost" : "signal"}
              size={compact ? "icon" : "sm"}
              onClick={onEditPerson}
              aria-label="Edit person"
            >
              <Edit3 size={13} />
              {!compact && <span>Edit</span>}
            </Button>
          </Tooltip>
          <Dropdown>
            <Tooltip label="More person actions">
              <DropdownTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="More person actions">
                  <MoreHorizontal size={17} />
                </Button>
              </DropdownTrigger>
            </Tooltip>
            <DropdownContent>
              <DropdownItem onSelect={onArchivePerson} danger>
                <Archive size={13} />
                Archive
              </DropdownItem>
            </DropdownContent>
          </Dropdown>
        </div>
      </div>

      <nav
        className="person-dossier-panel__tabs"
        role="tablist"
        aria-label="Dossier sections"
        aria-orientation="vertical"
      >
        <div className="person-dossier-panel__tab-list">
          {tabs.map((tab, index) => {
            const Icon = tabIcons[tab.icon] ?? tabIcons[defaultTabIcon(tab.kind)];
            const dropEdge = dropTarget?.id === tab.id ? dropTarget.edge : null;
            const tabControl = (
              <button
                type="button"
                role="tab"
                aria-selected={activeTabId === tab.id}
                tabIndex={activeTabId === tab.id ? 0 : -1}
                draggable
                className={cn(
                  "person-dossier-panel__tab",
                  activeTabId === tab.id && "person-dossier-panel__tab--active",
                  compact && "person-dossier-panel__tab--compact",
                  Boolean(draggedId) && "person-dossier-panel__tab--reordering",
                )}
                onDragStart={(event) => {
                  setDraggedId(tab.id);
                  event.dataTransfer.effectAllowed = "move";
                  event.dataTransfer.setData("text/plain", tab.id);
                }}
                onDragEnd={() => {
                  setDraggedId(null);
                  setDropTarget(null);
                }}
                onClick={() => onActiveTab(tab.id)}
                onKeyDown={(event) => moveTabWithKeyboard(event, index)}
                aria-label={`${tab.name}, tab ${index + 1} of ${tabs.length}. `
                  + "Drag to reorder or press Alt and an arrow key."}
              >
                {!compact && index < 9 && (
                  <span className="person-dossier-panel__tab-key">{index + 1}</span>
                )}
                <Icon
                  className={cn(
                    "person-dossier-panel__tab-icon",
                    compact && "person-dossier-panel__tab-icon--compact",
                  )}
                  size={16}
                />
                <span
                  className={cn(
                    "person-dossier-panel__tab-label",
                    compact && "person-dossier-panel__tab-label--hidden",
                  )}
                >
                  {tab.name}
                </span>
              </button>
            );

            return (
              <ContextMenu key={tab.id}>
                <ContextMenuTrigger asChild>
                  <div
                    className={cn(
                      "person-dossier-panel__tab-wrap",
                      draggedId === tab.id
                        && "person-dossier-panel__tab-wrap--dragging",
                      dropEdge === "before"
                        && "person-dossier-panel__tab-wrap--drop-before",
                      dropEdge === "after"
                        && "person-dossier-panel__tab-wrap--drop-after",
                    )}
                    onDragOver={(event) => {
                      event.preventDefault();
                      event.dataTransfer.dropEffect = "move";
                      setDropTarget({ id: tab.id, edge: resolveDropEdge(event) });
                    }}
                    onDrop={(event) => {
                      event.preventDefault();
                      const sourceId = draggedId ?? event.dataTransfer.getData("text/plain");
                      moveTab(sourceId, tab.id, resolveDropEdge(event));
                      setDraggedId(null);
                      setDropTarget(null);
                    }}
                  >
                    {withCompactTooltip(tab.name, tabControl)}
                  </div>
                </ContextMenuTrigger>
                <ContextMenuContent>
                  <ContextMenuItem onSelect={() => onEditTab(tab)}>
                    <Pencil size={13} />
                    Edit tab
                  </ContextMenuItem>
                  <ContextMenuSeparator />
                  <ContextMenuItem onSelect={() => onDeleteTab(tab)} danger>
                    <Trash2 size={13} />
                    Remove tab
                  </ContextMenuItem>
                </ContextMenuContent>
              </ContextMenu>
            );
          })}
        </div>

        <div
          className={cn(
            "person-dossier-panel__add-tab",
            compact && "person-dossier-panel__add-tab--compact",
          )}
        >
          <Tooltip label="Create a dossier tab">
            <button
              type="button"
              className={cn(
                "person-dossier-panel__add-tab-control",
                compact && "person-dossier-panel__add-tab-control--compact",
              )}
              onClick={onAddTab}
            >
              <span className="person-dossier-panel__add-tab-key">
                <Plus size={10} />
              </span>
              <span
                className={cn(
                  "person-dossier-panel__add-tab-label",
                  compact && "person-dossier-panel__add-tab-label--hidden",
                )}
              >
                Add tab
              </span>
            </button>
          </Tooltip>
        </div>

        <div
          className={cn(
            "person-dossier-panel__facts",
            compact && "person-dossier-panel__facts--hidden",
          )}
          aria-label="Person facts"
        >
          <div className="person-dossier-panel__fact">
            <CalendarDays className="person-dossier-panel__fact-icon" size={15} />
            <span className="person-dossier-panel__fact-copy">
              <small className="person-dossier-panel__fact-label">Birthday</small>
              <strong className="person-dossier-panel__fact-value">
                {formatBirthDate(person.birthDate)}
              </strong>
            </span>
          </div>
          <div className="person-dossier-panel__fact">
            <MapPin className="person-dossier-panel__fact-icon" size={15} />
            <span className="person-dossier-panel__fact-copy">
              <small className="person-dossier-panel__fact-label">Location</small>
              <strong className="person-dossier-panel__fact-value">// NOT RECORDED</strong>
            </span>
          </div>
        </div>
      </nav>
    </aside>
  );
}
