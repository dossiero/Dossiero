import "./media-property.css";

export function MediaProperty({ label, value }: { label: string; value: string }) {
  return (
    <div className="media-property">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
