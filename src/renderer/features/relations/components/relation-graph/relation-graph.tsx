import type { PointerEvent as ReactPointerEvent, RefObject, WheelEvent } from "react";
import { Maximize2, Minus, Pencil, Plus, Trash2, UserPlus } from "lucide-react";
import type { Person, Relationship } from "@shared/types";
import { Button } from "@/components/button/button";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/context-menu/context-menu";
import { Tooltip } from "@/components/tooltip/tooltip";
import {
  MAX_RELATION_SCALE,
  MIN_RELATION_SCALE,
  RELATION_CANVAS_HEIGHT,
  RELATION_CANVAS_WIDTH,
  personInitials,
} from "@/features/relations/relation-graph.logic";
import type {
  RelationCamera,
  RelationPoint,
  RelationSelection,
} from "@/features/relations/relation-graph.types";
import "./relation-graph.css";

interface RelationGraphProps {
  boardRef: RefObject<HTMLDivElement | null>;
  people: Person[];
  centerPersonId: string;
  relationships: Relationship[];
  points: Record<string, RelationPoint>;
  camera: RelationCamera;
  panning: boolean;
  suppressClickRef: RefObject<boolean>;
  avatarUrl: (person: Person) => string | undefined;
  onPan: (event: ReactPointerEvent<HTMLDivElement>) => void;
  onWheel: (event: WheelEvent<HTMLDivElement>) => void;
  onDrag: (event: ReactPointerEvent<HTMLButtonElement>, person: Person) => void;
  onInspect: (selection: RelationSelection) => void;
  onEditPerson: (person: Person, relationship?: Relationship) => void;
  onAddConnection: (person: Person) => void;
  onRemovePerson: (person: Person) => void;
  onZoom: (factor: number) => void;
  onFit: () => void;
}

export function RelationGraph(props: RelationGraphProps) {
  const relationshipFor = (personId: string) => (
    props.relationships.find((relationship) => relationship.relatedPersonId === personId)
    ?? props.relationships.find((relationship) => relationship.ownerPersonId === personId)
  );

  return (
    <div
      className={`relation-board panel-brackets ${props.panning ? "is-panning" : ""}`}
      ref={props.boardRef}
      onPointerDown={props.onPan}
      onWheel={props.onWheel}
    >
      <div
        className="relation-canvas"
        style={{
          width: RELATION_CANVAS_WIDTH,
          height: RELATION_CANVAS_HEIGHT,
          transform: `translate(${props.camera.x}px,${props.camera.y}px) scale(${props.camera.scale})`,
        }}
      >
        <svg
          className="relation-lines"
          aria-hidden="true"
          viewBox={`0 0 ${RELATION_CANVAS_WIDTH} ${RELATION_CANVAS_HEIGHT}`}
          preserveAspectRatio="none"
        >
          {props.relationships.map((relationship) => {
            const from = props.points[relationship.relatedPersonId];
            const to = props.points[relationship.ownerPersonId];
            if (!from || !to) return null;
            const x1 = from.x * RELATION_CANVAS_WIDTH;
            const y1 = from.y * RELATION_CANVAS_HEIGHT;
            const x2 = to.x * RELATION_CANVAS_WIDTH;
            const y2 = to.y * RELATION_CANVAS_HEIGHT;
            const labelWidth = Math.max(42, [...relationship.relationType].length * 8 + 20);
            const labelX = (x1 + x2) / 2;
            const labelY = (y1 + y2) / 2;
            return (
              <g key={relationship.id}>
                <line x1={x1} y1={y1} x2={x2} y2={y2} />
                <rect
                  x={labelX - labelWidth / 2}
                  y={labelY - 12}
                  width={labelWidth}
                  height="24"
                  rx="3"
                />
                <text x={labelX} y={labelY + 4}>{relationship.relationType}</text>
              </g>
            );
          })}
        </svg>
        {props.people.map((person) => {
          const point = props.points[person.id];
          if (!point) return null;
          const center = person.id === props.centerPersonId;
          const relationship = relationshipFor(person.id);
          const avatar = props.avatarUrl(person);
          const relationLabel = relationship ? `, ${relationship.relationType}` : "";
          return (
            <ContextMenu key={person.id}>
              <ContextMenuTrigger asChild>
                <button
                  className={`relation-node ${center ? "is-center" : ""}`}
                  style={{ left: `${point.x * 100}%`, top: `${point.y * 100}%` }}
                  onPointerDown={(event) => props.onDrag(event, person)}
                  onClick={(event) => {
                    if (props.suppressClickRef.current) {
                      event.preventDefault();
                      event.stopPropagation();
                      return;
                    }
                    if (!center) {
                      props.onInspect({ kind: "relation-person", person, relationship });
                    }
                  }}
                  aria-label={`${person.name}${center ? ", current subject" : relationLabel}`}
                >
                  <span className={`relation-avatar ${avatar ? "has-photo" : ""}`}>
                    {avatar ? (
                      <img src={avatar} alt="" draggable={false} />
                    ) : personInitials(person.name)}
                  </span>
                  <strong>{person.name}</strong>
                  {center && <small>TARGET</small>}
                </button>
              </ContextMenuTrigger>
              <ContextMenuContent>
                <ContextMenuItem
                  onSelect={() => props.onEditPerson(person, center ? undefined : relationship)}
                >
                  <Pencil size={13} /> Edit person
                </ContextMenuItem>
                <ContextMenuItem onSelect={() => props.onAddConnection(person)}>
                  <UserPlus size={13} /> Add connection
                </ContextMenuItem>
                {!center && (
                  <>
                    <ContextMenuSeparator />
                    <ContextMenuItem onSelect={() => props.onRemovePerson(person)} danger>
                      <Trash2 size={13} /> Remove person
                    </ContextMenuItem>
                  </>
                )}
              </ContextMenuContent>
            </ContextMenu>
          );
        })}
      </div>
      <div
        className="relation-board-controls"
        onPointerDown={(event) => event.stopPropagation()}
      >
        <Tooltip label={`Zoom out (minimum ${Math.round(MIN_RELATION_SCALE * 100)}%)`}>
          <Button
            variant="ghost"
            size="icon"
            disabled={props.camera.scale <= MIN_RELATION_SCALE}
            onClick={() => props.onZoom(1 / 1.2)}
            aria-label="Zoom out"
          >
            <Minus size={14} />
          </Button>
        </Tooltip>
        <button className="relation-zoom-value" onClick={props.onFit} aria-label="Fit network">
          {Math.round(props.camera.scale * 100)}%
        </button>
        <Tooltip label={`Zoom in (maximum ${Math.round(MAX_RELATION_SCALE * 100)}%)`}>
          <Button
            variant="ghost"
            size="icon"
            disabled={props.camera.scale >= MAX_RELATION_SCALE}
            onClick={() => props.onZoom(1.2)}
            aria-label="Zoom in"
          >
            <Plus size={14} />
          </Button>
        </Tooltip>
        <Tooltip label="Fit network">
          <Button variant="ghost" size="icon" onClick={props.onFit} aria-label="Fit network">
            <Maximize2 size={14} />
          </Button>
        </Tooltip>
      </div>
      <span className="relation-board-hint">
        DRAG BACKGROUND TO PAN · SCROLL TO ZOOM · SHIFT-DRAG NODES TO SNAP 45°
      </span>
    </div>
  );
}
