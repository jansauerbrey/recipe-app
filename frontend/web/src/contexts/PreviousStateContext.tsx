import React, { createContext, useState, useContext, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

interface PreviousState {
  pathname: string;
  search: string;
  hash: string;
}

interface PreviousStateContextType {
  previousState: PreviousState | null;
  setPreviousState: (state: PreviousState | null) => void;
}

const PreviousStateContext = createContext<PreviousStateContextType>({
  previousState: null,
  setPreviousState: () => {},
});

export function usePreviousState() {
  return useContext(PreviousStateContext);
}

export function PreviousStateProvider({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const [previousState, setPreviousState] = useState<PreviousState | null>(null);

  // Update previous state when location changes
  useEffect(() => {
    setPreviousState({
      pathname: location.pathname,
      search: location.search,
      hash: location.hash,
    });
  }, [location]);

  const value = {
    previousState,
    setPreviousState,
  };

  return (
    <PreviousStateContext.Provider value={value}>
      {children}
    </PreviousStateContext.Provider>
  );
}
