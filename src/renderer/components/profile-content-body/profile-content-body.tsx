import type { ReactNode } from "react";
import { cn } from "@/lib/class-names";
import "./profile-content-body.css";

interface ProfileContentBodyProps {
  children: ReactNode;
  className?: string;
  padding?: "padded" | "flush";
}

export function ProfileContentBody({
  children,
  className,
  padding = "padded",
}: ProfileContentBodyProps) {
  return (
    <div
      className={cn(
        "profile-content-body",
        `profile-content-body--${padding}`,
        className,
      )}
    >
      {children}
    </div>
  );
}
