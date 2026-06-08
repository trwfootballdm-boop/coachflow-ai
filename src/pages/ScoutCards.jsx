import React from 'react';
import { useTeam } from '@/components/TeamContext';
import { Card, CardContent } from "@/components/ui/card";
import { Shield, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ScoutCards() {
  return (
    <div className="space-y-6 max-w-7xl">
      <div>
        <h1 className="text-2xl font-display font-bold">Scout Cards</h1>
        <p className="text-sm text-muted-foreground">Generate scout team cards from opponent scouting data</p>
      </div>

      <Card className="border-0 shadow-sm">
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <div className="p-4 rounded-2xl bg-primary/10 mb-4">
            <Shield className="h-8 w-8 text-primary" />
          </div>
          <h3 className="text-lg font-display font-semibold mb-2">Scout Card Generator</h3>
          <p className="text-muted-foreground text-sm max-w-md mb-6">
            Add opponent scouting data first, then use AI to automatically generate scout cards for your scout team to run in practice.
          </p>
          <Button className="gap-2 rounded-xl">
            <Sparkles className="h-4 w-4" />
            Generate Scout Cards
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}