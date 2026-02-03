import { useState } from 'react';
import {
  getSettlementCountForRegion,
  rollSettlementOracle,
  generateSettlementData,
  generatePlanetData,
  generateCharacterData,
  getCharacterCountForPopulation,
  rollSectorTrouble,
  rollStellarObject,
  generateSectorName
} from '../utils/oracleRollers';

// Generate unique IDs that won't collide even in tight loops
// Using underscore separator since hyphens are used in URL routing
const generateUniqueId = (() => {
  let counter = 0;
  return () => {
    counter += 1;
    return `${Date.now()}_${counter}_${Math.random().toString(36).substr(2, 9)}`;
  };
})();

export const useExplore = () => {
  // Sectors state
  const [sectors, setSectors] = useState([]);
  
  // Factions state
  const [factions, setFactions] = useState([]);

  const addSector = (name, region, data = {}) => {
    const newSector = {
      id: generateUniqueId(),
      name: name.trim(),
      region,
      locations: [],
      ...data
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
      id: generateUniqueId(),
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
      id: generateUniqueId(),
      name: name.trim(),
      type,
      subLocations: [],
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

  const addSubLocation = (sectorId, locationId, name, type, placement, data = {}) => {
    const newSubLocation = {
      id: generateUniqueId(),
      name: name.trim(),
      type,
      placement, // 'orbit' or 'planetside'
      ...data
    };
    setSectors(prev => prev.map(sector => {
      if (sector.id === sectorId) {
        return {
          ...sector,
          locations: (sector.locations || []).map(location => {
            if (location.id === locationId) {
              return {
                ...location,
                subLocations: [...(location.subLocations || []), newSubLocation]
              };
            }
            return location;
          })
        };
      }
      return sector;
    }));
    return newSubLocation;
  };

  const getSubLocation = (sectorId, locationId, subLocationId) => {
    const location = getLocation(sectorId, locationId);
    if (!location?.subLocations) return null;
    return location.subLocations.find(sl => sl.id === subLocationId);
  };

  const removeSubLocation = (sectorId, locationId, subLocationId) => {
    setSectors(prev => prev.map(sector => {
      if (sector.id === sectorId) {
        return {
          ...sector,
          locations: (sector.locations || []).map(location => {
            if (location.id === locationId) {
              return {
                ...location,
                subLocations: (location.subLocations || []).filter(sl => sl.id !== subLocationId)
              };
            }
            return location;
          })
        };
      }
      return sector;
    }));
  };

  // Add a nested entity to a subLocation (e.g., entities onboard a starship)
  const addNestedEntity = (sectorId, locationId, subLocationId, name, type, data = {}) => {
    const newEntity = {
      id: generateUniqueId(),
      name: name.trim(),
      type,
      ...data
    };
    setSectors(prev => prev.map(sector => {
      if (sector.id === sectorId) {
        return {
          ...sector,
          locations: (sector.locations || []).map(location => {
            if (location.id === locationId) {
              return {
                ...location,
                subLocations: (location.subLocations || []).map(subLocation => {
                  if (subLocation.id === subLocationId) {
                    return {
                      ...subLocation,
                      nestedEntities: [...(subLocation.nestedEntities || []), newEntity]
                    };
                  }
                  return subLocation;
                })
              };
            }
            return location;
          })
        };
      }
      return sector;
    }));
    return newEntity;
  };

  const getNestedEntity = (sectorId, locationId, subLocationId, entityId) => {
    const subLocation = getSubLocation(sectorId, locationId, subLocationId);
    if (!subLocation?.nestedEntities) return null;
    return subLocation.nestedEntities.find(e => e.id === entityId);
  };

  const removeNestedEntity = (sectorId, locationId, subLocationId, entityId) => {
    setSectors(prev => prev.map(sector => {
      if (sector.id === sectorId) {
        return {
          ...sector,
          locations: (sector.locations || []).map(location => {
            if (location.id === locationId) {
              return {
                ...location,
                subLocations: (location.subLocations || []).map(subLocation => {
                  if (subLocation.id === subLocationId) {
                    return {
                      ...subLocation,
                      nestedEntities: (subLocation.nestedEntities || []).filter(e => e.id !== entityId)
                    };
                  }
                  return subLocation;
                })
              };
            }
            return location;
          })
        };
      }
      return sector;
    }));
  };

  // Add a nested entity directly to a location (e.g., entities onboard a starship location)
  const addLocationNestedEntity = (sectorId, locationId, name, type, data = {}) => {
    const newEntity = {
      id: generateUniqueId(),
      name: name.trim(),
      type,
      ...data
    };
    setSectors(prev => prev.map(sector => {
      if (sector.id === sectorId) {
        return {
          ...sector,
          locations: (sector.locations || []).map(location => {
            if (location.id === locationId) {
              return {
                ...location,
                nestedEntities: [...(location.nestedEntities || []), newEntity]
              };
            }
            return location;
          })
        };
      }
      return sector;
    }));
    return newEntity;
  };

  const getLocationNestedEntity = (sectorId, locationId, entityId) => {
    const location = getLocation(sectorId, locationId);
    if (!location?.nestedEntities) return null;
    return location.nestedEntities.find(e => e.id === entityId);
  };

  const removeLocationNestedEntity = (sectorId, locationId, entityId) => {
    setSectors(prev => prev.map(sector => {
      if (sector.id === sectorId) {
        return {
          ...sector,
          locations: (sector.locations || []).map(location => {
            if (location.id === locationId) {
              return {
                ...location,
                nestedEntities: (location.nestedEntities || []).filter(e => e.id !== entityId)
              };
            }
            return location;
          })
        };
      }
      return sector;
    }));
  };

  // Add a nested entity to a location's nested entity (e.g., entities onboard a nested starship)
  const addLocationNestedEntityChild = (sectorId, locationId, parentEntityId, name, type, data = {}) => {
    const newEntity = {
      id: generateUniqueId(),
      name: name.trim(),
      type,
      ...data
    };
    setSectors(prev => prev.map(sector => {
      if (sector.id === sectorId) {
        return {
          ...sector,
          locations: (sector.locations || []).map(location => {
            if (location.id === locationId) {
              return {
                ...location,
                nestedEntities: (location.nestedEntities || []).map(entity => {
                  if (entity.id === parentEntityId) {
                    return {
                      ...entity,
                      nestedEntities: [...(entity.nestedEntities || []), newEntity]
                    };
                  }
                  return entity;
                })
              };
            }
            return location;
          })
        };
      }
      return sector;
    }));
    return newEntity;
  };

  const getLocationNestedEntityChild = (sectorId, locationId, parentEntityId, childEntityId) => {
    const parentEntity = getLocationNestedEntity(sectorId, locationId, parentEntityId);
    if (!parentEntity?.nestedEntities) return null;
    return parentEntity.nestedEntities.find(e => e.id === childEntityId);
  };

  const removeLocationNestedEntityChild = (sectorId, locationId, parentEntityId, childEntityId) => {
    setSectors(prev => prev.map(sector => {
      if (sector.id === sectorId) {
        return {
          ...sector,
          locations: (sector.locations || []).map(location => {
            if (location.id === locationId) {
              return {
                ...location,
                nestedEntities: (location.nestedEntities || []).map(entity => {
                  if (entity.id === parentEntityId) {
                    return {
                      ...entity,
                      nestedEntities: (entity.nestedEntities || []).filter(e => e.id !== childEntityId)
                    };
                  }
                  return entity;
                })
              };
            }
            return location;
          })
        };
      }
      return sector;
    }));
  };

  // Add a nested entity to a sublocation's nested entity (e.g., entities onboard a nested starship)
  const addNestedEntityChild = (sectorId, locationId, subLocationId, parentEntityId, name, type, data = {}) => {
    const newEntity = {
      id: generateUniqueId(),
      name: name.trim(),
      type,
      ...data
    };
    setSectors(prev => prev.map(sector => {
      if (sector.id === sectorId) {
        return {
          ...sector,
          locations: (sector.locations || []).map(location => {
            if (location.id === locationId) {
              return {
                ...location,
                subLocations: (location.subLocations || []).map(subLocation => {
                  if (subLocation.id === subLocationId) {
                    return {
                      ...subLocation,
                      nestedEntities: (subLocation.nestedEntities || []).map(entity => {
                        if (entity.id === parentEntityId) {
                          return {
                            ...entity,
                            nestedEntities: [...(entity.nestedEntities || []), newEntity]
                          };
                        }
                        return entity;
                      })
                    };
                  }
                  return subLocation;
                })
              };
            }
            return location;
          })
        };
      }
      return sector;
    }));
    return newEntity;
  };

  const getNestedEntityChild = (sectorId, locationId, subLocationId, parentEntityId, childEntityId) => {
    const parentEntity = getNestedEntity(sectorId, locationId, subLocationId, parentEntityId);
    if (!parentEntity?.nestedEntities) return null;
    return parentEntity.nestedEntities.find(e => e.id === childEntityId);
  };

  const removeNestedEntityChild = (sectorId, locationId, subLocationId, parentEntityId, childEntityId) => {
    setSectors(prev => prev.map(sector => {
      if (sector.id === sectorId) {
        return {
          ...sector,
          locations: (sector.locations || []).map(location => {
            if (location.id === locationId) {
              return {
                ...location,
                subLocations: (location.subLocations || []).map(subLocation => {
                  if (subLocation.id === subLocationId) {
                    return {
                      ...subLocation,
                      nestedEntities: (subLocation.nestedEntities || []).map(entity => {
                        if (entity.id === parentEntityId) {
                          return {
                            ...entity,
                            nestedEntities: (entity.nestedEntities || []).filter(e => e.id !== childEntityId)
                          };
                        }
                        return entity;
                      })
                    };
                  }
                  return subLocation;
                })
              };
            }
            return location;
          })
        };
      }
      return sector;
    }));
  };

  // Auto-populate a sector with settlements based on region
  const populateSector = (sectorId, region, starforgedData) => {
    const settlementCount = getSettlementCountForRegion(region);
    
    for (let i = 0; i < settlementCount; i++) {
      // Roll on Settlement Location oracle to determine: Planetside, Orbital, or Deep Space
      const locationResult = rollSettlementOracle(starforgedData, 'Location');
      
      // Determine connection status:
      // - Last entity is always NOT connected (ensures at least one in "Not Connected" group)
      // - First 2 entities are connected (except Expanse which only has 2 total, so just 1 connected)
      // - Additional middle entities (if any) are randomly connected
      const isLastEntity = i === settlementCount - 1;
      const guaranteedConnectedCount = settlementCount === 2 ? 1 : 2;
      const isConnected = isLastEntity ? false : (i < guaranteedConnectedCount ? true : Math.random() < 0.5);
      
      // Normalize the location result
      const normalizedLocation = locationResult?.toLowerCase() || '';
      
      if (normalizedLocation.includes('deep space')) {
        // Deep Space: Add settlement directly to sector (no planet)
        const settlementData = generateSettlementData(starforgedData, region);
        const settlement = addLocation(sectorId, settlementData.settlementName || 'Settlement', 'settlement', {
          connected: isConnected,
          ...settlementData
        });
        
        // Add characters based on population
        if (settlement) {
          const characterCount = getCharacterCountForPopulation(settlementData.population);
          for (let c = 0; c < characterCount; c++) {
            const characterData = generateCharacterData(starforgedData);
            addLocationNestedEntity(
              sectorId,
              settlement.id,
              characterData.characterName || 'Character',
              'character',
              characterData
            );
          }
        }
      } else {
        // Planetside or Orbital: Generate a planet and add settlement to it
        const placement = normalizedLocation.includes('orbital') ? 'orbit' : 'planetside';
        
        // Generate a new planet (pass hasSettlement=true to ensure settlements detail isn't "None")
        const planetData = generatePlanetData(starforgedData, region, true);
        if (planetData) {
          const planetName = planetData.planetName || planetData.planetClass;
          const planet = addLocation(sectorId, planetName, 'planet', {
            connected: isConnected,
            ...planetData
          });
          
          if (planet) {
            // Add settlement to the planet (in orbit or planetside)
            const settlementData = generateSettlementData(starforgedData, region);
            // Remove the 'location' field since placement determines where it goes
            const { location: _, ...settlementDataWithoutLocation } = settlementData;
            
            const settlement = addSubLocation(
              sectorId,
              planet.id,
              settlementData.settlementName || 'Settlement',
              'settlement',
              placement,
              settlementDataWithoutLocation
            );
            
            // Add characters based on population
            if (settlement) {
              const characterCount = getCharacterCountForPopulation(settlementData.population);
              for (let c = 0; c < characterCount; c++) {
                const characterData = generateCharacterData(starforgedData);
                addNestedEntity(
                  sectorId,
                  planet.id,
                  settlement.id,
                  characterData.characterName || 'Character',
                  'character',
                  characterData
                );
              }
            }
            
            // If settlements detail indicates multiple settlements or conflict, add another settlement
            const settlementsLower = planetData.settlements?.toLowerCase() || '';
            if (settlementsLower.includes('multiple') || settlementsLower.includes('conflict')) {
              const secondPlacement = Math.random() < 0.5 ? 'orbit' : 'planetside';
              const secondSettlementData = generateSettlementData(starforgedData, region);
              const { location: _loc, ...secondSettlementDataWithoutLocation } = secondSettlementData;
              
              const secondSettlement = addSubLocation(
                sectorId,
                planet.id,
                secondSettlementData.settlementName || 'Settlement',
                'settlement',
                secondPlacement,
                secondSettlementDataWithoutLocation
              );
              
              // Add characters based on population for second settlement
              if (secondSettlement) {
                const secondCharacterCount = getCharacterCountForPopulation(secondSettlementData.population);
                for (let c = 0; c < secondCharacterCount; c++) {
                  const characterData = generateCharacterData(starforgedData);
                  addNestedEntity(
                    sectorId,
                    planet.id,
                    secondSettlement.id,
                    characterData.characterName || 'Character',
                    'character',
                    characterData
                  );
                }
              }
            }
          }
        }
      }
    }
  };

  // Create a new sector with generated details and populate it
  const createAndPopulateSector = (starforgedData, region, name = null) => {
    const sectorName = name || generateSectorName(starforgedData);
    if (!sectorName) return null;
    
    const sectorTrouble = rollSectorTrouble(starforgedData);
    const stellarObject = rollStellarObject(starforgedData);
    
    const sector = addSector(sectorName, region, {
      sectorTrouble,
      stellarObject
    });
    
    // Auto-populate sector based on region (skip void)
    if (sector && region !== 'void') {
      populateSector(sector.id, region, starforgedData);
    }
    
    return sector;
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
    removeLocation,
    addSubLocation,
    getSubLocation,
    removeSubLocation,
    addNestedEntity,
    getNestedEntity,
    removeNestedEntity,
    addLocationNestedEntity,
    getLocationNestedEntity,
    removeLocationNestedEntity,
    addLocationNestedEntityChild,
    getLocationNestedEntityChild,
    removeLocationNestedEntityChild,
    addNestedEntityChild,
    getNestedEntityChild,
    removeNestedEntityChild,
    populateSector,
    createAndPopulateSector
  };
};
