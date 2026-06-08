import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  CheckCircle2, AlertCircle, Target, Zap, 
  TrendingUp, Shield, Brain, FileText,
  ClipboardList
} from 'lucide-react';
import { cn } from '@/lib/utils';

export function AIRecommendationCard({ priority, index }) {
  const readinessColors = {
    practiced: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800',
    new_install: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800',
    needs_reps: 'bg-red-500/10 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800',
    concept_only: 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800',
  };

  const confidenceIcons = {
    high: <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />,
    medium: <AlertCircle className="h-3.5 w-3.5 text-amber-500" />,
    low: <AlertCircle className="h-3.5 w-3.5 text-red-500" />,
  };

  return (
    <div className="border border-border rounded-lg p-4 space-y-3 bg-card hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="h-6 w-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">
            {index}
          </span>
          <div>
            <h4 className="font-semibold text-sm">{priority.concept_name}</h4>
            <p className="text-xs text-muted-foreground">{priority.situation}</p>
          </div>
        </div>
        <Badge variant="outline" className={cn("text-[10px]", readinessColors[priority.readiness_status] || readinessColors.concept_only)}>
          {priority.readiness_status?.replace('_', ' ')}
        </Badge>
      </div>

      <div className="space-y-2 text-xs">
        <div className="flex items-center gap-2">
          {confidenceIcons[priority.confidence_level]}
          <span className="text-muted-foreground">Confidence: <span className="font-medium text-foreground">{priority.confidence_level}</span></span>
        </div>
        
        <div>
          <p className="font-medium text-foreground mb-1">Why Recommended:</p>
          <p className="text-muted-foreground">{priority.why_recommended}</p>
        </div>

        {priority.assumptions && (
          <div>
            <p className="font-medium text-foreground mb-1">Assumptions:</p>
            <p className="text-muted-foreground italic">{priority.assumptions}</p>
          </div>
        )}
      </div>
    </div>
  );
}

export function ReadinessPanel({ team_readiness }) {
  if (!team_readiness) return null;

  const readinessScore = team_readiness.practiced_plays_count > 0 
    ? Math.round(team_readiness.practiced_plays_count / (team_readiness.practiced_plays_count + team_readiness.unpracticed_plays_count) * 100)
    : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          <Shield className="h-4 w-4 text-primary" />
          Team Readiness
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Preparation Level</span>
          <span className="text-sm font-bold">{readinessScore}%</span>
        </div>
        <div className="h-2 bg-secondary rounded-full overflow-hidden">
          <div 
            className={cn("h-full rounded-full transition-all", 
              readinessScore >= 80 ? "bg-emerald-500" : readinessScore >= 50 ? "bg-amber-500" : "bg-red-500"
            )}
            style={{ width: `${readinessScore}%` }}
          />
        </div>
        <div className="grid grid-cols-2 gap-2 text-center">
          <div className="bg-emerald-500/10 rounded-lg p-2">
            <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{team_readiness.practiced_plays_count}</div>
            <div className="text-[10px] text-muted-foreground">Practiced</div>
          </div>
          <div className="bg-amber-500/10 rounded-lg p-2">
            <div className="text-lg font-bold text-amber-600 dark:text-amber-400">{team_readiness.unpracticed_plays_count}</div>
            <div className="text-[10px] text-muted-foreground">Unpracticed</div>
          </div>
        </div>
        {team_readiness.readiness_gaps?.length > 0 && (
          <div className="space-y-1">
            <p className="text-[10px] font-bold text-muted-foreground uppercase">Gaps</p>
            <ul className="space-y-1">
              {team_readiness.readiness_gaps.slice(0, 3).map((gap, idx) => (
                <li key={idx} className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <AlertCircle className="h-3 w-3 text-amber-500 shrink-0" />
                  {gap}
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function PlanReviewPanel({ title, icon, plan, type, onPushToPractice, onPushToGamePlan }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {icon}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {plan.practice_emphasis && (
          <div>
            <p className="text-xs font-bold text-muted-foreground uppercase mb-1">Practice Emphasis</p>
            <p className="text-sm">{plan.practice_emphasis}</p>
          </div>
        )}
        
        {plan.coaching_points && (
          <div>
            <p className="text-xs font-bold text-muted-foreground uppercase mb-1">Coaching Points</p>
            <p className="text-sm text-muted-foreground">{plan.coaching_points}</p>
          </div>
        )}

        {plan.openers?.length > 0 && (
          <div>
            <p className="text-xs font-bold text-muted-foreground uppercase mb-2 flex items-center gap-1.5">
              <Target className="h-3.5 w-3.5" /> Opener Script
            </p>
            <div className="space-y-1">
              {plan.openers.map((play, idx) => (
                <div key={idx} className="flex items-center gap-2 text-sm">
                  <span className="h-5 w-5 rounded bg-primary/10 text-primary text-[10px] font-bold flex items-center justify-center">
                    {idx + 1}
                  </span>
                  <span>{play}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {plan.core_plays?.length > 0 && (
          <div>
            <p className="text-xs font-bold text-muted-foreground uppercase mb-2">Core Plays</p>
            <div className="flex flex-wrap gap-1.5">
              {plan.core_plays.map((play, idx) => (
                <Badge key={idx} variant="secondary" className="text-[10px]">
                  {play}
                </Badge>
              ))}
            </div>
          </div>
        )}

        <div className="flex items-center gap-2 pt-3 border-t border-border">
          <Button size="sm" variant="outline" className="gap-1.5 text-xs" onClick={onPushToPractice}>
            <FileText className="h-3.5 w-3.5" /> Push to Practice
          </Button>
          <Button size="sm" variant="outline" className="gap-1.5 text-xs" onClick={onPushToGamePlan}>
            <ClipboardList className="h-3.5 w-3.5" /> Push to Game Plan
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}