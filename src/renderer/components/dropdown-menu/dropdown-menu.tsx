import * as DropdownPrimitive from "@radix-ui/react-dropdown-menu";
import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { cn } from "@/lib/class-names";
import "./dropdown-menu.css";

export const Dropdown = DropdownPrimitive.Root;
export const DropdownTrigger = DropdownPrimitive.Trigger;

export function DropdownSeparator() {
  return <DropdownPrimitive.Separator className="ui-menu-separator" />;
}

export function DropdownContent({
  children,
  className,
  align = "end",
  sideOffset = 6,
  ...props
}: ComponentPropsWithoutRef<typeof DropdownPrimitive.Content>) {
  return (
    <DropdownPrimitive.Portal>
      <DropdownPrimitive.Content
        {...props}
        align={align}
        sideOffset={sideOffset}
        className={cn("ui-menu", className)}
      >
        {children}
      </DropdownPrimitive.Content>
    </DropdownPrimitive.Portal>
  );
}

export function DropdownItem({
  children,
  onSelect,
  danger,
}: {
  children: ReactNode;
  onSelect?: () => void;
  danger?: boolean;
}) {
  return (
    <DropdownPrimitive.Item
      onSelect={onSelect}
      className={cn("ui-menu-item", danger && "is-danger")}
    >
      {children}
    </DropdownPrimitive.Item>
  );
}
