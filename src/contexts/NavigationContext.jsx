import React, { createContext, useContext } from 'react';
import { useNavigation } from '../hooks/useNavigation';

const NavigationContext = createContext();

export const NavigationProvider = ({ children }) => {
  const navigationState = useNavigation();
  
  return (
    <NavigationContext.Provider value={navigationState}>
      {children}
    </NavigationContext.Provider>
  );
};

export const useNavigationContext = () => {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error('useNavigationContext must be used within a NavigationProvider');
  }
  return context;
};
