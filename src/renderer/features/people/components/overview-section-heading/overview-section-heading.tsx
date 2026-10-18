import "./overview-section-heading.css";

interface OverviewSectionHeadingProps {
  label: string;
  action?: string;
  onAction?: () => void;
}

export function OverviewSectionHeading({
  label,
  action,
  onAction,
}: OverviewSectionHeadingProps) {
  return (
    <div className="person-overview-section-head">
      <span>{label}</span>
      {action && onAction && (
        <button type="button" onClick={onAction}>
          {action} →
        </button>
      )}
    </div>
  );
}
