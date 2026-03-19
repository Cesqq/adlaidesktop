import { FolderPlus, FolderOpen, User, Sparkles, LogOut, ShieldCheck, Crown, Monitor, LayoutDashboard, BookOpen, Key } from "lucide-react";
import mascotHero from "@/assets/mascot-hero.png";
import { NavLink } from "@/components/NavLink";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscription } from "@/hooks/useSubscription";
import { Badge } from "@/components/ui/badge";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";

const navItems = [
  { title: "Dashboard", url: "/projects", icon: LayoutDashboard },
  { title: "Setup Wizard", url: "/projects/new", icon: FolderPlus },
  { title: "Projects", url: "/projects", icon: FolderOpen, end: true },
  { title: "Machines", url: "/machines", icon: Monitor },
  { title: "Credentials", url: "/credentials", icon: Key },
  { title: "AI Architect", url: "/architect", icon: Sparkles },
  { title: "Verify", url: "/verify", icon: ShieldCheck },
  { title: "Docs", url: "/docs", icon: BookOpen },
  { title: "Subscription", url: "/account/subscription", icon: Crown },
  { title: "Account", url: "/account", icon: User },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const { signOut } = useAuth();
  const { isPro } = useSubscription();

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        <div className="flex items-center gap-2 px-4 py-5">
          <img src={mascotHero} alt="Adl._.Ai Studio" className="h-7 w-7 shrink-0 object-contain" />
          {!collapsed && (
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="font-mono text-base font-semibold text-foreground">Adl._.Ai</span>
                <span className="text-base font-normal text-foreground">Studio</span>
                {isPro && (
                  <Badge className="text-[10px] gap-0.5 bg-primary/20 text-primary border-primary/30 ml-1">
                    <Crown className="h-2.5 w-2.5" />Pro
                  </Badge>
                )}
              </div>
              <span className="text-[10px] text-muted-foreground leading-none">by Lumina</span>
            </div>
          )}
        </div>

        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end={item.end ?? item.url === "/projects"}
                      className="hover:bg-sidebar-accent/50"
                      activeClassName="bg-sidebar-accent text-primary font-medium"
                    >
                      <item.icon className="mr-2 h-4 w-4" />
                      {!collapsed && (
                        <span className="flex items-center gap-2">
                          {item.title}
                          {item.url === "/architect" && isPro && (
                            <Badge variant="outline" className="text-[10px] text-primary border-primary/40 py-0">Pro</Badge>
                          )}
                        </span>
                      )}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <Button variant="ghost" size="sm" className="w-full justify-start text-muted-foreground" onClick={signOut}>
          <LogOut className="mr-2 h-4 w-4" />
          {!collapsed && "Sign Out"}
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
