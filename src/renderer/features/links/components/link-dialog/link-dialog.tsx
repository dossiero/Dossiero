import { useEffect, useState, type FormEvent } from "react";
import { Button } from "@/components/button/button";
import { Dialog } from "@/components/dialog/dialog";
import { FormField } from "@/components/form-field/form-field";
import { Input, Textarea } from "@/components/form-control/form-control";
import "./link-dialog.css";
import type { LinkDialogProps } from "./link-dialog.types";

const emptyLink = { label: "", url: "", notes: "" };

export function LinkDialog({ open, onOpenChange, link, onSave }: LinkDialogProps) {
  const [form, setForm] = useState(emptyLink);

  useEffect(() => {
    if (open) {
      setForm(link ? { label: link.label, url: link.url, notes: link.notes } : emptyLink);
    }
  }, [open, link]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    await onSave(form);
    onOpenChange(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={link ? "EDIT SOURCE NODE" : "ATTACH SOURCE NODE"}
    >
      <form className="dialog-form" onSubmit={submit}>
        <FormField label="URL / REQUIRED">
          <Input
            autoFocus
            required
            type="url"
            value={form.url}
            onChange={(event) => setForm({ ...form, url: event.target.value })}
            placeholder="https://..."
          />
        </FormField>
        <FormField label="SOURCE LABEL / OPTIONAL">
          <Input
            value={form.label}
            onChange={(event) => setForm({ ...form, label: event.target.value })}
            placeholder="Uses the website name when empty"
          />
        </FormField>
        <FormField label="DESCRIPTION / OPTIONAL">
          <Textarea
            value={form.notes}
            onChange={(event) => setForm({ ...form, notes: event.target.value })}
            placeholder="Verification status, context, caveats..."
          />
        </FormField>
        <div className="dialog-actions">
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" variant="signal" disabled={!form.url}>
            Add link
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
