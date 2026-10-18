import type { ReactNode } from "react";
import "./form-field.css";

export function FormField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="field">
      <label>{label}</label>
      {children}
    </div>
  );
}
