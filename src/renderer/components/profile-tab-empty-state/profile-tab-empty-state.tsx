import type { LucideIcon } from "lucide-react";
import { Plus } from "lucide-react";
import type { ReactNode } from "react";
import { NetworkMotif } from "@/components/network-motif/network-motif";
import { Button } from "@/components/button/button";
import "./profile-tab-empty-state.css";

interface ProfileTabEmptyStateProps {
  actionLabel: string;
  description: ReactNode;
  icon: LucideIcon;
  onAction: () => void;
  title: ReactNode;
}

export function ProfileTabEmptyState({
  actionLabel,
  description,
  icon: Icon,
  onAction,
  title,
}: ProfileTabEmptyStateProps) {
  return (
    <div className="profile-tab-empty-state">
      <NetworkMotif />
      <Icon size={28} />
      <strong>{title}</strong>
      <p>{description}</p>
      <Button variant="signal" size="sm" onClick={onAction}>
        <Plus size={12} />
        {actionLabel}
      </Button>
    </div>
  );
}
