import { useEffect, useState, type FormEvent } from "react";
import type { PersonInput } from "@shared/types";
import { Button } from "@/components/button/button";
import { Dialog } from "@/components/dialog/dialog";
import { FormField } from "@/components/form-field/form-field";
import { Input, Textarea } from "@/components/form-control/form-control";
import { prepareProfilePhoto } from "@/features/people/logic/profile-photo";
import "./person-dialog.css";
import type { PersonDialogProps } from "./person-dialog.types";

const emptyPerson: PersonInput = {
  name: "",
  aliases: [],
  summary: "",
  birthDate: null,
};

export function PersonDialog({ open, onOpenChange, person, onSave }: PersonDialogProps) {
  const [form, setForm] = useState<PersonInput>(emptyPerson);
  const [aliasesText, setAliasesText] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) {
      return;
    }
    setForm(person ? {
      name: person.name,
      aliases: person.aliases,
      birthDate: person.birthDate,
      summary: person.summary,
    } : emptyPerson);
    setAliasesText(person?.aliases.join(", ") ?? "");
  }, [open, person]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    try {
      await onSave({
        ...form,
        aliases: aliasesText.split(",").map((alias) => alias.trim()).filter(Boolean),
      });
      onOpenChange(false);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={person ? "EDIT SUBJECT FILE" : "REGISTER NEW SUBJECT"}
      description="All fields remain inside the local vault."
    >
      <form className="dialog-form" onSubmit={submit}>
        <FormField label="FULL NAME / REQUIRED">
          <Input
            autoFocus
            required
            value={form.name}
            onChange={(event) => setForm({ ...form, name: event.target.value })}
            placeholder="e.g. Mara Voss"
          />
        </FormField>
        <FormField label="PROFILE PHOTO / OPTIONAL">
          <label className="file-input">
            <input
              type="file"
              accept="image/*"
              onChange={async (event) => {
                const file = event.target.files?.[0];
                if (file) {
                  setForm({ ...form, ...await prepareProfilePhoto(file) });
                }
              }}
            />
            <span>{form.profilePhoto ? form.profilePhoto.name : "Choose local image…"}</span>
            <small>SELECT</small>
          </label>
        </FormField>
        <FormField label="ALIASES / COMMA-SEPARATED">
          <Input
            value={aliasesText}
            onChange={(event) => setAliasesText(event.target.value)}
            placeholder="M. Voss, Kestrel"
          />
        </FormField>
        <FormField label="BIRTH DATE">
          <Input
            type="date"
            value={form.birthDate ?? ""}
            onChange={(event) => setForm({
              ...form,
              birthDate: event.target.value || null,
            })}
          />
        </FormField>
        <FormField label={`BIO / INDEX INTRO · ${(form.summary ?? "").length}/255`}>
          <Textarea
            maxLength={255}
            value={form.summary}
            onChange={(event) => setForm({ ...form, summary: event.target.value })}
            placeholder="Concise, factual subject overview..."
          />
        </FormField>
        <div className="dialog-actions">
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="signal"
            disabled={busy || !form.name.trim() || (form.summary?.length ?? 0) > 255}
          >
            {busy ? "Writing…" : person ? "Commit changes" : "Create dossier"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
