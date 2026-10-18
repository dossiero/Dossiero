import { useEffect, useState, type FormEvent } from "react";
import { Button } from "@/components/button/button";
import { Dialog } from "@/components/dialog/dialog";
import { FormField } from "@/components/form-field/form-field";
import { Input, Textarea } from "@/components/form-control/form-control";
import "./media-edit-dialog.css";
import type { MediaEditDialogProps } from "./media-edit-dialog.types";

export function MediaEditDialog({
  open,
  onOpenChange,
  item,
  onSave,
}: MediaEditDialogProps) {
  const [caption, setCaption] = useState("");
  const [notes, setNotes] = useState("");
  const [tags, setTags] = useState("");

  useEffect(() => {
    if (open && item) {
      setCaption(item.caption);
      setNotes(item.notes);
      setTags(item.tags.join(", "));
    }
  }, [open, item]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    await onSave({
      caption,
      notes,
      tags: tags.split(",").map((tag) => tag.trim()).filter(Boolean),
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange} title="ANNOTATE EVIDENCE">
      <form className="dialog-form" onSubmit={submit}>
        <FormField label="CAPTION">
          <Input value={caption} onChange={(event) => setCaption(event.target.value)} />
        </FormField>
        <FormField label="TAGS / COMMA-SEPARATED">
          <Input
            value={tags}
            onChange={(event) => setTags(event.target.value)}
            placeholder="location, verified, 2026"
          />
        </FormField>
        <FormField label="NOTES">
          <Textarea value={notes} onChange={(event) => setNotes(event.target.value)} />
        </FormField>
        <div className="dialog-actions">
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" variant="signal">Commit metadata</Button>
        </div>
      </form>
    </Dialog>
  );
}
