import "./inspect-field.css";

export function InspectField({ label, value }: { label: string; value: string }) {
  return (
    <div className="inspect-field">
      <span className="meta-label">{label}</span>
      <strong>{value || "// NULL"}</strong>
    </div>
  );
}
