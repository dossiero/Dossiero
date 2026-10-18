import type { Person, RelationPosition } from "@shared/types";
import type { RelationCamera, RelationPoint } from "./relation-graph.types";

export const RELATION_CANVAS_WIDTH = 1600;
export const RELATION_CANVAS_HEIGHT = 1000;
export const MIN_RELATION_SCALE = .5;
export const MAX_RELATION_SCALE = 1;

export function clamp(number: number, minimum: number, maximum: number): number {
  return Math.max(minimum, Math.min(maximum, number));
}

export function makeRelationPositions(
  centerId: string,
  people: Person[],
  savedPositions: RelationPosition[],
): Record<string, RelationPoint> {
  const positions: Record<string, RelationPoint> = { [centerId]: { x: .5, y: .5 } };
  people.forEach((person, index) => {
    const savedPosition = savedPositions.find((position) => position.personId === person.id);
    const angle = -Math.PI / 2 + (Math.PI * 2 * index) / Math.max(people.length, 1);
    positions[person.id] = savedPosition
      ? { x: savedPosition.x, y: savedPosition.y }
      : { x: .5 + Math.cos(angle) * .34, y: .5 + Math.sin(angle) * .34 };
  });
  return positions;
}

export function snapRelationPoint(point: RelationPoint, anchor: RelationPoint): RelationPoint {
  const horizontalDelta = (point.x - anchor.x) * RELATION_CANVAS_WIDTH;
  const verticalDelta = (point.y - anchor.y) * RELATION_CANVAS_HEIGHT;
  const distance = Math.hypot(horizontalDelta, verticalDelta);
  if (distance === 0) return point;
  const angleStep = Math.PI / 4;
  const angle = Math.round(Math.atan2(verticalDelta, horizontalDelta) / angleStep) * angleStep;
  return {
    x: anchor.x + Math.cos(angle) * distance / RELATION_CANVAS_WIDTH,
    y: anchor.y + Math.sin(angle) * distance / RELATION_CANVAS_HEIGHT,
  };
}

export function readRelationCamera(storageKey: string): RelationCamera | null {
  try {
    const stored = JSON.parse(localStorage.getItem(storageKey) ?? "null") as (
      Partial<RelationCamera> | null
    );
    if (stored
      && Number.isFinite(stored.x)
      && Number.isFinite(stored.y)
      && Number.isFinite(stored.scale)) {
      return {
        x: Number(stored.x),
        y: Number(stored.y),
        scale: clamp(Number(stored.scale), MIN_RELATION_SCALE, MAX_RELATION_SCALE),
      };
    }
  } catch {
    return null;
  }
  return null;
}

export function personInitials(personName: string): string {
  return personName
    .split(/\s+/)
    .map((namePart) => namePart[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}
