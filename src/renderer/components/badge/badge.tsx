import type { ReactNode } from "react";
import { cn } from "@/lib/class-names";
import "./badge.css";

export function Badge({ children, className }: { children: ReactNode; className?: string }) {
  return <span className={cn("ui-badge", className)}>{children}</span>;
}
