import { cn } from "@/lib/class-names";
import "./profile-content.css";
import type { ProfileContentProps } from "./profile-content.types";

export function ProfileContent({
  children,
  className,
  fill = false,
  ...props
}: ProfileContentProps) {
  return (
    <section
      {...props}
      className={cn("profile-content", fill && "profile-content--fill", className)}
    >
      {children}
    </section>
  );
}
