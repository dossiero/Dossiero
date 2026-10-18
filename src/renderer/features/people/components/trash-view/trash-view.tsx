import { ArchiveRestore, Trash2, UserRoundX } from "lucide-react";
import type { Person } from "@shared/types";
import { shortId } from "@/lib/identifier-format";
import { Button } from "@/components/button/button";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/context-menu/context-menu";
import { Title } from "@/components/title/title";
import "./trash-view.css";

export function TrashView({
  people,
  avatarUrl,
  onRestore,
  onDelete,
  onMenu,
}: {
  people: Person[];
  avatarUrl: (person: Person) => string | undefined;
  onRestore: (person: Person) => void;
  onDelete: (person: Person) => void;
  onMenu: () => void;
}) {
  return (
    <main className="dossier-main panel trash-view">
      <header className="trash-header">
        <button className="mobile-titlebar" onClick={onMenu}>
          TARGETS
        </button>
        <div>
          <span className="eyebrow">// ARCHIVED RECORDS</span>
          <Title level={1}>
            <Trash2 size={22} /> Trash
          </Title>
          <p>
            Restore people to the active index or permanently remove their dossier and stored
            evidence.
          </p>
        </div>
        <span className="trash-count">{String(people.length).padStart(2, "0")} RECORDS</span>
      </header>

      <div className="trash-list" role="list" aria-label="Archived people">
        {people.map((person) => {
          const photo = avatarUrl(person);
          const initials = person.name
            .split(/\s+/)
            .map((part) => part[0])
            .slice(0, 2)
            .join("")
            .toUpperCase();

          return (
            <ContextMenu key={person.id}>
              <ContextMenuTrigger asChild>
                <article className="trash-row" role="listitem">
                  <span className={`trash-avatar ${photo ? "has-photo" : ""}`}>
                    {photo ? <img src={photo} alt="" draggable={false} /> : initials}
                  </span>
                  <div>
                    <strong>{person.name}</strong>
                    <span>{person.summary || "// unclassified"}</span>
                    <code>
                      ID:{shortId(person.id)} · ARCHIVED{" "}
                      {new Date(person.updatedAt).toLocaleDateString()}
                    </code>
                  </div>
                  <div className="trash-actions">
                    <Button size="sm" variant="ghost" onClick={() => onRestore(person)}>
                      <ArchiveRestore size={14} /> Restore
                    </Button>
                    <Button size="sm" variant="danger" onClick={() => onDelete(person)}>
                      <Trash2 size={14} /> Delete permanently
                    </Button>
                  </div>
                </article>
              </ContextMenuTrigger>
              <ContextMenuContent>
                <ContextMenuItem onSelect={() => onRestore(person)}>
                  <ArchiveRestore size={14} /> Restore person
                </ContextMenuItem>
                <ContextMenuSeparator />
                <ContextMenuItem danger onSelect={() => onDelete(person)}>
                  <Trash2 size={14} /> Delete permanently
                </ContextMenuItem>
              </ContextMenuContent>
            </ContextMenu>
          );
        })}

        {!people.length && (
          <div className="trash-empty">
            <UserRoundX size={34} />
            <strong>Trash is empty</strong>
            <p>Archived people will appear here.</p>
          </div>
        )}
      </div>
    </main>
  );
}
