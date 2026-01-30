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
      id: Date.now(),
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
      id: Date.now(),
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
      id: Date.now(),
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
      id: Date.now(),
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
      id: Date.now(),
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
    removeNestedEntityChild
  };
};
