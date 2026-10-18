import { ExternalLink, MoreHorizontal, Pencil, Trash2, UserPlus } from "lucide-react";
import type { Person, Relationship } from "@shared/types";
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
import { personInitials } from "@/features/relations/relation-graph.logic";
import type { RelationSelection } from "@/features/relations/relation-graph.types";
import { shortId } from "@/lib/identifier-format";
import "./relation-list.css";

interface RelationListProps {
  people: Person[];
  relationships: Relationship[];
  avatarUrl: (person: Person) => string | undefined;
  onInspect: (selection: RelationSelection) => void;
  onOpenPerson: (person: Person) => void;
  onEditPerson: (person: Person, relationship?: Relationship) => void;
  onAddConnection: (person: Person) => void;
  onEditRelationship: (relationship: Relationship) => void;
  onDeleteRelationship: (relationship: Relationship) => void;
  onRemovePerson: (person: Person) => void;
}

export function RelationList(props: RelationListProps) {
  const relationshipFor = (personId: string) => (
    props.relationships.find((relationship) => relationship.relatedPersonId === personId)
    ?? props.relationships.find((relationship) => relationship.ownerPersonId === personId)
  );

  return (
    <div className="relation-list">
      {props.people.map((person) => {
        const relationship = relationshipFor(person.id);
        const avatar = props.avatarUrl(person);
        return (
          <ContextMenu key={person.id}>
            <ContextMenuTrigger asChild>
              <article
                className="relation-row"
                onClick={(event) => {
                  if (event.detail > 1) {
                    event.stopPropagation();
                    props.onOpenPerson(person);
                    return;
                  }
                  props.onInspect({ kind: "relation-person", person, relationship });
                }}
              >
                <span className={`relation-list-avatar ${avatar ? "has-photo" : ""}`}>
                  {avatar ? (
                    <img src={avatar} alt="" draggable={false} />
                  ) : personInitials(person.name)}
                </span>
                <div>
                  <span className="eyebrow">
                    {relationship?.relationType ?? "RELATED PERSON"}
                  </span>
                  <strong>{person.name}</strong>
                  <small>{person.summary || `Dossier ${shortId(person.id)}`}</small>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(event) => {
                    event.stopPropagation();
                    props.onOpenPerson(person);
                  }}
                >
                  <ExternalLink size={13} /> Open dossier
                </Button>
                {relationship && (
                  <Dropdown>
                    <DropdownTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={`Actions for ${person.name}`}
                        onClick={(event) => event.stopPropagation()}
                      >
                        <MoreHorizontal size={15} />
                      </Button>
                    </DropdownTrigger>
                    <DropdownContent>
                      <DropdownItem onSelect={() => props.onEditRelationship(relationship)}>
                        <Pencil size={13} /> Edit relation
                      </DropdownItem>
                      <DropdownItem
                        onSelect={() => props.onDeleteRelationship(relationship)}
                        danger
                      >
                        <Trash2 size={13} /> Remove relation
                      </DropdownItem>
                    </DropdownContent>
                  </Dropdown>
                )}
              </article>
            </ContextMenuTrigger>
            <ContextMenuContent>
              <ContextMenuItem onSelect={() => props.onEditPerson(person, relationship)}>
                <Pencil size={13} /> Edit person
              </ContextMenuItem>
              <ContextMenuItem onSelect={() => props.onAddConnection(person)}>
                <UserPlus size={13} /> Add connection
              </ContextMenuItem>
              <ContextMenuSeparator />
              <ContextMenuItem onSelect={() => props.onRemovePerson(person)} danger>
                <Trash2 size={13} /> Remove person
              </ContextMenuItem>
            </ContextMenuContent>
          </ContextMenu>
        );
      })}
    </div>
  );
}
