import React, { createContext, useContext } from 'react';
import { useFavoriteMoves } from '../hooks/useFavoriteMoves';
import { useFavoriteOracles } from '../hooks/useFavoriteOracles';

const FavoritesContext = createContext();

export const FavoritesProvider = ({ children }) => {
  const movesState = useFavoriteMoves();
  const oraclesState = useFavoriteOracles();
  
  const value = {
    // Moves favorites
    favoritedMoves: movesState.favoritedMoves,
    editingFavorites: movesState.editingFavorites,
    tempFavoriteOrder: movesState.tempFavoriteOrder,
    draggedIndex: movesState.draggedIndex,
    toggleFavoriteMove: movesState.toggleFavoriteMove,
    startEditingFavorites: movesState.startEditingFavorites,
    saveFavoriteOrder: movesState.saveFavoriteOrder,
    cancelEditingFavorites: movesState.cancelEditingFavorites,
    handleDragStart: movesState.handleDragStart,
    handleDragOver: movesState.handleDragOver,
    handleDragEnd: movesState.handleDragEnd,
    isFavorited: movesState.isFavorited,
    
    // Oracles favorites
    favoritedOracles: oraclesState.favoritedOracles,
    editingOracleFavorites: oraclesState.editingOracleFavorites,
    tempOracleFavoriteOrder: oraclesState.tempOracleFavoriteOrder,
    oracleDraggedIndex: oraclesState.oracleDraggedIndex,
    toggleFavoriteOracle: oraclesState.toggleFavoriteOracle,
    startEditingOracleFavorites: oraclesState.startEditingOracleFavorites,
    saveOracleFavoriteOrder: oraclesState.saveOracleFavoriteOrder,
    cancelEditingOracleFavorites: oraclesState.cancelEditingOracleFavorites,
    handleOracleDragStart: oraclesState.handleOracleDragStart,
    handleOracleDragOver: oraclesState.handleOracleDragOver,
    handleOracleDragEnd: oraclesState.handleOracleDragEnd,
    isOracleFavorited: oraclesState.isOracleFavorited,
  };
  
  return (
    <FavoritesContext.Provider value={value}>
      {children}
    </FavoritesContext.Provider>
  );
};

export const useFavoritesContext = () => {
  const context = useContext(FavoritesContext);
  if (!context) {
    throw new Error('useFavoritesContext must be used within a FavoritesProvider');
  }
  return context;
};
