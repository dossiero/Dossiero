import { BookOpen, BriefcaseBusiness, CalendarDays, Camera, FileText, Folder, Globe2, Images, Link2, MapPin, Shield, Star, Tag, UserRound, type LucideIcon } from 'lucide-react';
import type { TabIcon, TabKind } from '../../shared/types';

export const tabIcons: Record<TabIcon, LucideIcon> = {
  'file-text': FileText,
  images: Images,
  link: Link2,
  user: UserRound,
  book: BookOpen,
  briefcase: BriefcaseBusiness,
  calendar: CalendarDays,
  'map-pin': MapPin,
  star: Star,
  tag: Tag,
  folder: Folder,
  camera: Camera,
  globe: Globe2,
  shield: Shield
};

export const tabIconOptions = (Object.entries(tabIcons) as [TabIcon, LucideIcon][]).map(([value, Icon]) => ({ value, Icon }));

export const defaultTabIcon = (kind: TabKind): TabIcon => {
  if (kind === 'media') return 'images';
  if (kind === 'links') return 'link';
  if (kind === 'relation') return 'user';
  if (kind === 'map') return 'map-pin';
  return 'file-text';
};
