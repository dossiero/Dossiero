import { useEffect, useState, type FormEvent } from "react";
import type { PersonInput } from "@shared/types";
import { Button } from "@/components/button/button";
import { Dialog } from "@/components/dialog/dialog";
import { FormField } from "@/components/form-field/form-field";
import { Input, Textarea } from "@/components/form-control/form-control";
import { prepareProfilePhoto } from "@/features/people/logic/profile-photo";
import "./relation-person-dialog.css";
import type { RelationPersonDialogProps } from "./relation-person-dialog.types";

const emptyPerson: PersonInput = {
  name: "",
  aliases: [],
  summary: "",
  birthDate: null,
};

export function RelationPersonDialog({
  open,
  onOpenChange,
  targetName,
  person,
  initialRelationType = "",
  onSave,
}: RelationPersonDialogProps) {
  const [form, setForm] = useState<PersonInput>(emptyPerson);
  const [aliasesText, setAliasesText] = useState("");
  const [relationType, setRelationType] = useState("");
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
    setRelationType(initialRelationType);
  }, [open, person, initialRelationType]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    try {
      await onSave(relationType, {
        ...form,
        aliases: aliasesText.split(",").map((alias) => alias.trim()).filter(Boolean),
      });
      onOpenChange(false);
    } finally {
      setBusy(false);
    }
  };

  const description = person
    ? `Update this dossier and its connection to ${targetName}.`
    : `Create a full dossier connected to ${targetName}.`;

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={person ? "EDIT RELATED PERSON" : "ADD RELATED PERSON"}
      description={description}
    >
      <form className="dialog-form" onSubmit={submit}>
        <FormField label={`RELATION TO ${targetName.toUpperCase()} / REQUIRED`}>
          <Input
            autoFocus
            required
            maxLength={100}
            value={relationType}
            onChange={(event) => setRelationType(event.target.value)}
            placeholder="e.g. wife, son, colleague"
          />
        </FormField>
        <FormField label="FULL NAME / REQUIRED">
          <Input
            required
            value={form.name}
            onChange={(event) => setForm({ ...form, name: event.target.value })}
            placeholder="Person name"
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
          <Input value={aliasesText} onChange={(event) => setAliasesText(event.target.value)} />
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
          />
        </FormField>
        <div className="dialog-actions">
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="signal"
            disabled={busy || !form.name.trim() || !relationType.trim()}
          >
            {busy ? "Writing…" : person ? "Commit changes" : "Create & connect"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
