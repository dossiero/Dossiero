import type { ReactNode } from "react";
import { Title } from "@/components/title/title";
import { cn } from "@/lib/class-names";
import "./profile-content-header.css";

interface ProfileContentHeaderProps {
  actions?: ReactNode;
  className?: string;
  eyebrow: ReactNode;
  title: ReactNode;
}

export function ProfileContentHeader({
  actions,
  className,
  eyebrow,
  title,
}: ProfileContentHeaderProps) {
  return (
    <header className={cn("content-head", "profile-content-header", className)}>
      <div>
        <span className="eyebrow">{eyebrow}</span>
        <Title level={2}>{title}</Title>
      </div>
      {actions}
    </header>
  );
}
