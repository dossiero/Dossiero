import {
  ExternalLink,
  MoreHorizontal,
  Pencil,
  Plus,
  Radar,
  Trash2,
} from "lucide-react";
import { getLinkTitle } from "@shared/website";
import { Button } from "@/components/button/button";
import {
  Dropdown,
  DropdownContent,
  DropdownItem,
  DropdownTrigger,
} from "@/components/dropdown-menu/dropdown-menu";
import { ProfileContent } from "@/components/profile-content/profile-content";
import { ProfileContentBody } from "@/components/profile-content-body/profile-content-body";
import { ProfileContentHeader } from "@/components/profile-content-header/profile-content-header";
import { ProfileTabEmptyState } from "@/components/profile-tab-empty-state/profile-tab-empty-state";
import { Title } from "@/components/title/title";
import { WebsiteIcon } from "@/features/links/components/website-icon/website-icon";
import "./links-tab.css";
import type { LinksTabProps } from "./links-tab.types";

const LINK_REVEAL_DELAY_MS = 40;

export function LinksTab({
  tab,
  links,
  iconUrl,
  onAdd,
  onEdit,
  onDelete,
}: LinksTabProps) {
  const entryCount = String(links.length).padStart(2, "0");

  return (
    <ProfileContent>
      <ProfileContentHeader
        eyebrow={`SOURCE_NODES / ENTRIES:${entryCount}`}
        title={tab.name}
        actions={(
          <Button className="link-add-button" variant="signal" size="sm" onClick={onAdd}>
            <Plus size={13} />
            <span className="link-add-label-full">Add link</span>
            <span className="link-add-label-compact">Add link</span>
          </Button>
        )}
      />
      <ProfileContentBody>
        {links.length > 0 ? (
          <div className="link-list">
            {links.map((link, index) => {
              const title = getLinkTitle(link.label, link.url);

              return (
                <article
                  key={link.id}
                  className="link-card panel-brackets"
                  style={{ animationDelay: `${index * LINK_REVEAL_DELAY_MS}ms` }}
                >
                  <WebsiteIcon
                    src={iconUrl(link)}
                    href={link.url}
                    label={title}
                  />
                  <div className="link-copy">
                    <Title level={3}>
                      <a
                        className="link-title"
                        href={link.url}
                        target="_blank"
                        rel="noreferrer"
                        onClick={(event) => event.stopPropagation()}
                      >
                        {title}
                      </a>
                    </Title>
                    <a
                      className="link-url"
                      href={link.url}
                      target="_blank"
                      rel="noreferrer"
                      onClick={(event) => event.stopPropagation()}
                    >
                      <span>{link.url}</span>
                      <ExternalLink size={11} />
                    </a>
                    {link.notes && <p>{link.notes}</p>}
                  </div>
                  <div className="link-actions">
                    <Dropdown>
                      <DropdownTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label="Link actions"
                          onClick={(event) => event.stopPropagation()}
                        >
                          <MoreHorizontal size={15} />
                        </Button>
                      </DropdownTrigger>
                      <DropdownContent>
                        <DropdownItem onSelect={() => onEdit(link)}>
                          <Pencil size={13} /> Edit source
                        </DropdownItem>
                        <DropdownItem onSelect={() => onDelete(link)} danger>
                          <Trash2 size={13} /> Delete source
                        </DropdownItem>
                      </DropdownContent>
                    </Dropdown>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <ProfileTabEmptyState
            icon={Radar}
            title="// NO SOURCE NODES"
            description="Attach a verified URL or social profile reference."
            actionLabel="Initialize channel"
            onAction={onAdd}
          />
        )}
      </ProfileContentBody>
    </ProfileContent>
  );
}
