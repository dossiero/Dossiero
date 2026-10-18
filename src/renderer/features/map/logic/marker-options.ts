import {
  Bookmark,
  BriefcaseBusiness,
  Building2,
  Circle,
  CircleDot,
  Flag,
  Heart,
  Home,
  MapPin,
  Shield,
  Star,
  Square,
  Triangle,
  UserRound,
  Zap,
} from "lucide-react";

export const iconChoices = [
  { value: "pin", Icon: MapPin },
  { value: "star", Icon: Star },
  { value: "home", Icon: Home },
  { value: "person", Icon: UserRound },
  { value: "flag", Icon: Flag },
  { value: "building", Icon: Building2 },
  { value: "briefcase", Icon: BriefcaseBusiness },
  { value: "bookmark", Icon: Bookmark },
  { value: "heart", Icon: Heart },
  { value: "shield", Icon: Shield },
  { value: "target", Icon: CircleDot },
  { value: "bolt", Icon: Zap },
];

export const markerChoices = [
  { value: "pin", Icon: MapPin },
  { value: "circle", Icon: Circle },
  { value: "square", Icon: Square },
  { value: "star", Icon: Star },
  { value: "triangle", Icon: Triangle },
] as const;
