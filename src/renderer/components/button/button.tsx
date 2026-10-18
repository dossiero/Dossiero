import { forwardRef } from "react";
import { cn } from "@/lib/class-names";
import "./button.css";
import type { ButtonProps } from "./button.types";

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "quiet", size = "md", ...props }, ref) => (
    <button
      ref={ref}
      className={cn("ui-button", `ui-button--${variant}`, `ui-button--${size}`, className)}
      {...props}
    />
  ),
);

Button.displayName = "Button";
