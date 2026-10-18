import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { Button } from "@/components/button/button";
import { cn } from "@/lib/class-names";
import "./dialog.css";
import type { DialogProps } from "./dialog.types";

export function Dialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  wide = false,
  className,
}: DialogProps) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="ui-overlay" />
        <DialogPrimitive.Content
          className={cn("ui-dialog panel-brackets", wide && "ui-dialog--wide", className)}
        >
          <header className="ui-dialog-head">
            <div>
              <span className="eyebrow">// COMMAND INTERFACE</span>
              <DialogPrimitive.Title>{title}</DialogPrimitive.Title>
              {description && (
                <DialogPrimitive.Description>{description}</DialogPrimitive.Description>
              )}
            </div>
            <DialogPrimitive.Close asChild>
              <Button variant="ghost" size="icon" aria-label="Close dialog">
                <X size={17} />
              </Button>
            </DialogPrimitive.Close>
          </header>
          {children}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
