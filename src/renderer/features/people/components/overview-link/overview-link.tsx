import { Link2 } from "lucide-react";
import type { LinkItem } from "@shared/types";
import { getLinkTitle, getWebsiteName } from "@shared/website";
import "./overview-link.css";

export function OverviewLink({ link, iconUrl }: { link: LinkItem; iconUrl: string }) {
  return (
    <a href={link.url} target="_blank" rel="noreferrer" title={link.url}>
      <span className="person-overview-link-icon">
        <Link2 size={14} />
        {iconUrl && <img src={iconUrl} alt="" loading="lazy" />}
      </span>
      <span>
        <strong>{getLinkTitle(link.label, link.url)}</strong>
        <small>{getWebsiteName(link.url)}</small>
      </span>
    </a>
  );
}
