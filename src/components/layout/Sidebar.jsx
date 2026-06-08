import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from "@/lib/utils";
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
} from '@/components/ui/sidebar';
import {
  LayoutDashboard,
  PenTool,
  Library,
  ClipboardList,
  FileText,
  Shield,
  Rows3,
  Calendar,
  Search,
  Users,
  Settings,
  BookOpen,
  Brain,
  MessageSquare,
  GraduationCap
} from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";

const navItems = [
  { label: 'Dashboard', icon: LayoutDashboard, path: '/' },
  { label: 'Play Designer', icon: PenTool, path: '/play-designer' },
  { label: 'Play Library', icon: Library, path: '/play-library' },
  { label: 'Game Planning', icon: ClipboardList, path: '/game-planning' },
  { label: 'Weekly Install', icon: Brain, path: '/weekly-install' },
  { label: 'Practice Scripts', icon: FileText, path: '/practice-scripts' },
  { label: 'Scout Cards', icon: Shield, path: '/scout-cards' },
  { label: 'Wristband', icon: Rows3, path: '/wristband' },
  { label: 'Starter Library', icon: BookOpen, path: '/install-sheets' },
  { label: 'Scouting', icon: Search, path: '/scouting' },
  { label: 'Roster', icon: Users, path: '/roster' },
  { label: 'Terminology', icon: Calendar, path: '/terminology' },
  { label: 'Player Portal', icon: GraduationCap, path: '/player-dashboard' },
  { label: 'Collaboration', icon: MessageSquare, path: '/collaboration' },
  { label: 'Settings', icon: Settings, path: '/settings' },
];

export default function AppSidebar() {
  const location = useLocation();

  return (
    <Sidebar collapsible="icon" className="border-r border-border/70">
      <SidebarHeader className="h-16 border-b border-border/70 px-4">
        <div className="flex items-center gap-2.5 overflow-hidden">
          <div className="h-9 w-9 rounded-lg bg-primary flex items-center justify-center shrink-0">
            <span className="text-primary-foreground font-display font-bold text-sm">CF</span>
          </div>
          <div className="flex flex-col">
            <span className="font-display font-bold text-sm leading-tight">CoachFlow</span>
            <span className="text-[10px] text-primary font-semibold tracking-wider uppercase">AI</span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-[11px] font-semibold uppercase tracking-[0.22em] text-accent px-3">
            Operations
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => {
                const isActive = location.pathname === item.path || 
                  (item.path !== '/' && location.pathname.startsWith(item.path));
                return (
                  <SidebarMenuItem key={item.path}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      className="data-[active=true]:bg-primary/10 data-[active=true]:text-primary"
                    >
                      <Link to={item.path} className="flex items-center gap-3">
                        <item.icon className="h-[18px] w-[18px] shrink-0" />
                        <span className="text-sm font-medium">{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-border/70 p-2">
        <ThemeToggle />
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}