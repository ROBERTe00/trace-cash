import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  TrendingUp,
  Wallet,
  Lightbulb,
  Settings,
  Target,
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
      title: "Dashboard", 
      url: "/", 
      icon: LayoutDashboard,
      tooltip: "Dashboard"
    },
    { 
      title: "Transactions", 
      url: "/transactions", 
      icon: Wallet,
      tooltip: "Transactions"
    },
    { 
      title: "Investments", 
      url: "/investments", 
      icon: TrendingUp,
      tooltip: "Investments"
    },
    { 
      title: "Insights", 
      url: "/insights", 
      icon: Lightbulb,
      tooltip: "Insights"
    },
    { 
      title: "Goals", 
      url: "/goals", 
      icon: Target,
      tooltip: "Goals"
    },
    { 
      title: "News", 
      url: "/news", 
      icon: LayoutDashboard,
      tooltip: "News"
    },
    { 
      title: "Settings", 
      url: "/settings", 
      icon: Settings,
      tooltip: "Settings"
    },
  ];

  const isActive = (path: string) => currentPath === path;

  const handleLinkClick = () => {
    setOpenMobile(false);
  };

  return (
    <Sidebar collapsible="icon" className={`${open ? "w-60" : "w-14"} z-50`}>
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
                      <item.icon className="icon-nav" />
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
