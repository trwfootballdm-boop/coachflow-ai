import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import ProtectedRoute from '@/components/ProtectedRoute';
import { TeamProvider } from '@/components/TeamContext';

// Auth pages
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import ForgotPassword from '@/pages/ForgotPassword';
import ResetPassword from '@/pages/ResetPassword';

// Layout
import AppLayout from '@/components/layout/AppLayout';

// Pages
import Dashboard from '@/pages/Dashboard';
import PlayDesigner from '@/pages/PlayDesigner';
import PlayLibrary from '@/pages/PlayLibrary';
import GamePlanning from '@/pages/GamePlanning';
import PracticeScripts from '@/pages/PracticeScripts';
import ScoutCards from '@/pages/ScoutCards';
import Wristband from '@/pages/Wristband';
import InstallSheets from '@/pages/InstallSheets';
import Scouting from '@/pages/Scouting';
import Roster from '@/pages/Roster';
import Terminology from '@/pages/Terminology';
import Settings from '@/pages/Settings';
import PlaybookLibrary from '@/pages/PlaybookLibrary';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-display font-bold text-lg">CF</span>
          </div>
          <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      navigateToLogin();
      return null;
    }
  }

  return (
    <TeamProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        <Route element={<ProtectedRoute unauthenticatedElement={<Navigate to="/login" replace />} />}>
          <Route element={<AppLayout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/play-designer" element={<PlayDesigner />} />
            <Route path="/play-library" element={<PlayLibrary />} />
            <Route path="/game-planning" element={<GamePlanning />} />
            <Route path="/practice-scripts" element={<PracticeScripts />} />
            <Route path="/scout-cards" element={<ScoutCards />} />
            <Route path="/wristband" element={<Wristband />} />
            <Route path="/install-sheets" element={<InstallSheets />} />
            <Route path="/scouting" element={<Scouting />} />
            <Route path="/roster" element={<Roster />} />
            <Route path="/terminology" element={<Terminology />} />
            <Route path="/playbook-library" element={<PlaybookLibrary />} />
            <Route path="/settings" element={<Settings />} />
          </Route>
        </Route>

        <Route path="*" element={<PageNotFound />} />
      </Routes>
    </TeamProvider>
  );
};

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App