import React, { createContext, useContext } from 'react';
import { useExplore } from '../hooks/useExplore';

const ExploreContext = createContext();

export const ExploreProvider = ({ children }) => {
  const exploreState = useExplore();
  
  return (
    <ExploreContext.Provider value={exploreState}>
      {children}
    </ExploreContext.Provider>
  );
};

export const useExploreContext = () => {
  const context = useContext(ExploreContext);
  if (!context) {
    throw new Error('useExploreContext must be used within an ExploreProvider');
  }
  return context;
};
