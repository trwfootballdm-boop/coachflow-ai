import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  CheckCircle2, AlertTriangle, AlertCircle, TrendingUp,
  Shield, Target, Zap
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function ReadinessPanel({ team_readiness }) {
  if (!team_readiness) {
    return null;
  }

  const totalPlays = (team_readiness.practiced_plays_count || 0) + (team_readiness.unpracticed_plays_count || 0);
  const readinessPct = totalPlays > 0 
    ? Math.round((team_readiness.practiced_plays_count / totalPlays) * 100) 
    : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm">
          <Target className="h-5 w-5 text-primary" />
          Team Readiness
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Readiness Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Playbook Readiness</span>
            <span className="font-bold">{readinessPct}%</span>
          </div>
          <Progress 
            value={readinessPct} 
            className={cn(
              "h-2",
              readinessPct >= 80 ? "bg-emerald-500" : readinessPct >= 50 ? "bg-amber-500" : "bg-red-500"
            )}
          />
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3 text-emerald-500" />
              {team_readiness.practiced_plays_count || 0} practiced
            </span>
            <span className="flex items-center gap-1">
              <AlertTriangle className="h-3 w-3 text-amber-500" />
              {team_readiness.unpracticed_plays_count || 0} unpracticed
            </span>
          </div>
        </div>

        {/* Complexity Tolerance */}
        {team_readiness.complexity_tolerance && (
          <div className="pt-3 border-t border-border">
            <p className="text-xs font-bold text-muted-foreground uppercase mb-1">Complexity Tolerance</p>
            <Badge variant="secondary" className="mt-1">
              {team_readiness.complexity_tolerance}
            </Badge>
          </div>
        )}

        {/* Age Level */}
        {team_readiness.age_level && (
          <div>
            <p className="text-xs font-bold text-muted-foreground uppercase mb-1">Age Level</p>
            <p className="text-sm font-medium capitalize">{team_readiness.age_level.replace('_', ' ')}</p>
          </div>
        )}

        {/* Readiness Gaps */}
        {(team_readiness.readiness_gaps || []).length > 0 && (
          <div className="pt-3 border-t border-border">
            <p className="text-xs font-bold text-muted-foreground uppercase mb-2 flex items-center gap-1">
              <AlertCircle className="h-3.5 w-3.5 text-amber-500" />
              Readiness Gaps
            </p>
            <ul className="space-y-1">
              {team_readiness.readiness_gaps.map((gap, idx) => (
                <li key={idx} className="text-xs text-muted-foreground flex items-start gap-1.5">
                  <AlertCircle className="h-3 w-3 text-amber-500 shrink-0 mt-0.5" />
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