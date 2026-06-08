import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTeam } from '@/components/TeamContext';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Brain, Calendar, Target, Shield, Zap, AlertCircle, AlertTriangle,
  FileText, ClipboardList, Loader2, CheckCircle2,
  ChevronRight, X, Plus
} from "lucide-react";
import { format } from 'date-fns';
import { toast } from "sonner";
import { cn } from "@/lib/utils";

import AIRecommendationCard from '@/components/weekly-install/AIRecommendationCard';
import ReadinessPanel from '@/components/weekly-install/ReadinessPanel';
import PlanReviewPanel from '@/components/weekly-install/PlanReviewPanel';

export default function WeeklyInstallPlanner() {
  const { activeTeamId } = useTeam();
  const queryClient = useQueryClient();
  
  const [step, setStep] = useState(1);
  const [selectedOpponent, setSelectedOpponent] = useState(null);
  const [weekNumber, setWeekNumber] = useState(1);
  const [sideOfBall, setSideOfBall] = useState('all');
  const [generatedPlan, setGeneratedPlan] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // Fetch opponents
  const { data: opponents = [] } = useQuery({
    queryKey: ['opponents', activeTeamId],
    queryFn: () => base44.entities.Opponent.filter({ team_id: activeTeamId }, 'game_date'),
    enabled: !!activeTeamId,
  });

  // Fetch existing weekly plans
  const { data: existingPlans = [] } = useQuery({
    queryKey: ['weeklyPlans', activeTeamId],
    queryFn: () => base44.entities.WeeklyInstallPlan.filter({ team_id: activeTeamId }, '-week_number'),
    enabled: !!activeTeamId,
  });

  // Generate plan mutation
  const generatePlanMutation = useMutation({
    mutationFn: async () => {
      setIsGenerating(true);
      try {
        const response = await base44.functions.invoke('generateWeeklyPlan', {
          team_id: activeTeamId,
          opponent_id: selectedOpponent?.id,
          week_number: weekNumber,
          side_of_ball: sideOfBall,
        });
        return response;
      } finally {
        setIsGenerating(false);
      }
    },
    onSuccess: (data) => {
      if (data.success) {
        setGeneratedPlan(data.plan);
        setStep(2);
        toast.success('Weekly plan generated');
      } else {
        toast.error('Failed to generate plan');
      }
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to generate plan');
    },
  });

  // Push to practice script
  const pushToPracticeMutation = useMutation({
    mutationFn: async () => {
      // Create practice script from plan
      const script = await base44.entities.PracticeScript.create({
        team_id: activeTeamId,
        title: `Week ${weekNumber} Install - ${sideOfBall}`,
        practice_day: 'tuesday_team',
        script_date: new Date().toISOString().split('T')[0],
        focus_area: 'Game Plan Install',
        coaching_emphasis: generatedPlan?.offense_plan?.practice_emphasis || generatedPlan?.defense_plan?.practice_emphasis,
        generated_by_ai: true,
      });

      // Add plays to script
      const playsToAdd = [
        ...(generatedPlan?.offense_plan?.opener_play_ids || []),
        ...(generatedPlan?.offense_plan?.core_play_ids || []),
        ...(generatedPlan?.defense_plan?.base_front_play_ids || []),
      ].filter(Boolean);

      for (const playId of playsToAdd) {
        await base44.entities.PracticeScriptItem.create({
          practice_script_id: script.id,
          play_id: playId,
          period_label: 'Team Period',
          reps_target: 10,
          emphasis_level: 'high',
        });
      }

      // Update plan with pushed script ID
      await base44.entities.WeeklyInstallPlan.update(generatedPlan.id, {
        pushed_to_practice_script_id: script.id,
        status: 'pushed_to_practice',
      });

      return script;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['practiceScripts'] });
      toast.success('Pushed to practice script');
    },
  });

  // Push to game plan
  const pushToGamePlanMutation = useMutation({
    mutationFn: async () => {
      // Create or update game plan
      let gamePlan = existingPlans.find(p => p.week_number === weekNumber);
      
      if (!gamePlan) {
        gamePlan = await base44.entities.GamePlan.create({
          team_id: activeTeamId,
          title: `Week ${weekNumber} Game Plan`,
          week_label: `Week ${weekNumber}`,
          status: 'draft',
          call_sheet: {},
        });
      }

      // Update call sheet with recommended plays
      const callSheet = { ...gamePlan.call_sheet };
      
      if (generatedPlan?.offense_plan?.opener_play_ids) {
        callSheet.openers = generatedPlan.offense_plan.opener_play_ids.map((playId, idx) => ({
          play_id: playId,
          is_opener: true,
          opener_sequence: idx + 1,
          call_sheet_priority: 1,
          practiced_this_week: true,
        }));
      }

      if (generatedPlan?.offense_plan?.red_zone_plan) {
        callSheet.red_zone = generatedPlan.offense_plan.red_zone_plan.map(playId => ({
          play_id: playId,
          call_sheet_priority: 2,
          practiced_this_week: true,
        }));
      }

      await base44.entities.GamePlan.update(gamePlan.id, { call_sheet });
      await base44.entities.WeeklyInstallPlan.update(generatedPlan.id, {
        pushed_to_game_plan_id: gamePlan.id,
        status: 'approved',
      });

      return gamePlan;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gamePlans'] });
      toast.success('Pushed to game plan');
    },
  });

  const handleGenerate = () => {
    if (!selectedOpponent && sideOfBall !== 'special_teams') {
      toast.warning('Select an opponent for better recommendations');
    }
    generatePlanMutation.mutate();
  };

  const handleReset = () => {
    setStep(1);
    setGeneratedPlan(null);
    setSelectedOpponent(null);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold">AI Weekly Install Engine</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Generate opponent-specific game plans with AI-assisted recommendations
          </p>
        </div>
        {step === 2 && (
          <Button variant="outline" size="sm" onClick={handleReset} className="gap-2">
            <X className="h-4 w-4" /> Start Over
          </Button>
        )}
      </div>

      {/* Step 1: Configuration */}
      {step === 1 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Opponent Selection */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-primary" />
                Select Opponent
              </CardTitle>
            </CardHeader>
            <CardContent>
              {opponents.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-sm text-muted-foreground mb-3">No opponents added yet</p>
                  <Button variant="outline" size="sm">Add Opponent</Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {opponents.map(opponent => (
                    <button
                      key={opponent.id}
                      onClick={() => setSelectedOpponent(opponent)}
                      className={cn(
                        "text-left border rounded-lg p-3 transition-all hover:shadow-md",
                        selectedOpponent?.id === opponent.id
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/50"
                      )}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold text-sm">{opponent.name}</span>
                        {selectedOpponent?.id === opponent.id && (
                          <CheckCircle2 className="h-4 w-4 text-primary" />
                        )}
                      </div>
                      {opponent.game_date && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {format(new Date(opponent.game_date), 'MMM d, yyyy')}
                        </p>
                      )}
                      {opponent.base_defense && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Defense: {opponent.base_defense}
                        </p>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Week & Side Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                Week & Focus
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-xs font-medium mb-1.5 block">Week Number</label>
                <Input
                  type="number"
                  min="1"
                  max="15"
                  value={weekNumber}
                  onChange={(e) => setWeekNumber(parseInt(e.target.value) || 1)}
                  className="h-9"
                />
              </div>

              <div>
                <label className="text-xs font-medium mb-1.5 block">Side of Ball</label>
                <div className="space-y-2">
                  {[
                    { value: 'all', label: 'Offense & Defense' },
                    { value: 'offense', label: 'Offense Only' },
                    { value: 'defense', label: 'Defense Only' },
                    { value: 'special_teams', label: 'Special Teams' },
                  ].map(option => (
                    <button
                      key={option.value}
                      onClick={() => setSideOfBall(option.value)}
                      className={cn(
                        "w-full text-left text-sm px-3 py-2 rounded-lg border transition-all",
                        sideOfBall === option.value
                          ? "border-primary bg-primary/5 text-primary font-medium"
                          : "border-border hover:border-primary/50"
                      )}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              <Button 
                onClick={handleGenerate} 
                className="w-full gap-2 mt-4"
                disabled={isGenerating}
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Generating Plan...
                  </>
                ) : (
                  <>
                    <Brain className="h-4 w-4" />
                    Generate AI Plan
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Step 2: Review Plan */}
      {step === 2 && generatedPlan && (
        <div className="space-y-6">
          {/* Opponent Summary & Readiness */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5 text-primary" />
                  Opponent Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                {generatedPlan.opponent_summary && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs font-bold text-muted-foreground uppercase">Base Offense</p>
                        <p className="font-medium">{generatedPlan.opponent_summary.base_offense}</p>
                      </div>
                      <div>
                        <p className="text-xs font-bold text-muted-foreground uppercase">Base Defense</p>
                        <p className="font-medium">{generatedPlan.opponent_summary.base_defense}</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-muted-foreground uppercase mb-1">Tendencies</p>
                      <p className="text-muted-foreground">{generatedPlan.opponent_summary.offensive_tendencies}</p>
                    </div>
                    {generatedPlan.opponent_summary.weaknesses && (
                      <div>
                        <p className="text-xs font-bold text-muted-foreground uppercase mb-1">Exploitable Weaknesses</p>
                        <p className="text-emerald-600 dark:text-emerald-400">{generatedPlan.opponent_summary.weaknesses}</p>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>

            <ReadinessPanel team_readiness={generatedPlan.team_readiness} />
          </div>

          {/* Install Priorities */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-primary" />
                Install Priorities
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {(generatedPlan.install_priorities || []).map((priority, idx) => (
                  <AIRecommendationCard 
                    key={idx}
                    priority={priority}
                    index={idx + 1}
                  />
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Offense Plan */}
          {sideOfBall !== 'defense' && generatedPlan.offense_plan && (
            <PlanReviewPanel 
              title="Offense Plan"
              icon={<Target className="h-5 w-5 text-emerald-500" />}
              plan={generatedPlan.offense_plan}
              type="offense"
              onPushToPractice={() => pushToPracticeMutation.mutate()}
              onPushToGamePlan={() => pushToGamePlanMutation.mutate()}
            />
          )}

          {/* Defense Plan */}
          {sideOfBall !== 'offense' && generatedPlan.defense_plan && (
            <PlanReviewPanel 
              title="Defense Plan"
              icon={<Shield className="h-5 w-5 text-blue-500" />}
              plan={generatedPlan.defense_plan}
              type="defense"
              onPushToPractice={() => pushToPracticeMutation.mutate()}
              onPushToGamePlan={() => pushToGamePlanMutation.mutate()}
            />
          )}

          {/* Readiness Warnings */}
          {(generatedPlan.readiness_warnings || []).length > 0 && (
            <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
                  <AlertTriangle className="h-5 w-5" />
                  Readiness Warnings
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {generatedPlan.readiness_warnings.map((warning, idx) => (
                    <li key={idx} className="text-sm text-amber-800 dark:text-amber-300 flex items-start gap-2">
                      <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                      {warning}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* AI Assumptions */}
          {(generatedPlan.ai_assumptions || []).length > 0 && (
            <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-blue-700 dark:text-blue-400">
                  <Zap className="h-5 w-5" />
                  AI Assumptions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {generatedPlan.ai_assumptions.map((assumption, idx) => (
                    <li key={idx} className="text-sm text-blue-800 dark:text-blue-300 flex items-start gap-2">
                      <Zap className="h-4 w-4 shrink-0 mt-0.5" />
                      {assumption}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="flex items-center gap-3 pt-4 border-t border-border">
            <Button 
              onClick={() => pushToPracticeMutation.mutate()} 
              className="gap-2"
              disabled={pushToPracticeMutation.isPending}
            >
              {pushToPracticeMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <FileText className="h-4 w-4" />
              )}
              Push to Practice Script
            </Button>
            <Button 
              onClick={() => pushToGamePlanMutation.mutate()} 
              variant="outline" 
              className="gap-2"
              disabled={pushToGamePlanMutation.isPending}
            >
              {pushToGamePlanMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ClipboardList className="h-4 w-4" />
              )}
              Push to Game Plan
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}