import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Brain, Target, TrendingUp, AlertTriangle, CheckCircle2,
  Shield, Sword, Zap
} from "lucide-react";

export default function OpponentSummary({ opponent_summary, opponent }) {
  if (!opponent_summary) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">No Opponent Data</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Select an opponent or add opponent notes for AI-powered recommendations
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm">
          <Brain className="h-5 w-5 text-primary" />
          Opponent Profile
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        {/* Base Formations */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-xs font-bold text-muted-foreground uppercase mb-1">Base Offense</p>
            <p className="font-medium">{opponent_summary.base_offense || 'Unknown'}</p>
          </div>
          <div>
            <p className="text-xs font-bold text-muted-foreground uppercase mb-1">Base Defense</p>
            <p className="font-medium">{opponent_summary.base_defense || 'Unknown'}</p>
          </div>
        </div>

        {/* Coverage */}
        {opponent_summary.base_coverage && (
          <div>
            <p className="text-xs font-bold text-muted-foreground uppercase mb-1">Base Coverage</p>
            <p className="text-muted-foreground">{opponent_summary.base_coverage}</p>
          </div>
        )}

        {/* Offensive Tendencies */}
        {opponent_summary.offensive_tendencies && (
          <div>
            <p className="text-xs font-bold text-muted-foreground uppercase mb-1 flex items-center gap-1">
              <Sword className="h-3.5 w-3.5" /> Offensive Tendencies
            </p>
            <p className="text-muted-foreground">{opponent_summary.offensive_tendencies}</p>
          </div>
        )}

        {/* Defensive Tendencies */}
        {opponent_summary.defensive_tendencies && (
          <div>
            <p className="text-xs font-bold text-muted-foreground uppercase mb-1 flex items-center gap-1">
              <Shield className="h-3.5 w-3.5" /> Defensive Tendencies
            </p>
            <p className="text-muted-foreground">{opponent_summary.defensive_tendencies}</p>
          </div>
        )}

        {/* Blitz Tendencies */}
        {opponent_summary.blitz_tendencies && (
          <div>
            <p className="text-xs font-bold text-muted-foreground uppercase mb-1 flex items-center gap-1">
              <Zap className="h-3.5 w-3.5" /> Blitz Tendencies
            </p>
            <p className="text-muted-foreground">{opponent_summary.blitz_tendencies}</p>
          </div>
        )}

        {/* Strengths */}
        {opponent_summary.strengths && (
          <div>
            <p className="text-xs font-bold text-muted-foreground uppercase mb-1 flex items-center gap-1">
              <TrendingUp className="h-3.5 w-3.5 text-emerald-500" /> Strengths
            </p>
            <p className="text-muted-foreground">{opponent_summary.strengths}</p>
          </div>
        )}

        {/* Weaknesses */}
        {opponent_summary.weaknesses && (
          <div>
            <p className="text-xs font-bold text-muted-foreground uppercase mb-1 flex items-center gap-1">
              <AlertTriangle className="h-3.5 w-3.5 text-amber-500" /> Exploitable Weaknesses
            </p>
            <p className="text-emerald-600 dark:text-emerald-400 font-medium">{opponent_summary.weaknesses}</p>
          </div>
        )}

        {/* Key Matchups */}
        {opponent_summary.key_exploitable_matchups && (
          <div className="pt-3 border-t border-border">
            <p className="text-xs font-bold text-muted-foreground uppercase mb-1 flex items-center gap-1">
              <Target className="h-3.5 w-3.5 text-primary" /> Key Matchups
            </p>
            <p className="text-muted-foreground">{opponent_summary.key_exploitable_matchups}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}