import { useLocation, Link } from "react-router-dom";
import {
  LayoutDashboard,
  BookOpen,
  ArrowLeftRight,
  Users,
  Building2,
  Library,
  FileBarChart,
  Settings,
  BadgeDollarSign,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { useAuth } from "@/contexts/AuthContext";

interface NavItem {
  title: string;
  url: string;
  icon: React.ComponentType<{ className?: string }>;
}

function getNavItems(role: string): { main: NavItem[]; manage?: NavItem[] } {
  switch (role) {
    case "super_admin":
      return {
        main: [
          { title: "Dashboard", url: "/", icon: LayoutDashboard },
          { title: "Institutions", url: "/institutions", icon: Building2 },
          { title: "Libraries", url: "/libraries", icon: Library },
          { title: "Users", url: "/users", icon: Users },
        ],
      };
    case "admin":
      return {
        main: [
          { title: "Dashboard", url: "/", icon: LayoutDashboard },
          { title: "Books", url: "/books", icon: BookOpen },
          { title: "Circulation", url: "/circulation", icon: ArrowLeftRight },
          { title: "Users", url: "/users", icon: Users },
        ],
        manage: [
          { title: "Fines", url: "/fines", icon: BadgeDollarSign },
          { title: "Libraries", url: "/libraries", icon: Library },
          { title: "Reports", url: "/reports", icon: FileBarChart },
          { title: "Settings", url: "/settings", icon: Settings },
        ],
      };
    case "librarian":
      return {
        main: [
          { title: "Dashboard", url: "/", icon: LayoutDashboard },
          { title: "Books", url: "/books", icon: BookOpen },
          { title: "Circulation", url: "/circulation", icon: ArrowLeftRight },
        ],
        manage: [
          { title: "Fines", url: "/fines", icon: BadgeDollarSign },
          { title: "Reports", url: "/reports", icon: FileBarChart },
        ],
      };
    case "student":
    default:
      return {
        main: [
          { title: "Dashboard", url: "/", icon: LayoutDashboard },
          { title: "Browse Books", url: "/books", icon: BookOpen },
          { title: "My Borrowings", url: "/circulation", icon: ArrowLeftRight },
          { title: "My Fines", url: "/fines", icon: BadgeDollarSign },
        ],
      };
  }
}

export function AppSidebar() {
  const location = useLocation();
  const { profile } = useAuth();
  const role = profile?.role ?? "student";
  const { main, manage } = getNavItems(role);

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b px-4 py-3">
        <Link to="/" className="flex items-center gap-2 group-data-[collapsible=icon]:justify-center">
          <BookOpen className="h-5 w-5 text-primary shrink-0" />
          <span className="font-semibold text-sm group-data-[collapsible=icon]:hidden">
            LibraryOS
          </span>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {main.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton
                    asChild
                    isActive={location.pathname === item.url}
                    tooltip={item.title}
                  >
                    <Link to={item.url}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {manage && manage.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>Manage</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {manage.map((item) => (
                  <SidebarMenuItem key={item.url}>
                    <SidebarMenuButton
                      asChild
                      isActive={location.pathname === item.url}
                      tooltip={item.title}
                    >
                      <Link to={item.url}>
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter className="border-t p-3">
        <div className="text-xs text-muted-foreground group-data-[collapsible=icon]:hidden">
          {profile?.name ?? profile?.email ?? ""}
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
