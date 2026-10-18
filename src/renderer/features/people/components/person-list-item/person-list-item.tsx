import { Archive, Pencil, Pin, PinOff } from "lucide-react";
import type { Person } from "@shared/types";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/context-menu/context-menu";
import { shortId } from "@/lib/identifier-format";
import "./person-list-item.css";

interface PersonListItemProps {
  person: Person;
  avatarUrl?: string;
  selected: boolean;
  onClick: () => void;
  onEdit: () => void;
  onPin: () => void;
  onArchive: () => void;
  index: number;
}

export function PersonListItem({
  person,
  avatarUrl,
  selected,
  onClick,
  onEdit,
  onPin,
  onArchive,
  index,
}: PersonListItemProps) {
  const initials = person.name
    .split(/\s+/)
    .map((namePart) => namePart[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  const description = person.summary.trim()
    || person.aliases.find((alias) => alias.trim())?.trim()
    || "// unclassified";
  const animationDelay = `${Math.min(index * 35, 250)}ms`;

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <button
          role="option"
          aria-selected={selected}
          className={`person-item ${selected ? "is-selected" : ""}`}
          onClick={onClick}
          style={{ animationDelay }}
        >
          <span className="person-index">{String(index + 1).padStart(2, "0")}</span>
          <span className={`person-avatar ${avatarUrl ? "has-photo" : ""}`}>
            {avatarUrl ? (
              <img src={avatarUrl} alt="" draggable={false} />
            ) : (
              <span>{initials}</span>
            )}
            <i />
          </span>
          <span className="person-copy">
            <strong>
              {person.name}
              {person.pinned && <Pin className="person-pin" size={10} aria-label="Pinned" />}
            </strong>
            <small>{description}</small>
            <code>ID:{shortId(person.id)}</code>
          </span>
        </button>
      </ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuItem onSelect={onPin}>
          {person.pinned ? <PinOff size={14} /> : <Pin size={14} />}
          {person.pinned ? "Unpin person" : "Pin person"}
        </ContextMenuItem>
        <ContextMenuItem onSelect={onEdit}>
          <Pencil size={14} /> Edit person
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem danger onSelect={onArchive}>
          <Archive size={14} /> Move to trash
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}
