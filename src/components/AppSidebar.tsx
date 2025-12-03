import { LayoutDashboard, Ticket, Users, Moon, Sun, Radio, Server, Network, FileText, Settings, Download } from "lucide-react";
import { NavLink } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { useTheme } from "next-themes";

const menuItems = [
  { title: "Dashboard", icon: LayoutDashboard, path: "/" },
  { title: "Ticket Management", icon: Ticket, path: "/tickets" },
  { title: "List Team", icon: Users, path: "/teams" },
  { title: "List OLT", icon: Radio, path: "/olt" },
  { title: "List UPE", icon: Server, path: "/upe" },
  { title: "List BNG", icon: Network, path: "/bng" },
  { title: "Report", icon: FileText, path: "/report" },
  { title: "Settings", icon: Settings, path: "/settings" },
  { title: "Install App", icon: Download, path: "/install" },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const { theme, setTheme } = useTheme();
  const collapsed = state === "collapsed";

  return (
    <Sidebar className={collapsed ? "w-14" : "w-64"} collapsible="icon">
      <SidebarContent>
        <div className="p-4 border-b border-sidebar-border">
          {!collapsed && (
            <div className="space-y-1">
              <h2 className="text-lg font-bold text-sidebar-foreground">NOC RITEL</h2>
              <p className="text-xs text-sidebar-foreground/70">PLN Icon Plus</p>
            </div>
          )}
        </div>

        <SidebarGroup>
          <SidebarGroupLabel>Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.path}
                      className={({ isActive }) =>
                        isActive
                          ? "bg-sidebar-accent text-sidebar-accent-foreground"
                          : "hover:bg-sidebar-accent/50"
                      }
                    >
                      <item.icon className="h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <div className="mt-auto border-t border-sidebar-border">
          <div className="p-4">
            <Button
              variant="ghost"
              size={collapsed ? "icon" : "default"}
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent"
            >
              {theme === "dark" ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
              {!collapsed && <span className="ml-2">Dark Mode</span>}
            </Button>
          </div>
          {!collapsed && (
            <div className="px-4 pb-4 text-center">
              <p className="text-xs text-sidebar-foreground/50">
                © RZ Corp. All Rights Reserved
              </p>
            </div>
          )}
        </div>
      </SidebarContent>
    </Sidebar>
  );
}
