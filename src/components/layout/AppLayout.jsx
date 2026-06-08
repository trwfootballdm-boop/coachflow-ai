import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import TopBar from './TopBar';
import AppSidebar from './Sidebar';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';

const PAGE_META = {
  '/': {
    eyebrow: 'Overview',
    title: 'Dashboard',
    subtitle: 'Track installs, prep the week, and keep your staff aligned.',
  },
  '/play-designer': {
    eyebrow: 'Playbook',
    title: 'Play Designer',
    subtitle: 'Build, tag, and organize your concepts with formation-level clarity.',
  },
  '/play-library': {
    eyebrow: 'Playbook',
    title: 'Play Library',
    subtitle: 'Search your calls, concepts, and tags across the full system.',
  },
  '/game-planning': {
    eyebrow: 'Game Week',
    title: 'Game Planning',
    subtitle: 'Turn opponent data and tendencies into a cleaner call sheet.',
  },
  '/practice-scripts': {
    eyebrow: 'Install',
    title: 'Practice Scripts',
    subtitle: 'Sequence reps with purpose and make every period accountable.',
  },
  '/scout-cards': {
    eyebrow: 'Scouting',
    title: 'Scout Cards',
    subtitle: 'Package opponent looks into player-ready visuals.',
  },
  '/weekly-install': {
    eyebrow: 'Install',
    title: 'Weekly Install Planner',
    subtitle: 'Map the week, balance volume, and keep staff communication tight.',
  },
};

export default function AppLayout() {
  const location = useLocation();
  const meta = PAGE_META[location.pathname] ?? {
    eyebrow: 'CoachFlow',
    title: 'Operations',
    subtitle: 'Manage the full football workflow from design to game day.',
  };

  return (
    <SidebarProvider defaultOpen>
      <div className="app-shell flex min-h-screen w-full bg-background">
        <AppSidebar />
        <SidebarInset className="bg-transparent">
          <TopBar />
          <main className="page-shell">
            <section className="page-header">
              <div>
                <div className="page-eyebrow">{meta.eyebrow}</div>
                <h1 className="page-title text-balance">{meta.title}</h1>
                <p className="page-subtitle">{meta.subtitle}</p>
              </div>

              <div className="page-actions">
                <div className="team-chip">Staff workflow</div>
                <div className="team-chip">Game-week ready</div>
              </div>
            </section>

            <div className="min-w-0">
              <Outlet />
            </div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}