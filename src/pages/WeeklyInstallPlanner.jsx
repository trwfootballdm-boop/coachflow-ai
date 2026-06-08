import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTeam } from '@/components/TeamContext';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import { 
  Brain, Calendar, ClipboardList, ChevronRight, AlertTriangle, CheckCircle2, 
  Loader2, Target, TrendingUp, Shield, Zap, AlertCircle, Star, X,
  ArrowRight, RefreshCw, FileText, Edit3, Save
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { format } from 'date-fns';

import AIRecommendationCard from '@/components/weekly-install/AIRecommendationCard';
import OpponentSummary from '@/components/weekly-install/OpponentSummary';
import ReadinessPanel from '@/components/weekly-install/ReadinessPanel';
import PlanReviewPanel from '@/components/weekly-install/PlanReviewPanel';

export default function WeeklyInstallPlanner() {
  const { activeTeamId } = useTeam();
  const queryClient = useQueryClient();
  
  const [selectedOpponent, setSelectedOpponent] = useState(null);
  const [weekNumber, setWeekNumber] = useState(1);
  const [sideOfBall, setSideOfBall] = useState('all');
  const [generatedPlan, setGeneratedPlan] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showOpponentDialog, setShowOpponentDialog] = useState(false);
  const [newOpponent, setNewOpponent] = useState({
    name: '', abbreviation: '', game_date: '', base_offense: '', base_defense: '',
    offensive_tendencies: '', defensive_tendencies: '', blitz_tendencies: '',
    strengths: '', weaknesses: '', notes: ''
  });

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

  // Create opponent mutation
  const createOpponentMutation = useMutation({
    mutationFn: () => base44.entities.Opponent.create({
      ...newOpponent,
      team_id: activeTeamId,
      location: 'away',
    }),
    onSuccess: (opponent) => {
      queryClient.invalidateQueries({ queryKey: ['opponents'] });
      setSelectedOpponent(opponent);
      setShowOpponentDialog(false);
      setNewOpponent({
        name: '', abbreviation: '', game_date: '', base_offense: '', base_defense: '',
        offensive_tendencies: '', defensive_tendencies: '', blitz_tendencies: '',
        strengths: '', weaknesses: '', notes: ''
      });
      toast.success('Opponent added');
    },
  });

  // Generate weekly plan mutation
  const generatePlanMutation = useMutation({
    mutationFn: async () => {
      const response = await base44.functions.invoke('generateWeeklyPlan', {
        team_id: activeTeamId,
        opponent_id: selectedOpponent?.id,
        week_number: weekNumber,
        side_of_ball: sideOfBall,
      });
      return response.data;
    },
    onMutate: () => setIsGenerating(true),
    onSuccess: (data) => {
      if (data.success) {
        setGeneratedPlan(data.plan);
        queryClient.invalidateQueries({ queryKey: ['weeklyPlans'] });
        toast.success('Weekly plan generated');
      } else {
        toast.error('Failed to generate plan', { description: data.error });
      }
      setIsGenerating(false);
    },
    onError: (error) => {
      toast.error('Generation failed', { description: error.message });
      setIsGenerating(false);
    },
  });

  const handleGenerate = () => {
    if (!activeTeamId) {
      toast.error('No team selected');
      return;
    }
    generatePlanMutation.mutate();
  };

  const handlePushToPracticeScript = () => {
    toast.info('Practice Script integration coming soon');
  };

  const handlePushToGamePlan = () => {
    toast.info('Game Plan integration coming soon');
  };

  const handlePushToScoutCards = () => {
    toast.info('Scout Cards integration coming soon');
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold flex items-center gap-2">
            <Brain className="h-6 w-6 text-primary" />
            AI Weekly Install Planner
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Generate opponent-specific game plans with install priorities and practice recommendations
          </p>
        </div>
        {generatedPlan && (
          <Button variant="outline" onClick={() => setGeneratedPlan(null)} className="gap-2">
            <RefreshCw className="h-4 w-4" /> New Plan
          </Button>
        )}
      </div>

      {!generatedPlan ? (
        // Planning Setup
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Selection Form */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-primary" />
                Plan Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Week Selection */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs font-semibold">Week Number</Label>
                  <Select value={String(weekNumber)} onValueChange={(v) => setWeekNumber(Number(v))}>
                    <SelectTrigger className="mt-1.5">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 12 }, (_, i) => i + 1).map((week) => (
                        <SelectItem key={week} value={String(week)}>
                          Week {week}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs font-semibold">Side of Ball</Label>
                  <Select value={sideOfBall} onValueChange={setSideOfBall}>
                    <SelectTrigger className="mt-1.5">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All (Offense + Defense)</SelectItem>
                      <SelectItem value="offense">Offense Only</SelectItem>
                      <SelectItem value="defense">Defense Only</SelectItem>
                      <SelectItem value="special_teams">Special Teams Only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Opponent Selection */}
              <div>
                <Label className="text-xs font-semibold">Opponent</Label>
                <div className="flex gap-2 mt-1.5">
                  <Select 
                    value={selectedOpponent?.id || ''} 
                    onValueChange={(id) => setSelectedOpponent(opponents.find(o => o.id === id))}
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Select opponent..." />
                    </SelectTrigger>
                    <SelectContent>
                      {opponents.map((opp) => (
                        <SelectItem key={opp.id} value={opp.id}>
                          {opp.name} {opp.game_date && `(${format(new Date(opp.game_date), 'MMM d')})`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Dialog open={showOpponentDialog} onOpenChange={setShowOpponentDialog}>
                    <DialogTrigger asChild>
                      <Button variant="outline" type="button">Add New</Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>Add New Opponent</DialogTitle>
                        <DialogDescription>
                          Enter opponent details to enable AI-powered game planning
                        </DialogDescription>
                      </DialogHeader>
                      <div className="grid grid-cols-2 gap-4 mt-4">
                        <div className="col-span-2">
                          <Label>Team Name *</Label>
                          <Input 
                            value={newOpponent.name} 
                            onChange={(e) => setNewOpponent({...newOpponent, name: e.target.value})}
                            placeholder="e.g. Central Eagles"
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label>Abbreviation</Label>
                          <Input 
                            value={newOpponent.abbreviation} 
                            onChange={(e) => setNewOpponent({...newOpponent, abbreviation: e.target.value})}
                            placeholder="CEN"
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label>Game Date</Label>
                          <Input 
                            type="date"
                            value={newOpponent.game_date} 
                            onChange={(e) => setNewOpponent({...newOpponent, game_date: e.target.value})}
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label>Base Offense</Label>
                          <Input 
                            value={newOpponent.base_offense} 
                            onChange={(e) => setNewOpponent({...newOpponent, base_offense: e.target.value})}
                            placeholder="e.g. Spread"
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label>Base Defense</Label>
                          <Input 
                            value={newOpponent.base_defense} 
                            onChange={(e) => setNewOpponent({...newOpponent, base_defense: e.target.value})}
                            placeholder="e.g. 4-3"
                            className="mt-1"
                          />
                        </div>
                        <div className="col-span-2">
                          <Label>Offensive Tendencies</Label>
                          <Textarea 
                            value={newOpponent.offensive_tendencies} 
                            onChange={(e) => setNewOpponent({...newOpponent, offensive_tendencies: e.target.value})}
                            placeholder="e.g. Heavy run team, like to establish inside zone..."
                            className="mt-1"
                            rows={2}
                          />
                        </div>
                        <div className="col-span-2">
                          <Label>Defensive Tendencies</Label>
                          <Textarea 
                            value={newOpponent.defensive_tendencies} 
                            onChange={(e) => setNewOpponent({...newOpponent, defensive_tendencies: e.target.value})}
                            placeholder="e.g. Aggressive blitzing, play man coverage..."
                            className="mt-1"
                            rows={2}
                          />
                        </div>
                        <div className="col-span-2">
                          <Label>Strengths</Label>
                          <Textarea 
                            value={newOpponent.strengths} 
                            onChange={(e) => setNewOpponent({...newOpponent, strengths: e.target.value})}
                            placeholder="e.g. Physical O-line, fast receivers..."
                            className="mt-1"
                            rows={2}
                          />
                        </div>
                        <div className="col-span-2">
                          <Label>Weaknesses</Label>
                          <Textarea 
                            value={newOpponent.weaknesses} 
                            onChange={(e) => setNewOpponent({...newOpponent, weaknesses: e.target.value})}
                            placeholder="e.g. Secondary depth, pass rush..."
                            className="mt-1"
                            rows={2}
                          />
                        </div>
                      </div>
                      <DialogFooter className="mt-6">
                        <Button variant="outline" onClick={() => setShowOpponentDialog(false)}>Cancel</Button>
                        <Button 
                          onClick={() => createOpponentMutation.mutate()}
                          disabled={!newOpponent.name || createOpponentMutation.isPending}
                        >
                          {createOpponentMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                          Add Opponent
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
                {selectedOpponent && (
                  <div className="mt-3 p-3 bg-secondary/50 rounded-lg border border-border">
                    <div className="flex items-start gap-3">
                      <Shield className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm font-semibold">{selectedOpponent.name}</p>
                        {selectedOpponent.base_offense && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Offense: {selectedOpponent.base_offense} · Defense: {selectedOpponent.base_defense}
                          </p>
                        )}
                        {selectedOpponent.game_date && (
                          <p className="text-xs text-muted-foreground mt-0.5">
                            Game: {format(new Date(selectedOpponent.game_date), 'EEEE, MMM d, yyyy')}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Generate Button */}
              <div className="pt-4 border-t border-border">
                <Button 
                  onClick={handleGenerate}
                  disabled={isGenerating || generatePlanMutation.isPending}
                  className="w-full h-12 gap-2 text-base"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Generating AI Game Plan...
                    </>
                  ) : (
                    <>
                      <Brain className="h-5 w-5" />
                      Generate Weekly Plan
                    </>
                  )}
                </Button>
                <p className="text-xs text-muted-foreground mt-2 text-center">
                  AI will analyze opponent tendencies, your playbook, and practice history to generate recommendations
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Right: Recent Plans */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <FileText className="h-4 w-4 text-primary" />
                Recent Plans
              </CardTitle>
            </CardHeader>
            <CardContent>
              {existingPlans.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No weekly plans yet
                </p>
              ) : (
                <div className="space-y-2">
                  {existingPlans.slice(0, 5).map((plan) => (
                    <button
                      key={plan.id}
                      onClick={() => setGeneratedPlan(plan)}
                      className="w-full text-left p-3 rounded-lg border border-border hover:border-primary/30 hover:bg-secondary/30 transition-all"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-semibold">Week {plan.week_number}</p>
                          {plan.opponent_id && (
                            <p className="text-xs text-muted-foreground">vs Opponent</p>
                          )}
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="secondary" className="text-[10px]">
                          {plan.side_of_ball === 'all' ? 'All' : plan.side_of_ball}
                        </Badge>
                        {plan.ai_generated && (
                          <Badge variant="secondary" className="text-[10px] bg-primary/10 text-primary">
                            AI
                          </Badge>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      ) : (
        // Generated Plan Display
        <div className="space-y-6">
          {/* Opponent Summary & Readiness */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <OpponentSummary 
              opponent_summary={generatedPlan.opponent_summary}
              opponent={opponents.find(o => o.id === generatedPlan.opponent_id)}
            />
            <ReadinessPanel team_readiness={generatedPlan.team_readiness} />
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Zap className="h-4 w-4 text-amber-500" />
                  AI Assumptions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {(generatedPlan.ai_assumptions || []).map((assumption, idx) => (
                    <li key={idx} className="text-xs text-muted-foreground flex items-start gap-2">
                      <AlertCircle className="h-3.5 w-3.5 text-amber-500 shrink-0 mt-0.5" />
                      {assumption}
                    </li>
                  ))}
                  {(generatedPlan.ai_assumptions || []).length === 0 && (
                    <li className="text-xs text-muted-foreground">No assumptions made</li>
                  )}
                </ul>
              </CardContent>
            </Card>
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

          {/* Side of Ball Plans */}
          {sideOfBall !== 'defense' && generatedPlan.offense_plan && (
            <PlanReviewPanel 
              title="Offense Plan"
              icon={<Target className="h-5 w-5 text-emerald-500" />}
              plan={generatedPlan.offense_plan}
              type="offense"
              onPushToPractice={handlePushToPracticeScript}
              onPushToGamePlan={handlePushToGamePlan}
            />
          )}

          {sideOfBall !== 'offense' && generatedPlan.defense_plan && (
            <PlanReviewPanel 
              title="Defense Plan"
              icon={<Shield className="h-5 w-5 text-blue-500" />}
              plan={generatedPlan.defense_plan}
              type="defense"
              onPushToPractice={handlePushToPracticeScript}
              onPushToGamePlan={handlePushToGamePlan}
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

          {/* Action Buttons */}
          <div className="flex items-center gap-3 pt-4 border-t border-border">
            <Button onClick={handlePushToPracticeScript} className="gap-2">
              <FileText className="h-4 w-4" /> Push to Practice Script
            </Button>
            <Button onClick={handlePushToGamePlan} variant="outline" className="gap-2">
              <ClipboardList className="h-4 w-4" /> Push to Game Plan
            </Button>
            <Button onClick={handlePushToScoutCards} variant="outline" className="gap-2">
              <Brain className="h-4 w-4" /> Generate Scout Cards
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}