import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Target, Shield, TrendingUp, Zap, AlertTriangle,
  CheckCircle2, ArrowRight, FileText, ClipboardList, Loader2
} from "lucide-react";

export default function PlanReviewPanel({ title, icon, plan, type, onPushToPractice, onPushToGamePlan }) {
  const playLists = {
    offense: [
      { key: 'core_play_ids', label: 'Core Plays', icon: Target },
      { key: 'complementary_play_ids', label: 'Complementary', icon: TrendingUp },
      { key: 'opener_play_ids', label: 'Openers', icon: Zap },
      { key: 'red_zone_plan', label: 'Red Zone', icon: Shield },
      { key: 'short_yardage_plan', label: 'Short Yardage', icon: Target },
      { key: 'backed_up_plan', label: 'Backed Up', icon: AlertTriangle },
    ],
    defense: [
      { key: 'base_front_play_ids', label: 'Base Fronts', icon: Shield },
      { key: 'pressure_packages', label: 'Pressure', icon: Zap },
      { key: 'red_zone_defense', label: 'Red Zone D', icon: Target },
      { key: 'third_down_calls', label: '3rd Down', icon: TrendingUp },
    ],
  };

  const currentLists = playLists[type] || [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {icon}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Play Lists */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {currentLists.map(({ key, label, icon: Icon }) => {
            const plays = plan[key] || [];
            if (!plays || plays.length === 0) return null;
            
            return (
              <div key={key} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-semibold">{label}</span>
                  </div>
                  <Badge variant="secondary" className="text-[10px]">
                    {plays.length} {plays.length === 1 ? 'play' : 'plays'}
                  </Badge>
                </div>
                <ul className="space-y-1">
                  {plays.map((play, idx) => (
                    <li key={idx} className="text-sm text-muted-foreground flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-primary/50" />
                      {typeof play === 'string' ? play : `Play #${play}`}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>

        {/* Practice Emphasis */}
        {plan.practice_emphasis && (
          <div className="pt-4 border-t border-border">
            <p className="text-xs font-bold text-muted-foreground uppercase mb-2 flex items-center gap-1">
              <Target className="h-3.5 w-3.5 text-primary" /> Practice Emphasis
            </p>
            <p className="text-sm text-muted-foreground">{plan.practice_emphasis}</p>
          </div>
        )}

        {/* Coaching Points */}
        {plan.coaching_points && (
          <div>
            <p className="text-xs font-bold text-muted-foreground uppercase mb-2 flex items-center gap-1">
              <Zap className="h-3.5 w-3.5 text-amber-500" /> Coaching Points
            </p>
            <p className="text-sm text-muted-foreground">{plan.coaching_points}</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center gap-3 pt-4 border-t border-border">
          <Button 
            onClick={onPushToPractice} 
            size="sm" 
            className="gap-2"
          >
            <FileText className="h-4 w-4" />
            Push to Practice
          </Button>
          <Button 
            onClick={onPushToGamePlan} 
            size="sm" 
            variant="outline"
            className="gap-2"
          >
            <ClipboardList className="h-4 w-4" />
            Push to Game Plan
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}