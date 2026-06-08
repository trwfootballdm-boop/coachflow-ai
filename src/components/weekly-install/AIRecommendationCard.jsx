import React from 'react';
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { 
  CheckCircle2, AlertTriangle, AlertCircle, Target, 
  TrendingUp, Shield, Zap, Star
} from "lucide-react";
import { cn } from "@/lib/utils";

const CONFIDENCE_COLORS = {
  high: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800',
  medium: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800',
  low: 'bg-red-500/10 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800',
};

const READINESS_COLORS = {
  practiced: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
  new_install: 'bg-amber-500/10 text-amber-700 dark:text-amber-400',
  needs_reps: 'bg-red-500/10 text-red-700 dark:text-red-400',
  concept_only: 'bg-blue-500/10 text-blue-700 dark:text-blue-400',
};

export default function AIRecommendationCard({ priority, index }) {
  const confidenceColor = CONFIDENCE_COLORS[priority.confidence_level] || CONFIDENCE_COLORS.medium;
  const readinessColor = READINESS_COLORS[priority.readiness_status] || READINESS_COLORS.concept_only;

  return (
    <Card className="border-border hover:border-primary/30 transition-all">
      <CardContent className="p-4 space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <span className="text-xs font-bold text-primary">{index}</span>
            </div>
            <div>
              <p className="text-sm font-semibold">{priority.concept_name || priority.situation}</p>
              {priority.situation && (
                <p className="text-xs text-muted-foreground">{priority.situation}</p>
              )}
            </div>
          </div>
          <Badge variant="outline" className={cn("text-[10px]", readinessColor)}>
            {priority.readiness_status?.replace('_', ' ')}
          </Badge>
        </div>

        {/* Why Recommended */}
        <div className="space-y-2">
          <div className="flex items-start gap-2">
            <Target className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold text-muted-foreground uppercase">Why Recommended</p>
              <p className="text-sm text-muted-foreground">{priority.why_recommended}</p>
            </div>
          </div>

          {/* Assumptions */}
          {priority.assumptions && (
            <div className="flex items-start gap-2">
              <Zap className="h-3.5 w-3.5 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-muted-foreground uppercase">Assumptions</p>
                <p className="text-xs text-muted-foreground italic">{priority.assumptions}</p>
              </div>
            </div>
          )}
        </div>

        {/* Confidence Level */}
        <div className="pt-2 border-t border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-muted-foreground">Confidence:</span>
              <Badge variant="outline" className={cn("text-[10px]", confidenceColor)}>
                {priority.confidence_level}
              </Badge>
            </div>
            {priority.play_id && (
              <Badge variant="secondary" className="text-[10px]">
                Play in Library
              </Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}