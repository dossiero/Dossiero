import { InspectField } from "@/features/inspector/components/inspect-field/inspect-field";
import type { ExifState } from "@/features/inspector/inspector.types";
import "./exif-details.css";

export function ExifDetails({ state }: { state: ExifState }) {
  if (state.status === "loading") {
    return (
      <div className="media-inspector-section-body">
        <p className="exif-message">
          <span className="live-dot" /> Reading embedded metadata…
        </p>
      </div>
    );
  }

  if (state.status === "error") {
    return (
      <div className="media-inspector-section-body">
        <p className="exif-message is-error">{state.message}</p>
      </div>
    );
  }

  if (state.status === "ready" && state.entries.length === 0) {
    return (
      <div className="media-inspector-section-body">
        <p className="exif-message">No EXIF metadata found in this file.</p>
      </div>
    );
  }

  return (
    <div className="media-inspector-section-body">
      {state.entries.map((entry, index) => (
        <InspectField
          key={`${entry.label}-${index}`}
          label={entry.label.toUpperCase()}
          value={entry.value}
        />
      ))}
    </div>
  );
}
