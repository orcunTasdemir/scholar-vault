import { Calendar, Home, Inbox, Search, Settings } from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

interface AppSidebarProps {
  children: React.ReactNode;
  isCollapsed: boolean;
}

export function AppSidebar({ children, isCollapsed }: AppSidebarProps) {
  return (
    <Sidebar
      className="[--sidebar:0_0%_0%/0] **:font-almendra **:font-bold h-full shadow-sm backdrop-blur-md flex flex-col transition-all duration-200"
      style={{
        width: isCollapsed ? "0rem" : "max-content",
        minWidth: isCollapsed ? "0rem" : "16rem",
      }}
    >
      <SidebarContent className="w-full">
        <SidebarGroup>
          <SidebarGroupLabel className="pl-4 pt-5 text-2xl text-black">
            Collections
          </SidebarGroupLabel>
          <SidebarGroupContent className="h-full w-max">
            <SidebarMenu>{children}</SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
