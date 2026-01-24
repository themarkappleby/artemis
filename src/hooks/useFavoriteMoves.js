import { useState } from 'react';

export const useFavoriteMoves = () => {
  const [favoritedMoves, setFavoritedMoves] = useState([]);
  const [editingFavorites, setEditingFavorites] = useState(false);
  const [tempFavoriteOrder, setTempFavoriteOrder] = useState([]);
  const [draggedIndex, setDraggedIndex] = useState(null);

  const toggleFavoriteMove = (catIndex, moveIndex) => {
    const moveId = `${catIndex}-${moveIndex}`;
    setFavoritedMoves(prev => {
      if (prev.includes(moveId)) {
        return prev.filter(id => id !== moveId);
      } else {
        return [...prev, moveId];
      }
    });
  };

  const startEditingFavorites = () => {
    setTempFavoriteOrder([...favoritedMoves]);
    setEditingFavorites(true);
  };

  const saveFavoriteOrder = () => {
    setFavoritedMoves(tempFavoriteOrder);
    setEditingFavorites(false);
    setTempFavoriteOrder([]);
  };

  const cancelEditingFavorites = () => {
    setEditingFavorites(false);
    setTempFavoriteOrder([]);
    setDraggedIndex(null);
  };

  const handleDragStart = (index) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const newOrder = [...tempFavoriteOrder];
    const draggedItem = newOrder[draggedIndex];
    newOrder.splice(draggedIndex, 1);
    newOrder.splice(index, 0, draggedItem);

    setTempFavoriteOrder(newOrder);
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const isFavorited = (catIndex, moveIndex) => {
    return favoritedMoves.includes(`${catIndex}-${moveIndex}`);
  };

  return {
    favoritedMoves,
    editingFavorites,
    tempFavoriteOrder,
    draggedIndex,
    toggleFavoriteMove,
    startEditingFavorites,
    saveFavoriteOrder,
    cancelEditingFavorites,
    handleDragStart,
    handleDragOver,
    handleDragEnd,
    isFavorited
  };
};
