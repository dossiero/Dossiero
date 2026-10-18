import { useEffect, useState, type FormEvent } from "react";
import type { CaseInput } from "@shared/types";
import { Button } from "@/components/button/button";
import { Dialog } from "@/components/dialog/dialog";
import { Input, Textarea } from "@/components/form-control/form-control";
import { FormField } from "@/components/form-field/form-field";
import "./case-dialog.css";

interface CaseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (input: CaseInput) => Promise<void>;
}

export function CaseDialog({ open, onOpenChange, onSave }: CaseDialogProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    if (!open) {
      setTitle("");
      setDescription("");
    }
  }, [open]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    await onSave({ title, description });
    onOpenChange(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title="CREATE CASE"
      description="Start a focused workspace for its people, notes, and evidence."
      className="case-dialog"
    >
      <form className="dialog-form" onSubmit={submit}>
        <FormField label="CASE TITLE">
          <Input
            autoFocus
            required
            maxLength={120}
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="e.g. Northstar inquiry"
          />
        </FormField>
        <FormField label="DESCRIPTION">
          <Textarea
            maxLength={1000}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="What is this case about?"
          />
        </FormField>
        <div className="dialog-actions">
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" variant="signal" disabled={!title.trim()}>
            Create case
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
