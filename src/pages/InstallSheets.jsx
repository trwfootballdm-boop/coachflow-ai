import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function InstallSheets() {
  return (
    <div className="space-y-6 max-w-7xl">
      <div>
        <h1 className="text-2xl font-display font-bold">Install Sheets</h1>
        <p className="text-sm text-muted-foreground">Weekly play installation tracking and scheduling</p>
      </div>

      <Card className="border-0 shadow-sm">
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <div className="p-4 rounded-2xl bg-blue-500/10 mb-4">
            <Calendar className="h-8 w-8 text-blue-500" />
          </div>
          <h3 className="text-lg font-display font-semibold mb-2">Install Sheet Builder</h3>
          <p className="text-muted-foreground text-sm max-w-md mb-6">
            Organize which plays to install each week. Track what your team has repped and what still needs practice time.
          </p>
          <Button className="gap-2 rounded-xl">
            <Sparkles className="h-4 w-4" />
            Create Install Sheet
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}