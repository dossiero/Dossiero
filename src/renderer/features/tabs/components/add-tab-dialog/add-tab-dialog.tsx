import { useState, type FormEvent } from "react";
import { FileText, Images, Link2, Map as MapIcon, Network, type LucideIcon } from "lucide-react";
import type { TabKind } from "@shared/types";
import { Button } from "@/components/button/button";
import { Dialog } from "@/components/dialog/dialog";
import { FormField } from "@/components/form-field/form-field";
import { Input } from "@/components/form-control/form-control";
import "./add-tab-dialog.css";

interface AddTabDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (input: { name: string; kind: TabKind }) => Promise<void>;
}

interface TabKindOption {
  value: TabKind;
  label: string;
  icon: LucideIcon;
  description: string;
}

const tabKindOptions: TabKindOption[] = [
  { value: "text", label: "Text channel", icon: FileText, description: "free-form document" },
  { value: "media", label: "Media vault", icon: Images, description: "files and evidence" },
  { value: "links", label: "Source nodes", icon: Link2, description: "URLs and profiles" },
  {
    value: "relation",
    label: "Relation network",
    icon: Network,
    description: "people and connections",
  },
  { value: "map", label: "Map canvas", icon: MapIcon, description: "locations and GeoJSON" },
];

export function AddTabDialog({ open, onOpenChange, onSave }: AddTabDialogProps) {
  const [name, setName] = useState("");
  const [kind, setKind] = useState<TabKind>("text");

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    await onSave({ name, kind });
    setName("");
    onOpenChange(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title="INITIALIZE NEW TAB"
      description="Choose a channel type. It cannot be changed later."
      className="add-tab-dialog"
    >
      <form className="dialog-form" onSubmit={submit}>
        <FormField label="TAB DESIGNATION">
          <Input
            autoFocus
            required
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="e.g. Known locations"
          />
        </FormField>
        <div className="type-grid">
          {tabKindOptions.map((option) => {
            const Icon = option.icon;
            return (
              <button
                type="button"
                key={option.value}
                className={kind === option.value ? "is-active" : ""}
                onClick={() => setKind(option.value)}
              >
                <Icon size={18} />
                <strong>{option.label}</strong>
                <small>{option.description}</small>
              </button>
            );
          })}
        </div>
        <div className="dialog-actions">
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" variant="signal" disabled={!name.trim()}>
            Create tab
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
