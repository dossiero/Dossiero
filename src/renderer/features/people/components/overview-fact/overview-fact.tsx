import "./overview-fact.css";

export function OverviewFact({ label, detail }: { label: string; detail: string }) {
  return (
    <div>
      <dt>{label}</dt>
      <dd>{detail}</dd>
    </div>
  );
}
