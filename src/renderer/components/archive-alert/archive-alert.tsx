import * as AlertDialogPrimitive from "@radix-ui/react-alert-dialog";
import { AlertActions } from "@/components/alert-actions/alert-actions";
import "./archive-alert.css";

interface ArchiveAlertProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subject: string;
  onConfirm: () => void;
}

export function ArchiveAlert({
  open,
  onOpenChange,
  subject,
  onConfirm,
}: ArchiveAlertProps) {
  return (
    <AlertDialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <AlertDialogPrimitive.Portal>
        <AlertDialogPrimitive.Overlay className="ui-overlay" />
        <AlertDialogPrimitive.Content className="ui-alert panel-brackets">
          <span className="danger-code">!! ARCHIVE SUBJECT</span>
          <AlertDialogPrimitive.Title>MOVE TO TRASH?</AlertDialogPrimitive.Title>
          <AlertDialogPrimitive.Description>
            <strong>{subject}</strong> will be removed from active people and search results. You
            can restore this person later from Trash.
          </AlertDialogPrimitive.Description>
          <AlertActions
            cancelLabel="Cancel"
            confirmLabel="Move to trash"
            onConfirm={onConfirm}
          />
        </AlertDialogPrimitive.Content>
      </AlertDialogPrimitive.Portal>
    </AlertDialogPrimitive.Root>
  );
}
