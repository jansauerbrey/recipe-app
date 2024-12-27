import React, { createContext, useState, useContext, useEffect } from 'react';

interface NavigationTitleContextType {
  title: string;
  setTitle: (title: string) => void;
}

const NavigationTitleContext = createContext<NavigationTitleContextType>({
  title: '',
  setTitle: () => {},
});

export function useNavigationTitle() {
  return useContext(NavigationTitleContext);
}

export function NavigationTitleProvider({ children }: { children: React.ReactNode }) {
  const [title, setTitle] = useState('');

  // Update document title when title changes
  useEffect(() => {
    if (title) {
      document.title = `${title} - Rezept Planer`;
    } else {
      document.title = 'Rezept Planer';
    }
  }, [title]);

  const value = {
    title,
    setTitle,
  };

  return (
    <NavigationTitleContext.Provider value={value}>
      {children}
    </NavigationTitleContext.Provider>
  );
}
