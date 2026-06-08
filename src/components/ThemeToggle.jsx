import React, { useEffect, useState } from 'react';
import { Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";

function getInitialTheme() {
  if (typeof window === 'undefined') return false;

  const savedTheme = localStorage.getItem('theme');
  if (savedTheme === 'dark') return true;
  if (savedTheme === 'light') return false;

  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

export default function ThemeToggle({ className }) {
  const [dark, setDark] = useState(getInitialTheme);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    localStorage.setItem('theme', dark ? 'dark' : 'light');
  }, [dark]);

  return (
    <button
      type="button"
      role="switch"
      aria-checked={dark}
      aria-label="Toggle dark mode"
      onClick={() => setDark((prev) => !prev)}
      className={cn(
        "inline-flex h-10 items-center gap-1 rounded-xl border border-sidebar-border/70 bg-sidebar-accent/35 p-1 text-sidebar-foreground transition-colors hover:bg-sidebar-accent/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring",
        className
      )}
    >
      <span
        className={cn(
          "inline-flex h-8 items-center gap-1 rounded-lg px-2 text-xs font-semibold transition-colors",
          !dark && "bg-sidebar-primary text-sidebar-primary-foreground"
        )}
      >
        <Sun className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">Light</span>
      </span>

      <span
        className={cn(
          "inline-flex h-8 items-center gap-1 rounded-lg px-2 text-xs font-semibold transition-colors",
          dark && "bg-sidebar-primary text-sidebar-primary-foreground"
        )}
      >
        <Moon className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">Dark</span>
      </span>
    </button>
  );
}