import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, ArrowRight } from "lucide-react";
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const playTypeColors = {
  run: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  pass: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
  screen: 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
  play_action: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  rpo: 'bg-orange-500/10 text-orange-600 dark:text-orange-400',
  trick: 'bg-pink-500/10 text-pink-600 dark:text-pink-400',
  special_teams: 'bg-gray-500/10 text-gray-600 dark:text-gray-400',
};

export default function RecentPlays({ plays = [] }) {
  const navigate = useNavigate();

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="text-base font-display font-semibold">Recent Plays</CardTitle>
        <Button variant="ghost" size="sm" onClick={() => navigate('/play-library')} className="gap-1 text-xs">
          View All <ArrowRight className="h-3 w-3" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-2">
        {plays.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-sm">
            <p>No plays yet. Create your first play!</p>
          </div>
        ) : (
          plays.slice(0, 6).map((play) => (
            <div
              key={play.id}
              onClick={() => navigate(`/play-designer?id=${play.id}`)}
              className="flex items-center gap-3 p-3 rounded-xl hover:bg-secondary/60 cursor-pointer transition-colors group"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm truncate">{play.name}</span>
                  {play.is_favorite && <Star className="h-3 w-3 text-amber-500 fill-amber-500 shrink-0" />}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  {play.play_type && (
                    <Badge variant="secondary" className={cn("text-[10px] px-2 py-0", playTypeColors[play.play_type])}>
                      {play.play_type.replace('_', ' ')}
                    </Badge>
                  )}
                  {play.formation && (
                    <span className="text-xs text-muted-foreground truncate">{play.formation}</span>
                  )}
                </div>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}