import React, { createContext, useContext } from 'react';
import { useStarforged } from '../hooks/useStarforged';

const StarforgedContext = createContext();

export const StarforgedProvider = ({ children }) => {
  const starforgedState = useStarforged();
  
  return (
    <StarforgedContext.Provider value={starforgedState}>
      {children}
    </StarforgedContext.Provider>
  );
};

export const useStarforgedContext = () => {
  const context = useContext(StarforgedContext);
  if (!context) {
    throw new Error('useStarforgedContext must be used within a StarforgedProvider');
  }
  return context;
};
