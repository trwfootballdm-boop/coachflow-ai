import React from 'react';
import { Card } from "@/components/ui/card";
import { Library, FileText, Star, Shield } from "lucide-react";
import { cn } from "@/lib/utils";

const stats = [
  { label: 'Total Plays', icon: Library, key: 'totalPlays', color: 'text-primary' },
  { label: 'Game Plans', icon: FileText, key: 'gamePlans', color: 'text-accent' },
  { label: 'Favorites', icon: Star, key: 'favorites', color: 'text-amber-500' },
  { label: 'Scout Reports', icon: Shield, key: 'scoutReports', color: 'text-blue-500' },
];

export default function QuickStats({ data }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat) => (
        <Card key={stat.key} className="p-5 border-0 bg-card shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground font-medium">{stat.label}</p>
              <p className="text-3xl font-display font-bold mt-1">
                {data?.[stat.key] ?? 0}
              </p>
            </div>
            <div className={cn("p-2.5 rounded-xl bg-secondary", stat.color)}>
              <stat.icon className="h-5 w-5" />
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}