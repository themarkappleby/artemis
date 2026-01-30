import React, { createContext, useContext } from 'react';
import { useRoll } from '../hooks/useRoll';
import { useCharacterContext } from './CharacterContext';
import { useStarforgedContext } from './StarforgedContext';

const RollContext = createContext();

export const RollProvider = ({ children }) => {
  const { character, updateCondition } = useCharacterContext();
  const { data: starforgedData } = useStarforgedContext();
  const rollState = useRoll(character, updateCondition, starforgedData);
  
  return (
    <RollContext.Provider value={rollState}>
      {children}
    </RollContext.Provider>
  );
};

export const useRollContext = () => {
  const context = useContext(RollContext);
  if (!context) {
    throw new Error('useRollContext must be used within a RollProvider');
  }
  return context;
};
