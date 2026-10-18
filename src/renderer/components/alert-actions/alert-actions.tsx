import * as AlertDialogPrimitive from "@radix-ui/react-alert-dialog";
import { Button } from "@/components/button/button";
import "./alert-actions.css";

interface AlertActionsProps {
  cancelLabel: string;
  confirmLabel: string;
  disabled?: boolean;
  onConfirm: () => void;
}

export function AlertActions({
  cancelLabel,
  confirmLabel,
  disabled,
  onConfirm,
}: AlertActionsProps) {
  return (
    <div className="dialog-actions">
      <AlertDialogPrimitive.Cancel asChild>
        <Button variant="ghost">{cancelLabel}</Button>
      </AlertDialogPrimitive.Cancel>
      <AlertDialogPrimitive.Action asChild>
        <Button variant="danger" disabled={disabled} onClick={onConfirm}>
          {confirmLabel}
        </Button>
      </AlertDialogPrimitive.Action>
    </div>
  );
}
