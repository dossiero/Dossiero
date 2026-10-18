import * as AlertDialogPrimitive from "@radix-ui/react-alert-dialog";
import { AlertActions } from "@/components/alert-actions/alert-actions";
import "./remove-tab-alert.css";

interface RemoveTabAlertProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tabName: string;
  nextTabName?: string;
  onConfirm: () => void;
}

export function RemoveTabAlert({
  open,
  onOpenChange,
  tabName,
  nextTabName,
  onConfirm,
}: RemoveTabAlertProps) {
  return (
    <AlertDialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <AlertDialogPrimitive.Portal>
        <AlertDialogPrimitive.Overlay className="ui-overlay" />
        <AlertDialogPrimitive.Content className="ui-alert panel-brackets">
          <span className="danger-code">!! REMOVE TAB</span>
          <AlertDialogPrimitive.Title>REMOVE TAB?</AlertDialogPrimitive.Title>
          <AlertDialogPrimitive.Description>
            <strong>{tabName}</strong> and everything inside it, including locally stored files,
            will be permanently deleted. This action cannot be undone.{" "}
            {nextTabName ? (
              <>
                After removal, <strong>{nextTabName}</strong> will open.
              </>
            ) : (
              <>After removal, this dossier will have no tabs.</>
            )}
          </AlertDialogPrimitive.Description>
          <AlertActions
            cancelLabel="Cancel"
            confirmLabel="Remove tab"
            onConfirm={onConfirm}
          />
        </AlertDialogPrimitive.Content>
      </AlertDialogPrimitive.Portal>
    </AlertDialogPrimitive.Root>
  );
}
