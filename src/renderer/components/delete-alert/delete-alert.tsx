import * as AlertDialogPrimitive from "@radix-ui/react-alert-dialog";
import { useEffect, useState } from "react";
import { AlertActions } from "@/components/alert-actions/alert-actions";
import { Input } from "@/components/form-control/form-control";
import type { DeleteAlertProps } from "./delete-alert.types";
import "./delete-alert.css";

export function DeleteAlert({
  open,
  onOpenChange,
  subject,
  confirmText,
  description,
  confirmLabel = "Delete permanently",
  onConfirm,
}: DeleteAlertProps) {
  const [typedConfirmation, setTypedConfirmation] = useState("");

  useEffect(() => {
    if (open) {
      setTypedConfirmation("");
    }
  }, [open]);

  const confirmationAllowed = !confirmText || typedConfirmation === confirmText;

  return (
    <AlertDialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <AlertDialogPrimitive.Portal>
        <AlertDialogPrimitive.Overlay className="ui-overlay" />
        <AlertDialogPrimitive.Content className="ui-alert panel-brackets">
          <span className="danger-code">!! DESTRUCTIVE COMMAND</span>
          <AlertDialogPrimitive.Title>CONFIRM DELETION</AlertDialogPrimitive.Title>
          <AlertDialogPrimitive.Description>
            {description ?? (
              <>
                This will permanently remove <strong>{subject}</strong> and its locally stored
                evidence. This action cannot be undone.
              </>
            )}
          </AlertDialogPrimitive.Description>
          {confirmText && (
            <div className="field typed-confirm">
              <label>TYPE “{confirmText}” TO AUTHORIZE</label>
              <Input
                value={typedConfirmation}
                onChange={(event) => setTypedConfirmation(event.target.value)}
                autoComplete="off"
              />
            </div>
          )}
          <AlertActions
            cancelLabel="Abort"
            confirmLabel={confirmLabel}
            disabled={!confirmationAllowed}
            onConfirm={onConfirm}
          />
        </AlertDialogPrimitive.Content>
      </AlertDialogPrimitive.Portal>
    </AlertDialogPrimitive.Root>
  );
}
