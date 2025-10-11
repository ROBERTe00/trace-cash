import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  TrendingUp,
  Wallet,
  Lightbulb,
  Settings,
  Upload,
  Trophy,
  Users,
} from "lucide-react";
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
import { useApp } from "@/contexts/AppContext";

export function AppSidebar() {
  const { open, setOpenMobile } = useSidebar();
  const { t } = useApp();
  const location = useLocation();
  const currentPath = location.pathname;

  const navigationItems = [
    { 
      title: t("dashboard"), 
      url: "/", 
      icon: LayoutDashboard,
      tooltip: t("dashboard")
    },
    { 
      title: t("expenses"), 
      url: "/expenses", 
      icon: Wallet,
      tooltip: t("expenses")
    },
    { 
      title: t("investments"), 
      url: "/investments", 
      icon: TrendingUp,
      tooltip: t("investments")
    },
    { 
      title: t("future"), 
      url: "/future-planner", 
      icon: Lightbulb,
      tooltip: t("future")
    },
    { 
      title: t("progress"), 
      url: "/progress", 
      icon: Trophy,
      tooltip: t("progress")
    },
    { 
      title: t("community"), 
      url: "/community", 
      icon: Users,
      tooltip: t("community")
    },
    { 
      title: t("upload"), 
      url: "/upload", 
      icon: Upload,
      tooltip: t("upload")
    },
    { 
      title: t("settings"), 
      url: "/settings", 
      icon: Settings,
      tooltip: t("settings")
    },
  ];

  const isActive = (path: string) => currentPath === path;

  const handleLinkClick = () => {
    setOpenMobile(false);
  };

  return (
    <Sidebar collapsible="icon" className={open ? "w-60" : "w-14"}>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className={open ? "" : "sr-only"}>
            MyFinance Pro
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(item.url)}
                    tooltip={item.title}
                  >
                    <NavLink to={item.url} end onClick={handleLinkClick}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
