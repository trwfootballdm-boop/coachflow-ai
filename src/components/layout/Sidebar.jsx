import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from "@/lib/utils";
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
  ChevronLeft,
  ChevronRight,
  MessageSquare,
  GraduationCap
} from "lucide-react";
import { Button } from "@/components/ui/button";
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

export default function Sidebar({ collapsed, onToggle }) {
  const location = useLocation();

  return (
    <aside className={cn(
      "fixed left-0 top-0 h-screen bg-card border-r border-border z-40 flex flex-col transition-all duration-300",
      collapsed ? "w-[68px]" : "w-[240px]"
    )}>
      {/* Logo */}
      <div className="h-16 flex items-center px-4 border-b border-border shrink-0">
        <div className="flex items-center gap-2.5 overflow-hidden">
          <div className="h-9 w-9 rounded-lg bg-primary flex items-center justify-center shrink-0">
            <span className="text-primary-foreground font-display font-bold text-sm">CF</span>
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="font-display font-bold text-sm leading-tight">CoachFlow</span>
              <span className="text-[10px] text-primary font-semibold tracking-wider uppercase">AI</span>
            </div>
          )}
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path || 
            (item.path !== '/' && location.pathname.startsWith(item.path));
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary"
              )}
            >
              <item.icon className={cn(
                "h-[18px] w-[18px] shrink-0 transition-colors",
                isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
              )} />
              {!collapsed && <span className="truncate">{item.label}</span>}
              {isActive && !collapsed && (
                <div className="ml-auto h-1.5 w-1.5 rounded-full bg-primary" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="border-t border-border p-2 flex items-center justify-between shrink-0">
        <ThemeToggle />
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggle}
          className="h-9 w-9 rounded-lg"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>
    </aside>
  );
}