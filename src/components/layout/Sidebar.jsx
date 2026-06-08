import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarRail,
  SidebarSeparator,
} from '@/components/ui/sidebar';
import {
  LayoutDashboard,
  PenTool,
  Library,
  ClipboardList,
  FileText,
  Shield,
  Rows3,
  Search,
  Users,
  Settings,
  BookOpen,
  Brain,
  MessageSquare,
  GraduationCap,
  Sparkles,
  Trophy,
  MoonStar,
} from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";
import { cn } from "@/lib/utils";

const navSections = [
  {
    label: 'Overview',
    items: [
      { label: 'Dashboard', icon: LayoutDashboard, path: '/' },
      { label: 'Collaboration', icon: MessageSquare, path: '/collaboration' },
    ],
  },
  {
    label: 'Playbook',
    items: [
      { label: 'Play Designer', icon: PenTool, path: '/play-designer' },
      { label: 'Play Library', icon: Library, path: '/play-library' },
      { label: 'Terminology', icon: BookOpen, path: '/terminology' },
      { label: 'Wristband', icon: Rows3, path: '/wristband' },
    ],
  },
  {
    label: 'Game Week',
    items: [
      { label: 'Game Planning', icon: ClipboardList, path: '/game-planning' },
      { label: 'Weekly Install', icon: Brain, path: '/weekly-install' },
      { label: 'Practice Scripts', icon: FileText, path: '/practice-scripts' },
      { label: 'Scout Cards', icon: Shield, path: '/scout-cards' },
      { label: 'Scouting', icon: Search, path: '/scouting' },
    ],
  },
  {
    label: 'Personnel',
    items: [
      { label: 'Roster', icon: Users, path: '/roster' },
      { label: 'Player Portal', icon: GraduationCap, path: '/player-dashboard' },
      { label: 'Starter Library', icon: Trophy, path: '/install-sheets' },
    ],
  },
  {
    label: 'System',
    items: [
      { label: 'Settings', icon: Settings, path: '/settings' },
    ],
  },
];

function isItemActive(pathname, path) {
  return pathname === path || (path !== '/' && pathname.startsWith(path));
}

export default function AppSidebar() {
  const location = useLocation();

  return (
    <Sidebar collapsible="icon" className="border-r-0">
      <SidebarHeader className="h-16 px-4">
        <Link
          to="/"
          className="group flex items-center gap-3 overflow-hidden rounded-xl outline-none ring-sidebar-ring transition-colors hover:bg-sidebar-accent/50 focus-visible:ring-2"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sidebar-primary text-sidebar-primary-foreground shadow-sm">
            <Sparkles className="h-4 w-4" />
          </div>

          <div className="flex min-w-0 flex-col">
            <span className="truncate font-heading text-sm font-bold tracking-tight text-sidebar-foreground">
              CoachFlow
            </span>
            <span className="truncate text-[10px] font-semibold uppercase tracking-[0.22em] text-sidebar-foreground/55">
              Football Operations
            </span>
          </div>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        {navSections.map((section, index) => (
          <React.Fragment key={section.label}>
            <SidebarGroup>
              <SidebarGroupLabel>{section.label}</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {section.items.map((item) => {
                    const active = isItemActive(location.pathname, item.path);

                    return (
                      <SidebarMenuItem key={item.path}>
                        <SidebarMenuButton
                          asChild
                          isActive={active}
                          tooltip={item.label}
                        >
                          <Link to={item.path}>
                            <item.icon className="h-[18px] w-[18px] shrink-0" />
                            <span>{item.label}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            {index < navSections.length - 1 && <SidebarSeparator />}
          </React.Fragment>
        ))}
      </SidebarContent>

      <SidebarFooter className="gap-3">
        <div className="rounded-xl border border-sidebar-border/70 bg-sidebar-accent/35 p-3 group-data-[collapsible=icon]:hidden">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 rounded-lg bg-sidebar-primary/20 p-2 text-sidebar-primary">
              <MoonStar className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-sidebar-foreground">
                Film room mode
              </p>
              <p className="mt-1 text-[11px] leading-5 text-sidebar-foreground/65">
                Shift the interface for late-night install work and cleaner contrast on long sessions.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between gap-2 rounded-xl border border-sidebar-border/70 bg-sidebar-accent/25 p-2">
          <div className="flex items-center gap-2 group-data-[collapsible=icon]:hidden">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sidebar-accent text-sidebar-foreground">
              <Settings className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-semibold text-sidebar-foreground">Display</div>
              <div className="text-[10px] uppercase tracking-[0.18em] text-sidebar-foreground/50">
                Theme
              </div>
            </div>
          </div>

          <div className={cn("ml-auto", "group-data-[collapsible=icon]:mx-auto group-data-[collapsible=icon]:ml-0")}>
            <ThemeToggle />
          </div>
        </div>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}