import type { ReactNode } from "react";

export interface DeleteAlertProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subject: string;
  confirmText?: string;
  description?: ReactNode;
  confirmLabel?: string;
  onConfirm: () => void;
}
