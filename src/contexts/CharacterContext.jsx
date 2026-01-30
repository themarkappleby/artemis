import React, { createContext, useContext } from 'react';
import { useCharacter } from '../hooks/useCharacter';

const CharacterContext = createContext();

export const CharacterProvider = ({ children }) => {
  const characterState = useCharacter();
  
  return (
    <CharacterContext.Provider value={characterState}>
      {children}
    </CharacterContext.Provider>
  );
};

export const useCharacterContext = () => {
  const context = useContext(CharacterContext);
  if (!context) {
    throw new Error('useCharacterContext must be used within a CharacterProvider');
  }
  return context;
};
