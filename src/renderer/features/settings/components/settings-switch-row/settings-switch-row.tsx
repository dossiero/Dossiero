import { cn } from "@/lib/class-names";
import "./settings-switch-row.css";

interface SettingsSwitchRowProps {
  title: string;
  description: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (checked: boolean) => void;
}

export function SettingsSwitchRow({
  title,
  description,
  checked,
  disabled,
  onChange,
}: SettingsSwitchRowProps) {
  return (
    <label className={cn("switch-row", disabled && "is-disabled")}>
      <span>
        <strong>{title}</strong>
        <small>{description}</small>
      </span>
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange(event.target.checked)}
      />
      <i aria-hidden="true" />
    </label>
  );
}
