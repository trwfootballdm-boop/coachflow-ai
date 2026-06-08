import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, MapPin, Shield } from "lucide-react";
import { format } from 'date-fns';

export default function UpcomingGame({ team }) {
  if (!team?.upcoming_opponent) {
    return (
      <Card className="border-0 shadow-sm bg-gradient-to-br from-primary/5 to-primary/10">
        <CardContent className="p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Calendar className="h-5 w-5 text-primary" />
            </div>
            <h3 className="font-display font-semibold">Next Game</h3>
          </div>
          <p className="text-sm text-muted-foreground">No upcoming game scheduled. Update your team settings to add one.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 shadow-sm bg-gradient-to-br from-primary/5 to-primary/10">
      <CardContent className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-primary/10">
            <Shield className="h-5 w-5 text-primary" />
          </div>
          <h3 className="font-display font-semibold">Next Game</h3>
        </div>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-2xl font-display font-bold">{team.name}</span>
            <span className="text-muted-foreground font-medium">vs</span>
            <span className="text-2xl font-display font-bold">{team.upcoming_opponent}</span>
          </div>
          {team.next_game_date && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              {format(new Date(team.next_game_date), 'EEEE, MMM d, yyyy')}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}