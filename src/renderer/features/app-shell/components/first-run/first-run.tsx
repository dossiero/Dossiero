import { NetworkMotif } from "@/components/network-motif/network-motif";
import { Title } from "@/components/title/title";
import "./first-run.css";
import type { FirstRunProps } from "./first-run.types";

export function FirstRun({ onAdd, onMenu }: FirstRunProps) {
  return (
    <div className="first-run">
      <button className="mobile-menu-empty" onClick={onMenu}>
        TARGETS
      </button>
      <NetworkMotif />
      <span className="eyebrow">LOCAL VAULT / ZERO SUBJECTS</span>
      <Title level={1}>
        NO SIGNAL<span className="cursor">_</span>
      </Title>
      <p>Begin a private intelligence file. Nothing leaves this device.</p>
      <button className="first-run-button" onClick={onAdd}>
        <span>+</span> REGISTER FIRST SUBJECT
      </button>
      <div className="ascii-creature" aria-hidden="true">
        {"  ╲  │  ╱\n───( ◉ )───\n  ╱  │  ╲"}
      </div>
    </div>
  );
}
