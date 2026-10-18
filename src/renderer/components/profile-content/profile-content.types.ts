import type { HTMLAttributes, ReactNode } from "react";

export interface ProfileContentProps extends HTMLAttributes<HTMLElement> {
  children: ReactNode;
  className?: string;
  fill?: boolean;
}
