import { useEffect, useState, type FormEvent } from "react";
import type { PersonTab, TabIcon } from "@shared/types";
import { Button } from "@/components/button/button";
import { Dialog } from "@/components/dialog/dialog";
import { FormField } from "@/components/form-field/form-field";
import { Input } from "@/components/form-control/form-control";
import { tabIconOptions } from "@/lib/tab-icons";
import "./edit-tab-dialog.css";

interface EditTabDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tab: PersonTab | null;
  onSave: (input: { name: string; icon: TabIcon }) => Promise<void>;
}

export function EditTabDialog({ open, onOpenChange, tab, onSave }: EditTabDialogProps) {
  const [name, setName] = useState("");
  const [icon, setIcon] = useState<TabIcon>("file-text");

  useEffect(() => {
    if (open && tab) {
      setName(tab.name);
      setIcon(tab.icon);
    }
  }, [open, tab]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    await onSave({ name, icon });
    onOpenChange(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title="EDIT TAB"
      description="Change the label and choose a tab icon."
    >
      <form className="dialog-form" onSubmit={submit}>
        <FormField label="TAB LABEL">
          <Input
            autoFocus
            required
            maxLength={80}
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
        </FormField>
        <FormField label="ICON">
          <div className="tab-icon-grid">
            {tabIconOptions.map((option) => (
              <button
                type="button"
                key={option.value}
                className={icon === option.value ? "is-active" : ""}
                onClick={() => setIcon(option.value)}
                aria-label={option.value.replace("-", " ")}
                aria-pressed={icon === option.value}
                title={option.value.replace("-", " ")}
              >
                <option.Icon size={18} />
              </button>
            ))}
          </div>
        </FormField>
        <div className="dialog-actions">
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" variant="signal" disabled={!name.trim()}>
            Save tab
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
