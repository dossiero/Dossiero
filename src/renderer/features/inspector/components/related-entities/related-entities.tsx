import "./related-entities.css";

export function RelatedEntities() {
  return (
    <div className="relation-block">
      <span className="meta-label">RELATED ENTITIES</span>
      <div className="relation">
        <i />
        <span>Current subject</span>
        <code>1 hop</code>
      </div>
      <div className="relation">
        <i />
        <span>Active tab</span>
        <code>1 hop</code>
      </div>
    </div>
  );
}
