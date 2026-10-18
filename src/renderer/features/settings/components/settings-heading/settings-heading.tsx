import type { ReactNode } from "react";
import { Title } from "@/components/title/title";
import "./settings-heading.css";

interface SettingsHeadingProps {
  title: string;
  subtitle: string;
  action?: ReactNode;
}

export function SettingsHeading({ title, subtitle, action }: SettingsHeadingProps) {
  return (
    <div className="settings-heading">
      <div>
        <Title level={2}>{title}</Title>
        <p>{subtitle}</p>
      </div>
      {action}
    </div>
  );
}
