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
      className="border-r border-gray-100/20 top-16"
    >
      <SidebarContent>
        <SidebarGroup>
          {/* <SidebarGroupLabel className="px-4 pt-4 pb-2 text-lg font-bold">
            Collections
          </SidebarGroupLabel> */}
          <SidebarGroupContent>
            <SidebarMenu>{children}</SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
