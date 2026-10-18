import type { LinkItem, PersonTab } from "@shared/types";

export interface LinksTabProps {
  tab: PersonTab;
  links: LinkItem[];
  iconUrl: (link: LinkItem) => string;
  onAdd: () => void;
  onEdit: (link: LinkItem) => void;
  onDelete: (link: LinkItem) => void;
}
