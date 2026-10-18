import {
  type PointerEvent as ReactPointerEvent,
  type WheelEvent as ReactWheelEvent,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { List, Network, Plus } from "lucide-react";
import type { Person } from "@shared/types";
import { Button } from "@/components/button/button";
import { ProfileContent } from "@/components/profile-content/profile-content";
import { ProfileContentBody } from "@/components/profile-content-body/profile-content-body";
import { ProfileContentHeader } from "@/components/profile-content-header/profile-content-header";
import { ProfileTabEmptyState } from "@/components/profile-tab-empty-state/profile-tab-empty-state";
import { Tooltip } from "@/components/tooltip/tooltip";
import { RelationGraph } from "@/features/relations/components/relation-graph/relation-graph";
import { RelationList } from "@/features/relations/components/relation-list/relation-list";
import {
  MAX_RELATION_SCALE,
  MIN_RELATION_SCALE,
  RELATION_CANVAS_HEIGHT,
  RELATION_CANVAS_WIDTH,
  clamp,
  makeRelationPositions,
  readRelationCamera,
  snapRelationPoint,
} from "@/features/relations/relation-graph.logic";
import type {
  RelationCamera,
  RelationPoint,
  RelationTabProps,
  RelationViewMode,
} from "@/features/relations/relation-graph.types";
import "./relation-tab.css";

const CAMERA_SAVE_DELAY_MS = 150;
const NODE_DRAG_THRESHOLD_PX = 4;
const NODE_DOUBLE_CLICK_DELAY_MS = 400;

export type { RelationSelection } from "@/features/relations/relation-graph.types";

export function RelationTab(props: RelationTabProps) {
  const { tab, person, people, relationships, positions } = props;
  const hasPeople = people.length > 0;
  const storageKey = `dossier-relation-view:${person.id}:${tab.id}`;
  const cameraStorageKey = `dossier-relation-camera:${person.id}:${tab.id}`;
  const [view, setView] = useState<RelationViewMode>(() => (
    localStorage.getItem(storageKey) === "list" ? "list" : "graph"
  ));
  const allPeople = useMemo(() => [person, ...people], [person, people]);
  const initialPositions = useMemo(
    () => makeRelationPositions(person.id, people, positions),
    [people, person.id, positions],
  );
  const [points, setPoints] = useState<Record<string, RelationPoint>>(initialPositions);
  const [camera, setCamera] = useState<RelationCamera>(() => (
    readRelationCamera(cameraStorageKey) ?? { x: 0, y: 0, scale: 1 }
  ));
  const [panning, setPanning] = useState(false);
  const boardRef = useRef<HTMLDivElement | null>(null);
  const suppressClickRef = useRef(false);
  const lastNodeClickRef = useRef<{ id: string; at: number } | null>(null);

  useEffect(() => setPoints(initialPositions), [initialPositions]);

  const fitView = () => {
    const board = boardRef.current;
    if (!board) return;
    const bounds = board.getBoundingClientRect();
    const scale = clamp(
      Math.min(
        bounds.width / RELATION_CANVAS_WIDTH,
        bounds.height / RELATION_CANVAS_HEIGHT,
      ) * .94,
      MIN_RELATION_SCALE,
      1,
    );
    setCamera({
      x: (bounds.width - RELATION_CANVAS_WIDTH * scale) / 2,
      y: (bounds.height - RELATION_CANVAS_HEIGHT * scale) / 2,
      scale,
    });
  };

  useLayoutEffect(() => {
    if (view !== "graph" || !boardRef.current) return;
    const savedCamera = readRelationCamera(cameraStorageKey);
    if (savedCamera) {
      setCamera(savedCamera);
      return;
    }
    const frame = requestAnimationFrame(fitView);
    return () => cancelAnimationFrame(frame);
  }, [cameraStorageKey, view]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      localStorage.setItem(cameraStorageKey, JSON.stringify(camera));
    }, CAMERA_SAVE_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [camera, cameraStorageKey]);

  const changeView = (nextView: RelationViewMode) => {
    setView(nextView);
    localStorage.setItem(storageKey, nextView);
  };

  const zoomBy = (factor: number, clientX?: number, clientY?: number) => {
    const board = boardRef.current;
    if (!board) return;
    const bounds = board.getBoundingClientRect();
    const anchorX = (clientX ?? bounds.left + bounds.width / 2) - bounds.left;
    const anchorY = (clientY ?? bounds.top + bounds.height / 2) - bounds.top;
    setCamera((current) => {
      const scale = clamp(current.scale * factor, MIN_RELATION_SCALE, MAX_RELATION_SCALE);
      const ratio = scale / current.scale;
      return {
        x: anchorX - (anchorX - current.x) * ratio,
        y: anchorY - (anchorY - current.y) * ratio,
        scale,
      };
    });
  };

  const handleWheel = (event: ReactWheelEvent<HTMLDivElement>) => {
    event.preventDefault();
    zoomBy(Math.exp(-event.deltaY * .0015), event.clientX, event.clientY);
  };

  const handlePan = (event: ReactPointerEvent<HTMLDivElement>) => {
    const blocked = (event.target as Element).closest(
      ".relation-node,.relation-board-controls",
    );
    if ((event.button !== 0 && event.button !== 1) || blocked) return;
    event.preventDefault();
    const start = { x: event.clientX, y: event.clientY };
    const origin = camera;
    setPanning(true);
    const move = (pointer: PointerEvent) => setCamera({
      ...origin,
      x: origin.x + pointer.clientX - start.x,
      y: origin.y + pointer.clientY - start.y,
    });
    const cleanup = () => {
      setPanning(false);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", cleanup);
      window.removeEventListener("pointercancel", cleanup);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", cleanup);
    window.addEventListener("pointercancel", cleanup);
  };

  const handleNodeDrag = (
    event: ReactPointerEvent<HTMLButtonElement>,
    node: Person,
  ) => {
    if (event.button !== 0 || node.id === person.id || !boardRef.current) return;
    event.preventDefault();
    const start = points[node.id];
    if (!start) return;
    const incoming = relationships.find((relationship) => (
      relationship.relatedPersonId === node.id
    ));
    const angleAnchor = incoming ? points[incoming.ownerPersonId] ?? start : start;
    const startClient = { x: event.clientX, y: event.clientY };
    let moved = false;
    let latest = start;
    const move = (pointer: PointerEvent) => {
      const horizontalDelta = pointer.clientX - startClient.x;
      const verticalDelta = pointer.clientY - startClient.y;
      if (!moved && Math.hypot(horizontalDelta, verticalDelta) < NODE_DRAG_THRESHOLD_PX) return;
      moved = true;
      const freePoint = {
        x: start.x + horizontalDelta / (RELATION_CANVAS_WIDTH * camera.scale),
        y: start.y + verticalDelta / (RELATION_CANVAS_HEIGHT * camera.scale),
      };
      const nextPoint = pointer.shiftKey ? snapRelationPoint(freePoint, angleAnchor) : freePoint;
      latest = {
        x: clamp(nextPoint.x, .04, .96),
        y: clamp(nextPoint.y, .06, .94),
      };
      setPoints((current) => ({ ...current, [node.id]: latest }));
    };
    const cleanup = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", finish);
      window.removeEventListener("pointercancel", cleanup);
    };
    const finish = (pointer: PointerEvent) => {
      move(pointer);
      cleanup();
      if (moved) {
        lastNodeClickRef.current = null;
        suppressClickRef.current = true;
        props.onMove(node.id, latest.x, latest.y);
        window.setTimeout(() => {
          suppressClickRef.current = false;
        }, 0);
        return;
      }
      const clickedAt = Date.now();
      const previousClick = lastNodeClickRef.current;
      if (previousClick?.id === node.id
        && clickedAt - previousClick.at < NODE_DOUBLE_CLICK_DELAY_MS) {
        lastNodeClickRef.current = null;
        suppressClickRef.current = true;
        props.onOpenPerson(node);
        window.setTimeout(() => {
          suppressClickRef.current = false;
        }, 0);
      } else {
        lastNodeClickRef.current = { id: node.id, at: clickedAt };
      }
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", finish);
    window.addEventListener("pointercancel", cleanup);
  };

  let content;
  if (!hasPeople) {
    content = (
      <ProfileTabEmptyState
        icon={Network}
        title="// NO RELATIONSHIP NODES"
        description={<>Add a person and describe how they relate to {person.name}.</>}
        actionLabel="Add related person"
        onAction={props.onAdd}
      />
    );
  } else if (view === "graph") {
    content = (
      <RelationGraph
        boardRef={boardRef}
        people={allPeople}
        centerPersonId={person.id}
        relationships={relationships}
        points={points}
        camera={camera}
        panning={panning}
        suppressClickRef={suppressClickRef}
        avatarUrl={props.avatarUrl}
        onPan={handlePan}
        onWheel={handleWheel}
        onDrag={handleNodeDrag}
        onInspect={props.onInspect}
        onEditPerson={props.onEditPerson}
        onAddConnection={props.onAddConnection}
        onRemovePerson={props.onRemovePerson}
        onZoom={zoomBy}
        onFit={fitView}
      />
    );
  } else {
    content = (
      <RelationList
        people={people}
        relationships={relationships}
        avatarUrl={props.avatarUrl}
        onInspect={props.onInspect}
        onOpenPerson={props.onOpenPerson}
        onEditPerson={props.onEditPerson}
        onAddConnection={props.onAddConnection}
        onEditRelationship={props.onEditRelationship}
        onDeleteRelationship={props.onDeleteRelationship}
        onRemovePerson={props.onRemovePerson}
      />
    );
  }

  return (
    <ProfileContent className="relation-tab" fill={hasPeople}>
      <ProfileContentHeader
        className="relation-head"
        eyebrow={`RELATION_NETWORK / PEOPLE:${String(people.length).padStart(2, "0")}`}
        title={tab.name}
        actions={(
          <div className="relation-head-actions">
            <div className="relation-view-switch" role="group" aria-label="Relation view">
              <Tooltip label="Graph view">
                <button
                  className={view === "graph" ? "is-active" : ""}
                  onClick={() => changeView("graph")}
                  aria-label="Graph view"
                  aria-pressed={view === "graph"}
                >
                  <Network size={15} />
                </button>
              </Tooltip>
              <Tooltip label="List view">
                <button
                  className={view === "list" ? "is-active" : ""}
                  onClick={() => changeView("list")}
                  aria-label="List view"
                  aria-pressed={view === "list"}
                >
                  <List size={15} />
                </button>
              </Tooltip>
            </div>
            <Button variant="signal" size="sm" onClick={props.onAdd}>
              <Plus size={13} /> Add person
            </Button>
          </div>
        )}
      />
      <ProfileContentBody padding={hasPeople ? "flush" : "padded"}>
        {content}
      </ProfileContentBody>
    </ProfileContent>
  );
}
