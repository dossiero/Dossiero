import { useEffect, useState, type FormEvent } from "react";
import { Button } from "@/components/button/button";
import { Dialog } from "@/components/dialog/dialog";
import { FormField } from "@/components/form-field/form-field";
import { Input } from "@/components/form-control/form-control";
import "./relation-type-dialog.css";

interface RelationTypeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  value: string;
  onSave: (value: string) => Promise<void>;
}

export function RelationTypeDialog({
  open,
  onOpenChange,
  value,
  onSave,
}: RelationTypeDialogProps) {
  const [relationType, setRelationType] = useState(value);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (open) {
      setRelationType(value);
    }
  }, [open, value]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    try {
      await onSave(relationType);
      onOpenChange(false);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange} title="EDIT RELATIONSHIP">
      <form className="dialog-form" onSubmit={submit}>
        <FormField label="RELATION TYPE">
          <Input
            autoFocus
            required
            maxLength={100}
            value={relationType}
            onChange={(event) => setRelationType(event.target.value)}
          />
        </FormField>
        <div className="dialog-actions">
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" variant="signal" disabled={busy || !relationType.trim()}>
            Save relation
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
