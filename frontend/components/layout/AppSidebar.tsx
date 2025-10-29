"use client";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
} from "@/components/ui/sidebar";

interface AppSidebarProps {
  children: React.ReactNode;
}

export function AppSidebar({ children }: AppSidebarProps) {
  return (
    <Sidebar
      collapsible="offcanvas"
      className="border-r border-border bg-background top-16"
      style={{ pointerEvents: "auto" }}
    >
      <SidebarContent className="pt-0" style={{ pointerEvents: "auto" }}>
        <SidebarGroup>
          <SidebarGroupLabel className="px-4 pt-4 pb-2 text-lg font-almendra font-bold text-foreground">
            Collections
          </SidebarGroupLabel>
          <SidebarGroupContent style={{ pointerEvents: "auto" }}>
            <SidebarMenu style={{ pointerEvents: "auto" }}>
              {children}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
