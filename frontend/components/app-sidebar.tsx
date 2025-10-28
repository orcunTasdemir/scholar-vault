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

// Menu items.
// const items = [
//   {
//     title: "Home",
//     url: "#",
//     icon: Home,
//   },
//   {
//     title: "Inbox",
//     url: "#",
//     icon: Inbox,
//   },
//   {
//     title: "Calendar",
//     url: "#",
//     icon: Calendar,
//   },
//   {
//     title: "Search",
//     url: "#",
//     icon: Search,
//   },
//   {
//     title: "Settings",
//     url: "#",
//     icon: Settings,
//   },
// ];

export function AppSidebar({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <Sidebar className="[--sidebar:0_0%_0%_/_0] shadow-sm backdrop-blur-md font-almendra font-bold text-3xl">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="pl-4 pt-5 text-xl font-bold">
            Collections
          </SidebarGroupLabel>
          <SidebarGroupContent className="text-3xl">
            <SidebarMenu>{children}</SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
