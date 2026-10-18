import type { ReactNode } from "react";
import "./settings-pane-button.css";

interface SettingsPaneButtonProps {
  active: boolean;
  onClick: () => void;
  icon: ReactNode;
  label: string;
}

export function SettingsPaneButton({
  active,
  onClick,
  icon,
  label,
}: SettingsPaneButtonProps) {
  return (
    <button
      className={active ? "is-active" : ""}
      onClick={onClick}
      aria-current={active ? "page" : undefined}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}
