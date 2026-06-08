import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { useTeam } from '@/components/TeamContext';
import { useNavigate } from 'react-router-dom';
import QuickStats from '@/components/dashboard/QuickStats';
import QuickActions from '@/components/dashboard/QuickActions';
import RecentPlays from '@/components/dashboard/RecentPlays';
import UpcomingGame from '@/components/dashboard/UpcomingGame';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, ClipboardList, ArrowRight, Shield, BookOpen } from "lucide-react";

export default function Dashboard() {
  const { activeTeamId } = useTeam();
  const navigate = useNavigate();

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
      <div className="flex min-h-[62vh] items-center justify-center">
        <Card variant="film" className="w-full max-w-2xl">
          <CardContent className="flex flex-col items-center px-6 py-12 text-center">
            <div className="mb-5 rounded-2xl border border-primary/15 bg-primary/10 p-4">
              <Sparkles className="h-10 w-10 text-primary" />
            </div>

            <div className="page-eyebrow">Get Started</div>
            <h2 className="mt-2 text-balance font-heading text-3xl font-bold tracking-tight text-foreground">
              Build your first team workspace
            </h2>
            <p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground">
              Create a team to unlock your dashboard, organize plays, build weekly installs,
              and prepare game plans in one coordinated system.
            </p>

            <div className="mt-6">
              <Button size="lg" onClick={() => navigate('/settings')}>
                Create Team
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="min-w-0">
          <div className="team-chip">
            <span className="h-2 w-2 rounded-full bg-primary" />
            {activeTeam.name}
            {activeTeam.season ? <span className="text-muted-foreground">· {activeTeam.season}</span> : null}
          </div>
          <p className="mt-3 max-w-3xl text-sm text-muted-foreground">
            Monitor play inventory, game-plan readiness, and scouting prep from one football operations workspace.
          </p>
        </div>

        <QuickActions />
      </section>

      <QuickStats data={stats} />

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        <div className="space-y-6 xl:col-span-8">
          <RecentPlays plays={plays} />

          <Card variant="field">
            <CardHeader>
              <div className="section-label">Install focus</div>
              <CardTitle>This week's workflow</CardTitle>
              <CardDescription>
                Keep the staff aligned by moving directly into planning, scripting, and install packaging.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-3">
              <Button variant="field" className="justify-between" onClick={() => navigate('/game-planning')}>
                Game plan
                <ClipboardList className="h-4 w-4" />
              </Button>
              <Button variant="field" className="justify-between" onClick={() => navigate('/practice-scripts')}>
                Practice script
                <BookOpen className="h-4 w-4" />
              </Button>
              <Button variant="field" className="justify-between" onClick={() => navigate('/scout-cards')}>
                Scout cards
                <Shield className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6 xl:col-span-4">
          <UpcomingGame team={activeTeam} />

          <Card variant="film">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-accent/15 p-2 text-accent">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <div className="section-label">AI workflow</div>
                  <CardTitle>Coaching assistant</CardTitle>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm leading-6 text-muted-foreground">
                Generate install summaries, script ideas, opponent notes, and call-sheet support from the work already inside your system.
              </p>

              <div className="grid gap-2">
                <Button variant="accent" className="justify-between">
                  Build script draft
                  <ArrowRight className="h-4 w-4" />
                </Button>
                <Button variant="outline" className="justify-between">
                  Generate scouting notes
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}