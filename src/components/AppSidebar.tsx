import { LayoutDashboard, Ticket, Users, Moon, Sun, Network, FileText, Settings, MapPin } from "lucide-react";
import iconnetLogo from "@/assets/iconnet-logo.png";
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
  { title: "Dashboard", icon: LayoutDashboard, path: "/", emoji: null },
  { title: "Ticket Management", icon: Ticket, path: "/tickets", emoji: null },
  { title: "List Team", icon: Users, path: "/teams", emoji: null },
  { title: "List FAT", icon: MapPin, path: "/fat", emoji: null },
  { title: "List OLT", icon: null, path: "/olt", emoji: "🖥️" },
  { title: "List UPE", icon: null, path: "/upe", emoji: "🔗" },
  { title: "List BNG", icon: Network, path: "/bng", emoji: null },
  { title: "Report", icon: FileText, path: "/report", emoji: null },
  { title: "Settings", icon: Settings, path: "/settings", emoji: null },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const { theme, setTheme } = useTheme();
  const collapsed = state === "collapsed";

  return (
    <Sidebar className={collapsed ? "w-14" : "w-64"} collapsible="icon">
      <SidebarContent>
        <div className="p-4 border-b border-sidebar-border">
        {!collapsed ? (
            <div className="flex items-center gap-3">
              <img src={iconnetLogo} alt="Iconnet" className="h-12 w-auto" />
              <div className="space-y-0.5">
                <p className="text-sm font-semibold text-sidebar-foreground">NOC RITEL</p>
                <p className="text-xs text-sidebar-foreground/70">Iconnet</p>
              </div>
            </div>
          ) : (
            <div className="flex justify-center">
              <img src={iconnetLogo} alt="Iconnet" className="h-8 w-auto" />
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
                      {item.emoji ? (
                        <span className="text-base">{item.emoji}</span>
                      ) : item.icon ? (
                        <item.icon className="h-4 w-4" />
                      ) : null}
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
