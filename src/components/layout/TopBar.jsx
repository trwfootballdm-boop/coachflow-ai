import React from 'react';
import { useTeam } from '@/components/TeamContext';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Bell, Plus, LogOut, User, ChevronDown, Search, Command } from "lucide-react";
import { useNavigate } from 'react-router-dom';
import { SidebarTrigger } from '@/components/ui/sidebar';

export default function TopBar() {
  const { activeTeamId, setActiveTeamId } = useTeam();
  const navigate = useNavigate();

  const { data: teams = [] } = useQuery({
    queryKey: ['teams'],
    queryFn: () => base44.entities.Team.list(),
  });

  const { data: user } = useQuery({
    queryKey: ['me'],
    queryFn: () => base44.auth.me(),
  });

  const activeTeam = teams.find(team => team.id === activeTeamId);

  const initials = user?.full_name
    ? user.full_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : 'CF';

  return (
    <header className="topbar-glass sticky top-0 z-40">
      <div className="flex h-16 items-center justify-between gap-3 px-4 md:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <SidebarTrigger className="h-9 w-9 rounded-xl border border-border/70 bg-card hover:bg-muted/70" />

          <div className="hidden md:block">
            <div className="section-label">Operations</div>
            <div className="text-sm font-semibold text-foreground">
              {activeTeam?.name || 'CoachFlow'}
            </div>
          </div>

          {teams.length > 0 ? (
            <Select value={activeTeamId || ''} onValueChange={setActiveTeamId}>
              <SelectTrigger className="h-10 w-[220px] rounded-xl border-border/70 bg-card/80 font-medium shadow-sm">
                <SelectValue placeholder="Select team" />
              </SelectTrigger>
              <SelectContent>
                {teams.map(team => (
                  <SelectItem key={team.id} value={team.id}>
                    <div className="flex items-center gap-2">
                      <div
                        className="h-2.5 w-2.5 rounded-full border border-black/10"
                        style={{ backgroundColor: team.primary_color || 'hsl(var(--primary))' }}
                      />
                      <span>{team.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <Button
              variant="outline"
              onClick={() => navigate('/settings')}
              className="h-10 rounded-xl border-border/70 bg-card px-4 font-medium shadow-sm"
            >
              <Plus className="mr-2 h-4 w-4" />
              Create Team
            </Button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            className="hidden h-10 rounded-xl border-border/70 bg-card px-3 text-muted-foreground shadow-sm md:flex"
          >
            <Search className="mr-2 h-4 w-4" />
            Search plays, scripts, installs
            <span className="ml-3 inline-flex items-center gap-1 rounded-md border border-border/70 bg-muted/60 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide">
              <Command className="h-3 w-3" />
              K
            </span>
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="relative h-10 w-10 rounded-xl border border-transparent hover:border-border/60 hover:bg-card"
          >
            <Bell className="h-4 w-4" />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="h-10 rounded-xl border border-border/70 bg-card pl-2 pr-3 hover:bg-muted/60"
              >
                <Avatar className="mr-2 h-7 w-7">
                  <AvatarFallback className="bg-primary/15 text-primary text-xs font-bold">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden text-left md:block">
                  <div className="text-sm font-semibold leading-none text-foreground">
                    {user?.full_name || 'Coach'}
                  </div>
                  <div className="mt-0.5 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                    Staff
                  </div>
                </div>
                <ChevronDown className="ml-2 h-3.5 w-3.5 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-56 rounded-xl">
              <DropdownMenuItem onClick={() => navigate('/settings')}>
                <User className="mr-2 h-4 w-4" />
                Profile & Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => base44.auth.logout()}>
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}