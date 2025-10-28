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
    <Sidebar className="border-r border-border backdrop-blur-sm bg-background/95">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="px-4 pt-4 pb-2 text-lg font-almendra font-bold text-foreground">
            Collections
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>{children}</SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
