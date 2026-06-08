import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { BookOpen } from "lucide-react";

export default function Terminology() {
  return (
    <div className="space-y-6 max-w-7xl">
      <div>
        <h1 className="text-2xl font-display font-bold">Terminology & System Settings</h1>
        <p className="text-sm text-muted-foreground">Define your team's football terminology and naming conventions</p>
      </div>

      <Card className="border-0 shadow-sm">
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <div className="p-4 rounded-2xl bg-secondary mb-4">
            <BookOpen className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-display font-semibold mb-2">System Terminology</h3>
          <p className="text-muted-foreground text-sm max-w-md">
            Define custom route names, formation labels, play call syntax, and terminology that matches your coaching system. This ensures consistent naming across your playbook.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}