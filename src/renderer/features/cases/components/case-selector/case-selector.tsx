import { BriefcaseBusiness, Check, ChevronDown, Plus } from "lucide-react";
import type { CaseSummary } from "@shared/types";
import {
  Dropdown,
  DropdownContent,
  DropdownItem,
  DropdownSeparator,
  DropdownTrigger,
} from "@/components/dropdown-menu/dropdown-menu";
import "./case-selector.css";

interface CaseSelectorProps {
  cases: CaseSummary[];
  selectedCaseId: string | null;
  compact?: boolean;
  onSelect: (caseId: string) => void;
  onAdd: () => void;
}

function targetLabel(count: number): string {
  return `${count} ${count === 1 ? "target" : "targets"}`;
}

export function CaseSelector({
  cases,
  selectedCaseId,
  compact = false,
  onSelect,
  onAdd,
}: CaseSelectorProps) {
  const selectedCase = cases.find((caseItem) => caseItem.id === selectedCaseId) ?? cases[0];
  const trigger = (
    <button className="case-selector-trigger" aria-label="Switch case">
      <span className="case-selector-mark">
        <BriefcaseBusiness size={compact ? 19 : 16} />
      </span>
      {!compact && (
        <span className="case-selector-copy">
          <strong>{selectedCase?.title ?? "Cases"}</strong>
          <small>{selectedCase ? targetLabel(selectedCase.targetCount) : "No cases"}</small>
        </span>
      )}
      {!compact && <ChevronDown className="case-selector-chevron" size={14} />}
    </button>
  );

  return (
    <div className={`case-selector${compact ? " is-compact" : ""}`}>
      <Dropdown>
        <DropdownTrigger asChild>
          {trigger}
        </DropdownTrigger>
        <DropdownContent
          className="case-selector-menu"
          align="start"
          sideOffset={5}
        >
          <div className="case-selector-menu-label">CASES</div>
          {cases.map((caseItem) => (
            <DropdownItem key={caseItem.id} onSelect={() => onSelect(caseItem.id)}>
              <span className="case-selector-check">
                {caseItem.id === selectedCaseId && <Check size={13} />}
              </span>
              <span className="case-selector-item-copy">
                <strong>{caseItem.title}</strong>
                <small>{targetLabel(caseItem.targetCount)}</small>
              </span>
            </DropdownItem>
          ))}
          <DropdownSeparator />
          <DropdownItem onSelect={onAdd}>
            <Plus size={14} />
            <span>Add a case</span>
          </DropdownItem>
        </DropdownContent>
      </Dropdown>
    </div>
  );
}
