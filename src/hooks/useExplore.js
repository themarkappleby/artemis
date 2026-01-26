import { useState } from 'react';

export const useExplore = () => {
  // Sectors state
  const [sectors, setSectors] = useState([]);
  
  // Factions state
  const [factions, setFactions] = useState([]);

  const addSector = (name, region) => {
    const newSector = {
      id: Date.now(),
      name: name.trim(),
      region
    };
    setSectors(prev => [...prev, newSector]);
    return newSector;
  };

  const removeSector = (sectorId) => {
    setSectors(prev => prev.filter(s => s.id !== sectorId));
  };

  const getSector = (sectorId) => {
    return sectors.find(s => s.id === sectorId);
  };

  const addFaction = (name) => {
    const newFaction = {
      id: Date.now(),
      name: name.trim()
    };
    setFactions(prev => [...prev, newFaction]);
    return newFaction;
  };

  const removeFaction = (factionId) => {
    setFactions(prev => prev.filter(f => f.id !== factionId));
  };

  const getFaction = (factionId) => {
    return factions.find(f => f.id === factionId);
  };

  return {
    sectors,
    factions,
    addSector,
    removeSector,
    getSector,
    addFaction,
    removeFaction,
    getFaction
  };
};
