import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Brain, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  Plus,
  Loader2,
  ChevronRight,
  Target,
  Zap
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function PlayRecommendationsPanel({ teamId, opponentId, weekNumber, sideOfBall, onAddToGamePlan }) {
  const [selectedPlays, setSelectedPlays] = useState([]);

  const { data: recommendations, isLoading, error } = useQuery({
    queryKey: ['playRecommendations', teamId, opponentId, weekNumber, sideOfBall],
    queryFn: async () => {
      const response = await base44.functions.invoke('generatePlayRecommendations', {
        team_id: teamId,
        opponent_id: opponentId,
        week_number: weekNumber,
        side_of_ball: sideOfBall
      });
      return response.data;
    },
    enabled: !!teamId && !!sideOfBall
  });

  const handleSelectPlay = (playId) => {
    setSelectedPlays(prev => 
      prev.includes(playId) 
        ? prev.filter(id => id !== playId)
        : [...prev, playId]
    );
  };

  const handleAddSelected = () => {
    if (onAddToGamePlan && selectedPlays.length > 0) {
      onAddToGamePlan(selectedPlays);
      setSelectedPlays([]);
    }
  };

  if (isLoading) {
    return (
      <Card className="border-emerald-900/30 bg-gradient-to-br from-emerald-950/50 to-slate-900/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-emerald-400 flex items-center gap-2">
            <Brain className="h-4 w-4" />
            AI Play Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !recommendations) {
    return (
      <Card className="border-red-900/30 bg-red-950/20">
        <CardContent className="py-6">
          <div className="flex items-center gap-2 text-red-400 text-sm">
            <AlertTriangle className="h-4 w-4" />
            Unable to load recommendations
          </div>
        </CardContent>
      </Card>
    );
  }

  const { recommendations: recs = [], gaps = [], game_plan_summary = '' } = recommendations;

  return (
    <Card className="border-emerald-900/30 bg-gradient-to-br from-emerald-950/50 to-slate-900/50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold text-emerald-400 flex items-center gap-2">
            <Brain className="h-4 w-4" />
            AI Play Recommendations
          </CardTitle>
          {selectedPlays.length > 0 && (
            <Button
              size="sm"
              className="h-7 text-xs bg-emerald-600 hover:bg-emerald-500"
              onClick={handleAddSelected}
            >
              <Plus className="h-3 w-3 mr-1" />
              Add {selectedPlays.length} Selected
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Game Plan Summary */}
        {game_plan_summary && (
          <div className="p-3 rounded-lg bg-emerald-900/20 border border-emerald-800/30">
            <p className="text-xs text-emerald-100 leading-relaxed">{game_plan_summary}</p>
          </div>
        )}

        {/* Recommendations List */}
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-2">
            {recs.map((rec, index) => (
              <div
                key={rec.play_id}
                className={cn(
                  "p-3 rounded-lg border transition-all cursor-pointer",
                  selectedPlays.includes(rec.play_id)
                    ? "bg-emerald-900/40 border-emerald-600"
                    : "bg-slate-800/50 border-slate-700 hover:border-emerald-700"
                )}
                onClick={() => handleSelectPlay(rec.play_id)}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold text-emerald-400">#{rec.priority_rank}</span>
                      <Badge 
                        variant="outline" 
                        className="text-[10px] h-5"
                      >
                        {rec.situation}
                      </Badge>
                      <ConfidenceBadge level={rec.confidence_level} />
                    </div>
                    <p className="text-xs text-slate-300 mb-2">{rec.why_recommended}</p>
                    <div className="flex items-center gap-3 text-[10px]">
                      <ReadinessStatus status={rec.readiness_status} />
                      {rec.coaching_point && (
                        <span className="text-slate-500 flex items-center gap-1">
                          <Target className="h-3 w-3" />
                          {rec.coaching_point}
                        </span>
                      )}
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-slate-600" />
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        {/* Gaps/Warnings */}
        {gaps.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-amber-400 text-xs font-semibold">
              <AlertTriangle className="h-3 w-3" />
              Playbook Gaps
            </div>
            {gaps.map((gap, idx) => (
              <div key={idx} className="p-2 rounded bg-amber-950/30 border border-amber-800/30">
                <p className="text-[10px] text-amber-200">
                  <span className="font-semibold">{gap.concept_missing}</span> - {gap.recommendation}
                </p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ConfidenceBadge({ level }) {
  const config = {
    high: { color: 'text-emerald-400', bg: 'bg-emerald-900/30', border: 'border-emerald-700' },
    medium: { color: 'text-amber-400', bg: 'bg-amber-900/30', border: 'border-amber-700' },
    low: { color: 'text-slate-400', bg: 'bg-slate-800/30', border: 'border-slate-600' }
  };

  const { color, bg, border } = config[level] || config.low;

  return (
    <Badge variant="outline" className={cn("text-[10px] h-5", border, bg, color)}>
      {level === 'high' && <Zap className="h-2.5 w-2.5 mr-1" />}
      {level.charAt(0).toUpperCase() + level.slice(1)}
    </Badge>
  );
}

function ReadinessStatus({ status }) {
  const config = {
    practiced_recently: { icon: CheckCircle, color: 'text-emerald-400', label: 'Practiced recently' },
    installed_but_stale: { icon: Clock, color: 'text-amber-400', label: 'Needs review' },
    new_this_week: { icon: TrendingUp, color: 'text-blue-400', label: 'New install' }
  };

  const { icon: Icon, color, label } = config[status] || config.new_this_week;

  return (
    <span className={cn("flex items-center gap-1", color)}>
      <Icon className="h-3 w-3" />
      {label}
    </span>
  );
}