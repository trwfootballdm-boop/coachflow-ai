import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Rows3, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Wristband() {
  return (
    <div className="space-y-6 max-w-7xl">
      <div>
        <h1 className="text-2xl font-display font-bold">Wristband Generator</h1>
        <p className="text-sm text-muted-foreground">Create play call wristbands from your game plan</p>
      </div>

      <Card className="border-0 shadow-sm">
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <div className="p-4 rounded-2xl bg-accent/10 mb-4">
            <Rows3 className="h-8 w-8 text-accent" />
          </div>
          <h3 className="text-lg font-display font-semibold mb-2">Wristband Generator</h3>
          <p className="text-muted-foreground text-sm max-w-md mb-6">
            Select a game plan, and automatically generate printable wristband sheets with play calls organized by situation.
          </p>
          <Button className="gap-2 rounded-xl">
            <Sparkles className="h-4 w-4" />
            Generate Wristband
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}