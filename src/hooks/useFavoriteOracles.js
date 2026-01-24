import { useState } from 'react';

export const useFavoriteOracles = () => {
  const [favoritedOracles, setFavoritedOracles] = useState([]);
  const [editingFavorites, setEditingFavorites] = useState(false);
  const [tempFavoriteOrder, setTempFavoriteOrder] = useState([]);
  const [draggedIndex, setDraggedIndex] = useState(null);

  const toggleFavoriteOracle = (oracleId) => {
    setFavoritedOracles(prev => {
      if (prev.includes(oracleId)) {
        return prev.filter(id => id !== oracleId);
      } else {
        return [...prev, oracleId];
      }
    });
  };

  const startEditingFavorites = () => {
    setTempFavoriteOrder([...favoritedOracles]);
    setEditingFavorites(true);
  };

  const saveFavoriteOrder = () => {
    setFavoritedOracles(tempFavoriteOrder);
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

  const isOracleFavorited = (oracleId) => {
    return favoritedOracles.includes(oracleId);
  };

  return {
    favoritedOracles,
    editingOracleFavorites: editingFavorites,
    tempOracleFavoriteOrder: tempFavoriteOrder,
    oracleDraggedIndex: draggedIndex,
    toggleFavoriteOracle,
    startEditingOracleFavorites: startEditingFavorites,
    saveOracleFavoriteOrder: saveFavoriteOrder,
    cancelEditingOracleFavorites: cancelEditingFavorites,
    handleOracleDragStart: handleDragStart,
    handleOracleDragOver: handleDragOver,
    handleOracleDragEnd: handleDragEnd,
    isOracleFavorited
  };
};
