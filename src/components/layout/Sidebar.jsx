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
  LayoutGrid,
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
      { label: 'Dashboard',     icon: LayoutDashboard, path: '/' },
      { label: 'Collaboration', icon: MessageSquare,   path: '/collaboration' },
    ],
  },
  {
    label: 'Playbook',
    items: [
      { label: 'Play Designer', icon: PenTool,     path: '/play-designer' },
      { label: 'Play Library',  icon: Library,     path: '/play-library' },
      { label: 'Formations',    icon: LayoutGrid,  path: '/formations' },
      { label: 'Terminology',   icon: BookOpen,    path: '/terminology' },
      { label: 'Wristband',     icon: Rows3,       path: '/wristband' },
    ],
  },
  {
    label: 'Game Week',
    items: [
      { label: 'Game Planning',    icon: ClipboardList, path: '/game-planning' },
      { label: 'Weekly Install',   icon: Brain,         path: '/weekly-install' },
      { label: 'Practice Scripts', icon: FileText,      path: '/practice-scripts' },
      { label: 'Scout Cards',      icon: Shield,        path: '/scout-cards' },
      { label: 'Scouting',         icon: Search,        path: '/scouting' },
    ],
  },
  {
    label: 'Personnel',
    items: [
      { label: 'Roster',          icon: Users,        path: '/roster' },
      { label: 'Player Portal',   icon: GraduationCap, path: '/player-dashboard' },
      { label: 'Starter Library', icon: Trophy,       path: '/install-sheets' },
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
    <Sidebar>
      <SidebarHeader className="px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-lg bg-primary flex items-center justify-center shrink-0">
            <span className="text-primary-foreground font-display font-bold text-xs">CF</span>
          </div>
          <div>
            <p className="text-sm font-display font-bold leading-none">CoachFlow</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">Football Operations</p>
          </div>
        </div>
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
                    const Icon = item.icon;
                    return (
                      <SidebarMenuItem key={item.path}>
                        <SidebarMenuButton asChild isActive={active}>
                          <Link to={item.path}>
                            <Icon className="h-4 w-4" />
                            {item.label}
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

      <SidebarFooter className="p-3 space-y-2">
        <div className="rounded-xl border border-border/60 bg-muted/40 p-3 space-y-1">
          <p className="text-xs font-semibold flex items-center gap-1.5">
            <MoonStar className="h-3.5 w-3.5 text-accent" /> Film room mode
          </p>
          <p className="text-[10px] text-muted-foreground leading-relaxed">
            Shift the interface for late-night install work and cleaner contrast on long sessions.
          </p>
        </div>
        <div className="flex items-center justify-between px-1">
          <span className="text-xs text-muted-foreground">Display</span>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Theme</span>
            <ThemeToggle />
          </div>
        </div>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}