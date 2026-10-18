import type { ReactNode } from "react";
import "./right-sidebar.css";

interface RightSidebarProps {
  children: ReactNode;
}

export function RightSidebar({ children }: RightSidebarProps) {
  return <aside className="right-sidebar">{children}</aside>;
}
