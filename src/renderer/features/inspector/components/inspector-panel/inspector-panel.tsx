import { Button } from "@/components/button/button";
import { NetworkMotif } from "@/components/network-motif/network-motif";
import { useDossierApi } from "@/api/use-dossier-api";
import { InspectField } from "@/features/inspector/components/inspect-field/inspect-field";
import { InspectorHeader } from "@/features/inspector/components/inspector-header/inspector-header";
import { MediaDetails } from "@/features/inspector/components/media-details/media-details";
import { RelatedEntities } from "@/features/inspector/components/related-entities/related-entities";
import { safeDomain } from "@/features/inspector/inspector.logic";
import type { InspectorPanelProps } from "@/features/inspector/inspector.types";
import { shortId } from "@/lib/identifier-format";
import { getLinkTitle, getWebsiteName } from "@shared/website";
import "./inspector-panel.css";

export function InspectorPanel({
  selected,
  onClose,
  onMediaUpdate,
  onMediaExport,
  onOpenPerson,
}: InspectorPanelProps) {
  const api = useDossierApi();

  if (selected && "kind" in selected && selected.kind === "relation-person") {
    const avatarUrl = selected.person.profilePhotoId
      ? api.profileThumbnailUrl({ id: selected.person.profilePhotoId })
      : undefined;
    const initials = selected.person.name
      .split(/\s+/)
      .map((namePart) => namePart[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();

    return (
      <aside className="inspector panel relation-inspector">
        <InspectorHeader onClose={onClose} eyebrow="// RELATED PERSON" title="Person detail" />
        <div className={`relation-inspector-avatar ${avatarUrl ? "has-photo" : ""}`}>
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={`${selected.person.name} profile`}
              draggable={false}
            />
          ) : initials}
        </div>
        <div className="inspect-fields">
          <InspectField label="NAME" value={selected.person.name} />
          <InspectField
            label="RELATION"
            value={selected.relationship?.relationType ?? "Connected person"}
          />
          <InspectField
            label="ALIASES"
            value={selected.person.aliases.join(" / ") || "// NONE"}
          />
          <InspectField label="BIRTH DATE" value={selected.person.birthDate ?? "// UNKNOWN"} />
          <InspectField label="SUMMARY" value={selected.person.summary || "// EMPTY"} />
          <InspectField label="DOSSIER ID" value={shortId(selected.person.id)} />
        </div>
        <Button variant="signal" onClick={() => onOpenPerson?.(selected.person.id)}>
          Open full dossier
        </Button>
      </aside>
    );
  }

  if (selected && "mimeType" in selected) {
    return (
      <aside className="inspector panel is-media">
        <MediaDetails
          item={selected}
          onUpdate={onMediaUpdate}
          onExport={onMediaExport}
          onClose={onClose}
        />
      </aside>
    );
  }

  const objectType = selected && "url" in selected ? "SOURCE_NODE" : "NO_SELECTION";

  return (
    <aside className="inspector panel">
      <InspectorHeader onClose={onClose} eyebrow="// INSPECTOR" title="Object detail" />
      <div className="inspector-network">
        <NetworkMotif compact />
        <span className="node-label primary">SUBJECT</span>
        <span className="node-label related">{selected ? "OBJECT" : "AWAITING"}</span>
      </div>
      <div className="inspect-status">
        <span className={selected ? "live-dot" : ""} />
        {objectType}
      </div>
      {selected && "url" in selected ? (
        <div className="inspect-fields">
          <InspectField label="OBJECT_ID" value={shortId(selected.id)} />
          <InspectField label="LABEL" value={getLinkTitle(selected.label, selected.url)} />
          <InspectField label="WEBSITE" value={getWebsiteName(selected.url)} />
          <InspectField label="DOMAIN" value={safeDomain(selected.url)} />
          <RelatedEntities />
        </div>
      ) : (
        <div className="inspect-empty">
          <span>[ ]</span>
          <p>Select a log, evidence file, or source node to inspect relationships.</p>
        </div>
      )}
    </aside>
  );
}
