import React, { createContext, useContext, useState, useEffect } from 'react';

const TeamContext = createContext(null);

export function TeamProvider({ children }) {
  const [activeTeamId, setActiveTeamId] = useState(() => {
    return localStorage.getItem('activeTeamId') || null;
  });

  useEffect(() => {
    if (activeTeamId) {
      localStorage.setItem('activeTeamId', activeTeamId);
    }
  }, [activeTeamId]);

  return (
    <TeamContext.Provider value={{ activeTeamId, setActiveTeamId }}>
      {children}
    </TeamContext.Provider>
  );
}

export function useTeam() {
  const ctx = useContext(TeamContext);
  if (!ctx) throw new Error('useTeam must be used within TeamProvider');
  return ctx;
}