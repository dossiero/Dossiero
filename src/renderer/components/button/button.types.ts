import type { ButtonHTMLAttributes } from "react";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "signal" | "ghost" | "danger" | "quiet";
  size?: "sm" | "md" | "icon";
}
