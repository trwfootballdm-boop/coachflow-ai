import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { PenTool, ClipboardList, FileText, Plus } from "lucide-react";

const actions = [
  { label: 'New Play', icon: PenTool, path: '/play-designer', color: 'bg-primary hover:bg-primary/90 text-primary-foreground' },
  { label: 'New Game Plan', icon: ClipboardList, path: '/game-planning', color: 'bg-secondary hover:bg-secondary/80 text-foreground' },
  { label: 'New Practice', icon: FileText, path: '/practice-scripts', color: 'bg-secondary hover:bg-secondary/80 text-foreground' },
];

export default function QuickActions() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-wrap gap-3">
      {actions.map((action) => (
        <Button
          key={action.label}
          onClick={() => navigate(action.path)}
          className={`gap-2 h-10 px-5 rounded-xl font-semibold ${action.color}`}
        >
          <action.icon className="h-4 w-4" />
          {action.label}
        </Button>
      ))}
    </div>
  );
}