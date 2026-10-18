import * as ScrollAreaPrimitive from "@radix-ui/react-scroll-area";
import type { ReactNode } from "react";
import { cn } from "@/lib/class-names";
import "./scroll-area.css";

export function ScrollArea({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <ScrollAreaPrimitive.Root className={cn("ui-scroll", className)}>
      <ScrollAreaPrimitive.Viewport className="ui-scroll-view">
        {children}
      </ScrollAreaPrimitive.Viewport>
      <ScrollAreaPrimitive.Scrollbar orientation="vertical" className="ui-scrollbar">
        <ScrollAreaPrimitive.Thumb className="ui-scrollthumb" />
      </ScrollAreaPrimitive.Scrollbar>
    </ScrollAreaPrimitive.Root>
  );
}
