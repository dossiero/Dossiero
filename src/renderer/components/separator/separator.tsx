import { cn } from "@/lib/class-names";
import "./separator.css";

export function Separator({ className }: { className?: string }) {
  return <div role="separator" className={cn("ui-separator", className)} />;
}
