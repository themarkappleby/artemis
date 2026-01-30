import React, { createContext, useContext } from 'react';
import { useOracle } from '../hooks/useOracle';
import { useStarforgedContext } from './StarforgedContext';

const OracleContext = createContext();

export const OracleProvider = ({ children }) => {
  const { data: starforgedData } = useStarforgedContext();
  const oracleState = useOracle(starforgedData);
  
  return (
    <OracleContext.Provider value={oracleState}>
      {children}
    </OracleContext.Provider>
  );
};

export const useOracleContext = () => {
  const context = useContext(OracleContext);
  if (!context) {
    throw new Error('useOracleContext must be used within an OracleProvider');
  }
  return context;
};
