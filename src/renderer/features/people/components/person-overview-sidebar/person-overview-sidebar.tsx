import { PanelRightClose } from "lucide-react";
import type {
  LinkItem,
  MediaItem,
  PersonBundle,
  TabKind,
} from "@shared/types";
import { formatDate } from "@/lib/display-format";
import { shortId } from "@/lib/identifier-format";
import { Button } from "@/components/button/button";
import { Tooltip } from "@/components/tooltip/tooltip";
import { Title } from "@/components/title/title";
import { OverviewFact } from "@/features/people/components/overview-fact/overview-fact";
import { OverviewLink } from "@/features/people/components/overview-link/overview-link";
import { OverviewMediaThumbnail } from "@/features/people/components/overview-media-thumbnail/overview-media-thumbnail";
import { OverviewSectionHeading } from "@/features/people/components/overview-section-heading/overview-section-heading";
import { formatBirthDate } from "@/features/people/person-overview.logic";
import "./person-overview-sidebar.css";

interface PersonOverviewSidebarProps {
  bundle: PersonBundle;
  mediaUrl: (item: MediaItem) => string;
  linkIconUrl: (item: LinkItem) => string;
  onInspectMedia: (item: MediaItem) => void;
  onOpenTab: (kind: TabKind) => void;
  onClose?: () => void;
}

interface OverviewMetric {
  kind: TabKind;
  label: string;
  value: number;
}

export function PersonOverviewSidebar({
  bundle,
  mediaUrl,
  linkIconUrl,
  onInspectMedia,
  onOpenTab,
  onClose,
}: PersonOverviewSidebarProps) {
  const { person } = bundle;
  const recentMedia = [...bundle.mediaItems]
    .sort((left, right) => Date.parse(right.importedAt) - Date.parse(left.importedAt))
    .slice(0, 8);
  const recentLinks = [...bundle.links]
    .sort((left, right) => Date.parse(right.updatedAt) - Date.parse(left.updatedAt))
    .slice(0, 3);
  const connectedPeople = new Set(
    bundle.relationships.map((relationship) => relationship.relatedPersonId),
  ).size;
  const mapItems = bundle.maps.reduce((total, map) => total + map.features.length, 0);
  const availableKinds = new Set(bundle.tabs.map((tab) => tab.kind));
  const metrics: OverviewMetric[] = [
    { kind: "media", label: "Media", value: bundle.mediaItems.length },
    { kind: "links", label: "Links", value: bundle.links.length },
    { kind: "relation", label: "Connections", value: connectedPeople },
    { kind: "map", label: "Map items", value: mapItems },
  ];

  return (
    <aside className="inspector person-overview panel">
      <header className="person-overview-head">
        <div>
          <span className="eyebrow">// DOSSIER OVERVIEW</span>
          <Title level={2}>Subject snapshot</Title>
        </div>
        {onClose && (
          <Tooltip label="Hide dossier overview">
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              aria-label="Hide dossier overview"
            >
              <PanelRightClose size={16}/>
            </Button>
          </Tooltip>
        )}
      </header>

      <section className="person-overview-section person-overview-bio">
        <OverviewSectionHeading label="Profile"/>
        <p>
          {person.summary || "// No subject summary has been recorded."}
        </p>
        <dl className="person-overview-facts">
          <OverviewFact label="Aliases" detail={person.aliases.join(" / ") || "// NONE"}/>
          <OverviewFact label="Birth date" detail={formatBirthDate(person.birthDate)}/>
          <OverviewFact label="Last updated" detail={formatDate(person.updatedAt)}/>
          <OverviewFact label="Dossier ID" detail={shortId(person.id)}/>
        </dl>
      </section>

      <section className="person-overview-section">
        <OverviewSectionHeading label="At a glance"/>
        <div className="person-overview-metrics">
          {metrics.map((metric) => (
            <button
              key={metric.kind}
              type="button"
              disabled={!availableKinds.has(metric.kind)}
              onClick={() => onOpenTab(metric.kind)}
            >
              <strong>{String(metric.value).padStart(2, "0")}</strong>
              <span>{metric.label}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="person-overview-section">
        <OverviewSectionHeading
          label="Recent media"
          action={availableKinds.has("media") ? "View all" : undefined}
          onAction={() => onOpenTab("media")}
        />
        {recentMedia.length > 0 ? (
          <div className="person-overview-media-grid">
            {recentMedia.map((item) => (
              <OverviewMediaThumbnail
                key={item.id}
                media={item}
                url={mediaUrl(item)}
                onClick={() => onInspectMedia(item)}
              />
            ))}
          </div>
        ) : (
          <p className="person-overview-empty">// NO MEDIA LOGGED</p>
        )}
      </section>

      <section className="person-overview-section">
        <OverviewSectionHeading
          label="Links"
          action={availableKinds.has("links") ? "View all" : undefined}
          onAction={() => onOpenTab("links")}
        />
        {recentLinks.length > 0 ? (
          <div className="person-overview-links">
            {recentLinks.map((link) => (
              <OverviewLink
                key={link.id}
                link={link}
                iconUrl={linkIconUrl(link)}
              />
            ))}
          </div>
        ) : (
          <p className="person-overview-empty">// NO LINKS LOGGED</p>
        )}
      </section>
    </aside>
  );
}
