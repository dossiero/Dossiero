import { Button } from "@/components/button/button";
import { Title } from "@/components/title/title";
import "./inspector-header.css";

interface InspectorHeaderProps {
  onClose?: () => void;
  eyebrow: string;
  title: string;
}

export function InspectorHeader({ onClose, eyebrow, title }: InspectorHeaderProps) {
  return (
    <div className="inspector-head">
      <div>
        <span className="eyebrow">{eyebrow}</span>
        <Title level={2}>{title}</Title>
      </div>
      {onClose && (
        <Button variant="ghost" size="sm" onClick={onClose}>
          Close
        </Button>
      )}
    </div>
  );
}
