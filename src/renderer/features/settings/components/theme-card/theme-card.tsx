import { Check } from "lucide-react";
import type { ThemeName } from "@shared/types";
import { cn } from "@/lib/class-names";
import "./theme-card.css";

interface ThemeCardProps {
  name: ThemeName;
  selected: boolean;
  onClick: () => void;
  title: string;
  description: string;
}

export function ThemeCard({
  name,
  selected,
  onClick,
  title,
  description,
}: ThemeCardProps) {
  return (
    <button
      className={cn("theme-card", selected && "is-selected")}
      onClick={onClick}
      aria-pressed={selected}
    >
      <div className={`theme-preview theme-preview-${name}`}>
        <span />
        <span />
        <i />
        <b />
      </div>
      <span className="theme-card-copy">
        <strong>{title}</strong>
        <small>{description}</small>
      </span>
      <span className="theme-check">{selected && <Check size={13} />}</span>
    </button>
  );
}
