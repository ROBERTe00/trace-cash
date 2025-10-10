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
import { TooltipWrapper } from "@/components/TooltipWrapper";

const navigationItems = [
  { 
    title: "Dashboard", 
    url: "/", 
    icon: LayoutDashboard,
    tooltip: "View your financial overview with interactive charts"
  },
  { 
    title: "Expenses", 
    url: "/expenses", 
    icon: Wallet,
    tooltip: "Track and categorize your spending"
  },
  { 
    title: "Investments", 
    url: "/investments", 
    icon: TrendingUp,
    tooltip: "Monitor your investment portfolio and performance"
  },
  { 
    title: "Future Planner", 
    url: "/future-planner", 
    icon: Lightbulb,
    tooltip: "Get AI-powered financial projections and planning"
  },
  { 
    title: "Progress Hub", 
    url: "/progress", 
    icon: Trophy,
    tooltip: "Earn badges and track your financial milestones"
  },
  { 
    title: "Community", 
    url: "/community", 
    icon: Users,
    tooltip: "Share insights and connect with others"
  },
  { 
    title: "Upload", 
    url: "/upload", 
    icon: Upload,
    tooltip: "Import transactions from CSV, Excel, or PDF"
  },
  { 
    title: "Settings", 
    url: "/settings", 
    icon: Settings,
    tooltip: "Manage your account, security, and preferences"
  },
];

export function AppSidebar() {
  const { open, setOpenMobile } = useSidebar();
  const location = useLocation();
  const currentPath = location.pathname;

  const isActive = (path: string) => currentPath === path;

  const handleLinkClick = () => {
    // Close sidebar on mobile when clicking a link
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
