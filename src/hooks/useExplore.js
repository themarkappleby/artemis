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
      region,
      locations: []
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

  const addLocation = (sectorId, name, type = 'planet', data = {}) => {
    const newLocation = {
      id: Date.now(),
      name: name.trim(),
      type,
      ...data
    };
    setSectors(prev => prev.map(sector => {
      if (sector.id === sectorId) {
        return {
          ...sector,
          locations: [...(sector.locations || []), newLocation]
        };
      }
      return sector;
    }));
    return newLocation;
  };

  const getLocation = (sectorId, locationId) => {
    const sector = sectors.find(s => s.id === sectorId);
    if (!sector?.locations) return null;
    return sector.locations.find(l => l.id === locationId);
  };

  const removeLocation = (sectorId, locationId) => {
    setSectors(prev => prev.map(sector => {
      if (sector.id === sectorId) {
        return {
          ...sector,
          locations: (sector.locations || []).filter(l => l.id !== locationId)
        };
      }
      return sector;
    }));
  };

  return {
    sectors,
    factions,
    addSector,
    removeSector,
    getSector,
    addFaction,
    removeFaction,
    getFaction,
    addLocation,
    getLocation,
    removeLocation
  };
};
