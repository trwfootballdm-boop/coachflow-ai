import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { useTeam } from '@/components/TeamContext';
import QuickStats from '@/components/dashboard/QuickStats';
import QuickActions from '@/components/dashboard/QuickActions';
import RecentPlays from '@/components/dashboard/RecentPlays';
import UpcomingGame from '@/components/dashboard/UpcomingGame';
import { Card, CardContent } from "@/components/ui/card";
import { Sparkles } from "lucide-react";

export default function Dashboard() {
  const { activeTeamId } = useTeam();

  const { data: teams = [] } = useQuery({
    queryKey: ['teams'],
    queryFn: () => base44.entities.Team.list(),
  });

  const activeTeam = teams.find(t => t.id === activeTeamId) || teams[0];

  const { data: plays = [] } = useQuery({
    queryKey: ['plays', activeTeam?.id],
    queryFn: () => base44.entities.Play.filter({ team_id: activeTeam.id }, '-updated_date', 20),
    enabled: !!activeTeam?.id,
  });

  const { data: gamePlans = [] } = useQuery({
    queryKey: ['gamePlans', activeTeam?.id],
    queryFn: () => base44.entities.GamePlan.filter({ team_id: activeTeam.id }),
    enabled: !!activeTeam?.id,
  });

  const { data: opponents = [] } = useQuery({
    queryKey: ['opponents', activeTeam?.id],
    queryFn: () => base44.entities.Opponent.filter({ team_id: activeTeam.id }),
    enabled: !!activeTeam?.id,
  });

  const stats = {
    totalPlays: plays.length,
    gamePlans: gamePlans.length,
    favorites: plays.filter(p => p.is_favorite).length,
    scoutReports: opponents.length,
  };

  if (!activeTeam) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <div className="p-4 rounded-2xl bg-primary/10 mb-6">
          <Sparkles className="h-10 w-10 text-primary" />
        </div>
        <h1 className="text-3xl font-display font-bold mb-2">Welcome to CoachFlow AI</h1>
        <p className="text-muted-foreground max-w-md mb-6">
          Get started by creating your first team. You'll be designing plays and building game plans in no time.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold">Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {activeTeam.name} {activeTeam.season ? `· ${activeTeam.season}` : ''}
          </p>
        </div>
        <QuickActions />
      </div>

      {/* Stats */}
      <QuickStats data={stats} />

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <RecentPlays plays={plays} />
        </div>
        <div className="space-y-6">
          <UpcomingGame team={activeTeam} />
          
          {/* AI Assistant teaser */}
          <Card className="border-0 shadow-sm bg-gradient-to-br from-accent/5 to-accent/10">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 rounded-lg bg-accent/10">
                  <Sparkles className="h-5 w-5 text-accent" />
                </div>
                <h3 className="font-display font-semibold">AI Assistant</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Your AI coaching assistant can generate practice scripts, call sheets, and scouting insights from your play library.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}