import "./network-motif.css";

export function NetworkMotif({ compact = false }: { compact?: boolean }) {
  return <svg className={`network-motif ${compact ? 'compact' : ''}`} viewBox="0 0 500 280" aria-hidden="true">
    <g className="network-links"><path d="M32 238 Q145 110 252 144 T472 45"/><path d="M20 62 Q165 180 252 144 T465 235"/><path d="M118 20 Q152 128 252 144 T382 274"/><path d="M252 144 Q310 50 385 74"/></g>
    <g className="network-nodes"><circle cx="32" cy="238" r="4"/><circle cx="20" cy="62" r="3"/><circle cx="118" cy="20" r="3"/><circle cx="252" cy="144" r="7"/><circle cx="472" cy="45" r="4"/><circle cx="465" cy="235" r="3"/><circle cx="382" cy="274" r="3"/><circle cx="385" cy="74" r="3"/></g>
  </svg>;
}
