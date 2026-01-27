import React, { useState } from 'react';
import { NavigationView } from '../../components/NavigationView';
import { MenuGroup } from '../../components/MenuGroup';
import { MenuItem } from '../../components/MenuItem';
import { DetailCard } from '../../components/DetailCard';
import { Modal, ModalField } from '../../components/Modal/Modal';
import { DiceInput, DiceSelect } from '../../components/DiceInput/DiceInput';
import { getRegionIcon, getRegionIconBg, getRegionLabel, getGenericIconBg } from '../../utils/icons';
import './ExploreTab.css';

// Helper to find move indices from a Starforged link
const findMoveFromLink = (link, starforgedData) => {
  if (!link || !link.startsWith('Starforged/Moves/') || !starforgedData) {
    return null;
  }

  const parts = link.split('/');
  if (parts.length < 4) return null;

  const categoryName = parts[2];
  const moveName = parts[3].replace(/_/g, ' ');

  const catIndex = starforgedData.moveCategories?.findIndex(
    cat => cat.Name === categoryName
  );

  if (catIndex === -1 || catIndex === undefined) return null;

  const category = starforgedData.moveCategories[catIndex];
  const moveIndex = category.Moves?.findIndex(
    move => move.Name === moveName || move.Name.replace(/\s/g, '_') === parts[3]
  );

  if (moveIndex === -1 || moveIndex === undefined) return null;

  return { catIndex, moveIndex };
};

// Helper to extract plain text from oracle result (handles markdown links and symbols)
const parseOracleResult = (result) => {
  if (!result) return null;
  // Match markdown link format: [text](url)
  const linkMatch = result.match(/\[([^\]]+)\]\([^)]+\)/);
  let text = linkMatch ? linkMatch[1] : result;
  // Remove leading symbols like ⏵
  text = text.replace(/^[⏵▶►→]\s*/, '');
  return text;
};

// Helper to roll on an oracle table
const rollOnTable = (table) => {
  if (!table || table.length === 0) return null;
  const roll = Math.floor(Math.random() * 100) + 1;
  const result = table.find(row => {
    const floor = row.Floor || row.Chance || 1;
    const ceiling = row.Ceiling || row.Chance || 100;
    return roll >= floor && roll <= ceiling;
  });
  return result?.Result || null;
};

// Generate a random sector name from Starforged oracles
const generateSectorName = (starforgedData) => {
  if (!starforgedData?.oracleCategories) return null;
  
  const spaceCategory = starforgedData.oracleCategories.find(c => c.Name === 'Space');
  if (!spaceCategory) return null;
  
  const sectorNameOracle = spaceCategory.Oracles?.find(o => o.Name === 'Sector Name');
  if (!sectorNameOracle?.Oracles) return null;
  
  const prefixOracle = sectorNameOracle.Oracles.find(o => o.Name === 'Prefix');
  const suffixOracle = sectorNameOracle.Oracles.find(o => o.Name === 'Suffix');
  
  if (!prefixOracle?.Table || !suffixOracle?.Table) return null;
  
  const prefix = rollOnTable(prefixOracle.Table);
  const suffix = rollOnTable(suffixOracle.Table);
  
  if (prefix && suffix) {
    return `${prefix} ${suffix}`;
  }
  return null;
};

// Generate a random planet class from Starforged oracles
const generatePlanetClass = (starforgedData) => {
  if (!starforgedData?.oracleCategories) return null;
  
  const planetsCategory = starforgedData.oracleCategories.find(c => c.Name === 'Planets');
  if (!planetsCategory) return null;
  
  const classOracle = planetsCategory.Oracles?.find(o => o.Name === 'Class');
  if (!classOracle?.Table) return null;
  
  const result = rollOnTable(classOracle.Table);
  return parseOracleResult(result);
};

// Get planet category data for a specific planet class
const getPlanetCategory = (starforgedData, planetClass) => {
  if (!starforgedData?.oracleCategories || !planetClass) return null;
  
  const planetsCategory = starforgedData.oracleCategories.find(c => c.Name === 'Planets');
  if (!planetsCategory?.Categories) return null;
  
  // Try exact match first
  let category = planetsCategory.Categories.find(c => c.Name === planetClass);
  if (category) return category;
  
  // Try matching without "World" suffix (e.g., "Grave World" -> "Grave")
  const shortName = planetClass.replace(' World', '');
  category = planetsCategory.Categories.find(c => c.Name === shortName);
  if (category) return category;
  
  // Try case-insensitive partial match
  category = planetsCategory.Categories.find(c => 
    c.Name.toLowerCase().includes(shortName.toLowerCase()) ||
    shortName.toLowerCase().includes(c.Name.toLowerCase())
  );
  
  return category;
};

// Get oracle from planet category, handling nested structures
const getPlanetOracle = (starforgedData, planetClass, oracleName) => {
  const planetCategory = getPlanetCategory(starforgedData, planetClass);
  if (!planetCategory?.Oracles) return null;
  
  // Normalize oracle name for comparison
  const normalizedName = oracleName.toLowerCase().replace(/\s+/g, ' ').trim();
  
  // Direct oracle lookup
  let oracle = planetCategory.Oracles.find(o => o.Name === oracleName);
  if (oracle) return oracle;
  
  // Try case-insensitive match
  oracle = planetCategory.Oracles.find(o => 
    o.Name.toLowerCase().replace(/\s+/g, ' ').trim() === normalizedName
  );
  if (oracle) return oracle;
  
  // Check for partial match
  oracle = planetCategory.Oracles.find(o => {
    const oracleLower = o.Name.toLowerCase();
    return oracleLower.includes(normalizedName) || normalizedName.includes(oracleLower);
  });
  
  return oracle;
};

// Get the table from an oracle, handling region-based oracles
const getOracleTableForRegion = (oracle, region = 'Terminus') => {
  if (!oracle) return null;
  
  // Direct table
  if (oracle.Table) return oracle.Table;
  
  // Region-based tables (like Settlements)
  if (oracle.Tables) {
    const regionTable = oracle.Tables[region] || oracle.Tables['Terminus'];
    if (regionTable?.Table) return regionTable.Table;
  }
  
  // Nested oracles
  if (oracle.Oracles) {
    const regionOracle = oracle.Oracles.find(o => o.Name === region) || oracle.Oracles[0];
    if (regionOracle?.Table) return regionOracle.Table;
  }
  
  return null;
};

// Get options from a planet oracle table
const getPlanetOracleOptions = (starforgedData, planetClass, oracleName, region = 'Terminus') => {
  const oracle = getPlanetOracle(starforgedData, planetClass, oracleName);
  const table = getOracleTableForRegion(oracle, region);
  
  if (!table) return [];
  
  // Extract unique results from the table
  const results = new Set();
  table.forEach(row => {
    if (row.Result) {
      const parsed = parseOracleResult(row.Result);
      if (parsed) results.add(parsed);
    }
  });
  
  return Array.from(results).map(r => ({ value: r, label: r }));
};

// Roll on a planet-specific oracle
const rollPlanetOracle = (starforgedData, planetClass, oracleName, region = 'Terminus') => {
  const oracle = getPlanetOracle(starforgedData, planetClass, oracleName);
  const table = getOracleTableForRegion(oracle, region);
  
  if (!table) return null;
  
  const result = rollOnTable(table);
  return parseOracleResult(result);
};

// Check if the planet has life based on the Life field value
const planetHasLife = (lifeValue) => {
  if (!lifeValue) return false;
  const noLifeValues = ['none', 'extinct', 'sterile', 'lifeless'];
  return !noLifeValues.includes(lifeValue.toLowerCase());
};

// Get Peril oracle options based on life status
const getPerilOracleOptions = (starforgedData, planetClass, hasLife) => {
  // Try planet-specific peril first
  let options = getPlanetOracleOptions(starforgedData, planetClass, hasLife ? 'Peril' : 'Peril');
  if (options.length > 0) return options;
  
  // Fall back to generic planetside peril from Planets category
  const planetsCategory = starforgedData?.oracleCategories?.find(c => c.Name === 'Planets');
  if (!planetsCategory?.Oracles) return [];
  
  const oracleName = hasLife ? 'Planetside Peril' : 'Planetside Peril';
  const oracle = planetsCategory.Oracles.find(o => 
    o.Name.toLowerCase().includes('peril')
  );
  
  if (!oracle) return [];
  
  // Check if it has life/lifeless variants
  if (oracle.Tables) {
    const tableKey = hasLife ? 'Life' : 'Lifeless';
    const table = oracle.Tables[tableKey]?.Table || Object.values(oracle.Tables)[0]?.Table;
    if (table) {
      const results = new Set();
      table.forEach(row => {
        if (row.Result) {
          const parsed = parseOracleResult(row.Result);
          if (parsed) results.add(parsed);
        }
      });
      return Array.from(results).map(r => ({ value: r, label: r }));
    }
  }
  
  if (oracle.Table) {
    const results = new Set();
    oracle.Table.forEach(row => {
      if (row.Result) {
        const parsed = parseOracleResult(row.Result);
        if (parsed) results.add(parsed);
      }
    });
    return Array.from(results).map(r => ({ value: r, label: r }));
  }
  
  return [];
};

// Roll on Peril oracle based on life status
const rollPerilOracle = (starforgedData, planetClass, hasLife) => {
  // Try planet-specific peril first
  const planetCategory = getPlanetCategory(starforgedData, planetClass);
  if (planetCategory?.Oracles) {
    const oracle = planetCategory.Oracles.find(o => 
      o.Name.toLowerCase().includes('peril')
    );
    if (oracle?.Table) {
      const result = rollOnTable(oracle.Table);
      return parseOracleResult(result);
    }
  }
  
  // Fall back to generic planetside peril
  const planetsCategory = starforgedData?.oracleCategories?.find(c => c.Name === 'Planets');
  if (!planetsCategory?.Oracles) return null;
  
  const oracle = planetsCategory.Oracles.find(o => 
    o.Name.toLowerCase().includes('peril')
  );
  
  if (!oracle) return null;
  
  // Check for life/lifeless variants
  if (oracle.Tables) {
    const tableKey = hasLife ? 'Life' : 'Lifeless';
    const table = oracle.Tables[tableKey]?.Table || Object.values(oracle.Tables)[0]?.Table;
    if (table) {
      const result = rollOnTable(table);
      return parseOracleResult(result);
    }
  }
  
  if (oracle.Table) {
    const result = rollOnTable(oracle.Table);
    return parseOracleResult(result);
  }
  
  return null;
};

// Get Opportunity oracle options based on life status
const getOpportunityOracleOptions = (starforgedData, planetClass, hasLife) => {
  // Try planet-specific opportunity first
  let options = getPlanetOracleOptions(starforgedData, planetClass, 'Opportunity');
  if (options.length > 0) return options;
  
  // Fall back to generic planetside opportunity from Planets category
  const planetsCategory = starforgedData?.oracleCategories?.find(c => c.Name === 'Planets');
  if (!planetsCategory?.Oracles) return [];
  
  const oracle = planetsCategory.Oracles.find(o => 
    o.Name.toLowerCase().includes('opportunity')
  );
  
  if (!oracle) return [];
  
  // Check if it has life/lifeless variants
  if (oracle.Tables) {
    const tableKey = hasLife ? 'Life' : 'Lifeless';
    const table = oracle.Tables[tableKey]?.Table || Object.values(oracle.Tables)[0]?.Table;
    if (table) {
      const results = new Set();
      table.forEach(row => {
        if (row.Result) {
          const parsed = parseOracleResult(row.Result);
          if (parsed) results.add(parsed);
        }
      });
      return Array.from(results).map(r => ({ value: r, label: r }));
    }
  }
  
  if (oracle.Table) {
    const results = new Set();
    oracle.Table.forEach(row => {
      if (row.Result) {
        const parsed = parseOracleResult(row.Result);
        if (parsed) results.add(parsed);
      }
    });
    return Array.from(results).map(r => ({ value: r, label: r }));
  }
  
  return [];
};

// Roll on Opportunity oracle based on life status
const rollOpportunityOracle = (starforgedData, planetClass, hasLife) => {
  // Try planet-specific opportunity first
  const planetCategory = getPlanetCategory(starforgedData, planetClass);
  if (planetCategory?.Oracles) {
    const oracle = planetCategory.Oracles.find(o => 
      o.Name.toLowerCase().includes('opportunity')
    );
    if (oracle?.Table) {
      const result = rollOnTable(oracle.Table);
      return parseOracleResult(result);
    }
  }
  
  // Fall back to generic planetside opportunity
  const planetsCategory = starforgedData?.oracleCategories?.find(c => c.Name === 'Planets');
  if (!planetsCategory?.Oracles) return null;
  
  const oracle = planetsCategory.Oracles.find(o => 
    o.Name.toLowerCase().includes('opportunity')
  );
  
  if (!oracle) return null;
  
  // Check for life/lifeless variants
  if (oracle.Tables) {
    const tableKey = hasLife ? 'Life' : 'Lifeless';
    const table = oracle.Tables[tableKey]?.Table || Object.values(oracle.Tables)[0]?.Table;
    if (table) {
      const result = rollOnTable(table);
      return parseOracleResult(result);
    }
  }
  
  if (oracle.Table) {
    const result = rollOnTable(oracle.Table);
    return parseOracleResult(result);
  }
  
  return null;
};

// Planet class options from Starforged
const PLANET_CLASSES = [
  { value: 'Desert World', label: 'Desert World' },
  { value: 'Furnace World', label: 'Furnace World' },
  { value: 'Grave World', label: 'Grave World' },
  { value: 'Ice World', label: 'Ice World' },
  { value: 'Jovian World', label: 'Jovian World' },
  { value: 'Jungle World', label: 'Jungle World' },
  { value: 'Ocean World', label: 'Ocean World' },
  { value: 'Rocky World', label: 'Rocky World' },
  { value: 'Shattered World', label: 'Shattered World' },
  { value: 'Tainted World', label: 'Tainted World' },
  { value: 'Vital World', label: 'Vital World' }
];

export const ExploreTab = ({ 
  viewName, 
  navigate, 
  goBack,
  starforgedData,
  sectors,
  factions,
  addSector,
  getSector,
  addFaction,
  getFaction,
  addLocation,
  getLocation,
  scrollProps = {}
}) => {
  // Modal state (local, resets on navigation is fine)
  const [showSectorModal, setShowSectorModal] = useState(false);
  const [newSectorName, setNewSectorName] = useState('');
  const [newSectorRegion, setNewSectorRegion] = useState('terminus');
  const [showFactionModal, setShowFactionModal] = useState(false);
  const [newFactionName, setNewFactionName] = useState('');
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [newLocationName, setNewLocationName] = useState('');
  const [newLocationType, setNewLocationType] = useState(null);
  const [currentSectorId, setCurrentSectorId] = useState(null);
  const [newPlanetClass, setNewPlanetClass] = useState('');
  const [newPlanetAtmosphere, setNewPlanetAtmosphere] = useState('');
  const [newPlanetSettlements, setNewPlanetSettlements] = useState('');
  const [newPlanetObserved, setNewPlanetObserved] = useState('');
  const [newPlanetFeature, setNewPlanetFeature] = useState('');
  const [newPlanetLife, setNewPlanetLife] = useState('');
  const [newPlanetPeril, setNewPlanetPeril] = useState('');
  const [newPlanetOpportunity, setNewPlanetOpportunity] = useState('');

  const createSector = () => {
    if (!newSectorName.trim()) return;
    addSector(newSectorName, newSectorRegion);
    setNewSectorName('');
    setNewSectorRegion('terminus');
    setShowSectorModal(false);
  };

  const createFaction = () => {
    if (!newFactionName.trim()) return;
    addFaction(newFactionName);
    setNewFactionName('');
    setShowFactionModal(false);
  };

  const createLocation = () => {
    if (!currentSectorId || !newLocationType) return;
    if (newLocationType === 'planet' && !newPlanetClass.trim()) return;
    
    // Use planet class as name for planets, otherwise use type name
    let name;
    let data = {};
    
    if (newLocationType === 'planet') {
      name = newPlanetClass.trim();
      data = {
        planetClass: newPlanetClass.trim(),
        atmosphere: newPlanetAtmosphere,
        settlements: newPlanetSettlements,
        observed: newPlanetObserved,
        feature: newPlanetFeature,
        life: newPlanetLife,
        peril: newPlanetPeril,
        opportunity: newPlanetOpportunity
      };
    } else {
      const typeNames = {
        station: 'Station',
        settlement: 'Settlement',
        derelict: 'Derelict',
        vault: 'Vault'
      };
      name = typeNames[newLocationType] || 'Location';
    }
    
    addLocation(currentSectorId, name, newLocationType, data);
    setNewLocationType(null);
    resetPlanetFields();
    setShowLocationModal(false);
  };

  const closeLocationModal = () => {
    setNewLocationType(null);
    setNewPlanetClass('');
    setNewPlanetAtmosphere('');
    setNewPlanetSettlements('');
    setNewPlanetObserved('');
    setNewPlanetFeature('');
    setNewPlanetLife('');
    setNewPlanetPeril('');
    setNewPlanetOpportunity('');
    setShowLocationModal(false);
  };
  
  const resetPlanetFields = () => {
    setNewPlanetClass('');
    setNewPlanetAtmosphere('');
    setNewPlanetSettlements('');
    setNewPlanetObserved('');
    setNewPlanetFeature('');
    setNewPlanetLife('');
    setNewPlanetPeril('');
    setNewPlanetOpportunity('');
  };

  const getEntityTypeInfo = (type) => {
    const types = {
      planet: { icon: '🪐', label: 'Planet' },
      station: { icon: '🛰️', label: 'Station' },
      settlement: { icon: '🏘️', label: 'Settlement' },
      derelict: { icon: '🚢', label: 'Derelict' },
      vault: { icon: '🏛️', label: 'Vault' }
    };
    return types[type];
  };

  // Home view
  if (viewName === 'home') {
    return (
      <>
        <NavigationView title="The Forge" {...scrollProps}>
          <MenuGroup title="Sectors">
            {sectors.length === 0 ? (
              <MenuItem 
                label="No sectors yet" 
                showChevron={false}
                muted={true}
              />
            ) : (
              sectors.map(sector => (
                <MenuItem 
                  key={sector.id}
                  icon={getRegionIcon(sector.region)}
                  iconBg={getRegionIconBg(sector.region)}
                  label={sector.name}
                  value={getRegionLabel(sector.region)}
                  onClick={() => navigate(`sector-${sector.id}`)}
                />
              ))
            )}
            <MenuItem 
              label="Create Sector"
              onClick={() => setShowSectorModal(true)}
              isButton={true}
            />
          </MenuGroup>

          <MenuGroup title="Factions">
            {factions.length === 0 ? (
              <MenuItem 
                label="No factions yet" 
                showChevron={false}
                muted={true}
              />
            ) : (
              factions.map(faction => (
                <MenuItem 
                  key={faction.id}
                  icon="🏛️"
                  iconBg={getGenericIconBg('🏛️')}
                  label={faction.name}
                  onClick={() => navigate(`faction-${faction.id}`)}
                />
              ))
            )}
            <MenuItem 
              label="Create Faction"
              onClick={() => setShowFactionModal(true)}
              isButton={true}
            />
          </MenuGroup>

          <MenuGroup title="Truths">
            {starforgedData?.settingTruths.map((truth, index) => (
              <MenuItem 
                key={truth['$id'] || index}
                icon="🌌" 
                iconBg={getGenericIconBg('🌌')}
                label={truth.Name || `Truth ${index + 1}`}
                onClick={() => navigate(`setting-truth-${index}`)}
              />
            ))}
          </MenuGroup>
        </NavigationView>

        {/* Create Sector Modal */}
        <Modal
          isOpen={showSectorModal}
          onClose={() => setShowSectorModal(false)}
          title="New Sector"
          action={{
            label: 'Create',
            onClick: createSector,
            disabled: !newSectorName.trim()
          }}
        >
          <ModalField label="Name">
            <DiceInput
              value={newSectorName}
              onChange={(e) => setNewSectorName(e.target.value)}
              onDiceClick={() => {
                const name = generateSectorName(starforgedData);
                if (name) {
                  setNewSectorName(name);
                }
              }}
              placeholder="Enter sector name..."
              autoFocus
            />
          </ModalField>
          <ModalField label="Region">
            <select
              className="modal-select"
              value={newSectorRegion}
              onChange={(e) => setNewSectorRegion(e.target.value)}
            >
              <option value="terminus">🌟 Terminus</option>
              <option value="outlands">🌀 Outlands</option>
              <option value="expanse">🌌 Expanse</option>
              <option value="void">🕳️ Void</option>
            </select>
          </ModalField>
        </Modal>

        {/* Create Faction Modal */}
        <Modal
          isOpen={showFactionModal}
          onClose={() => setShowFactionModal(false)}
          title="New Faction"
          action={{
            label: 'Create',
            onClick: createFaction,
            disabled: !newFactionName.trim()
          }}
        >
          <ModalField label="Name">
            <input
              type="text"
              className="modal-input"
              value={newFactionName}
              onChange={(e) => setNewFactionName(e.target.value)}
              placeholder="Enter faction name..."
              autoFocus
            />
          </ModalField>
        </Modal>
      </>
    );
  }

  // Sector Detail View
  if (viewName.startsWith('sector-')) {
    const sectorId = parseInt(viewName.split('-')[1]);
    const sector = getSector(sectorId);

    if (!sector) {
      return (
        <NavigationView title="Sector Not Found" onBack={goBack} {...scrollProps}>
          <MenuGroup>
            <MenuItem 
              label="This sector no longer exists"
              showChevron={false}
              muted={true}
            />
          </MenuGroup>
        </NavigationView>
      );
    }

    return (
      <>
        <NavigationView 
          title={sector.name} 
          onBack={goBack}
          {...scrollProps}
        >
          <MenuGroup title="Connected">
            {(!sector.locations || sector.locations.length === 0) ? (
              <MenuItem 
                label="No entities yet"
                showChevron={false}
                muted={true}
              />
            ) : (
              sector.locations.map(location => (
                <MenuItem 
                  key={location.id}
                  icon={location.type === 'planet' ? '🪐' : location.type === 'station' ? '🛰️' : '⭐'}
                  iconBg={getGenericIconBg(location.type === 'planet' ? '🪐' : location.type === 'station' ? '🛰️' : '⭐')}
                  label={location.name}
                  value={location.type.charAt(0).toUpperCase() + location.type.slice(1)}
                  onClick={() => navigate(`location-${sectorId}-${location.id}`)}
                />
              ))
            )}
            <MenuItem 
              label="Add entity"
              onClick={() => {
                setCurrentSectorId(sectorId);
                setShowLocationModal(true);
              }}
              isButton={true}
            />
          </MenuGroup>
          <MenuGroup title="Not connected">
            {(!sector.locations || sector.locations.length === 0) ? (
              <MenuItem 
                label="No entities yet"
                showChevron={false}
                muted={true}
              />
            ) : (
              sector.locations.map(location => (
                <MenuItem 
                  key={location.id}
                  icon={location.type === 'planet' ? '🪐' : location.type === 'station' ? '🛰️' : '⭐'}
                  iconBg={getGenericIconBg(location.type === 'planet' ? '🪐' : location.type === 'station' ? '🛰️' : '⭐')}
                  label={location.name}
                  value={location.type.charAt(0).toUpperCase() + location.type.slice(1)}
                  onClick={() => navigate(`location-${sectorId}-${location.id}`)}
                />
              ))
            )}
            <MenuItem 
              label="Add entity"
              onClick={() => {
                setCurrentSectorId(sectorId);
                setShowLocationModal(true);
              }}
              isButton={true}
            />
          </MenuGroup>
        </NavigationView>

        {/* Create Location Modal */}
        <Modal
          isOpen={showLocationModal}
          onClose={closeLocationModal}
          onBack={newLocationType ? () => { setNewLocationType(null); resetPlanetFields(); } : null}
          title={newLocationType ? getEntityTypeInfo(newLocationType).label : "New entity"}
          action={newLocationType ? {
            label: 'Create',
            onClick: createLocation,
            disabled: newLocationType === 'planet' && !newPlanetClass.trim()
          } : null}
        >
          {!newLocationType ? (
            <MenuGroup>
              <MenuItem 
                icon="🪐"
                iconBg={getGenericIconBg('🪐')}
                label="Planet"
                onClick={() => setNewLocationType('planet')}
              />
              <MenuItem 
                icon="🛰️"
                iconBg={getGenericIconBg('🛰️')}
                label="Station"
                onClick={() => setNewLocationType('station')}
              />
              <MenuItem 
                icon="🏘️"
                iconBg={getGenericIconBg('🏘️')}
                label="Settlement"
                onClick={() => setNewLocationType('settlement')}
              />
              <MenuItem 
                icon="🚢"
                iconBg={getGenericIconBg('🚢')}
                label="Derelict"
                onClick={() => setNewLocationType('derelict')}
              />
              <MenuItem 
                icon="🏛️"
                iconBg={getGenericIconBg('🏛️')}
                label="Vault"
                onClick={() => setNewLocationType('vault')}
              />
            </MenuGroup>
          ) : newLocationType === 'planet' ? (
            <>
              <ModalField label="Class">
                <DiceSelect
                  value={newPlanetClass}
                  onChange={(e) => {
                    setNewPlanetClass(e.target.value);
                    // Reset dependent fields when class changes
                    setNewPlanetAtmosphere('');
                    setNewPlanetSettlements('');
                    setNewPlanetObserved('');
                    setNewPlanetFeature('');
                    setNewPlanetLife('');
                    setNewPlanetPeril('');
                    setNewPlanetOpportunity('');
                  }}
                  onDiceClick={() => {
                    const planetClass = generatePlanetClass(starforgedData);
                    if (planetClass) {
                      setNewPlanetClass(planetClass);
                      // Reset dependent fields when class changes
                      setNewPlanetAtmosphere('');
                      setNewPlanetSettlements('');
                      setNewPlanetObserved('');
                      setNewPlanetFeature('');
                      setNewPlanetLife('');
                      setNewPlanetPeril('');
                      setNewPlanetOpportunity('');
                    }
                  }}
                  options={PLANET_CLASSES}
                  placeholder="Select a class..."
                />
              </ModalField>
              {newPlanetClass && (
                <>
                  <ModalField label="Atmosphere">
                    <DiceSelect
                      value={newPlanetAtmosphere}
                      onChange={(e) => setNewPlanetAtmosphere(e.target.value)}
                      onDiceClick={() => {
                        const result = rollPlanetOracle(starforgedData, newPlanetClass, 'Atmosphere');
                        if (result) setNewPlanetAtmosphere(result);
                      }}
                      options={getPlanetOracleOptions(starforgedData, newPlanetClass, 'Atmosphere')}
                      placeholder="Select atmosphere..."
                    />
                  </ModalField>
                  <ModalField label="Settlements">
                    <DiceSelect
                      value={newPlanetSettlements}
                      onChange={(e) => setNewPlanetSettlements(e.target.value)}
                      onDiceClick={() => {
                        const sector = getSector(currentSectorId);
                        const region = sector?.region ? sector.region.charAt(0).toUpperCase() + sector.region.slice(1) : 'Terminus';
                        const result = rollPlanetOracle(starforgedData, newPlanetClass, 'Settlements', region);
                        if (result) setNewPlanetSettlements(result);
                      }}
                      options={(() => {
                        const sector = getSector(currentSectorId);
                        const region = sector?.region ? sector.region.charAt(0).toUpperCase() + sector.region.slice(1) : 'Terminus';
                        return getPlanetOracleOptions(starforgedData, newPlanetClass, 'Settlements', region);
                      })()}
                      placeholder="Select settlements..."
                    />
                  </ModalField>
                  <ModalField label="Observed from Space">
                    <DiceSelect
                      value={newPlanetObserved}
                      onChange={(e) => setNewPlanetObserved(e.target.value)}
                      onDiceClick={() => {
                        const result = rollPlanetOracle(starforgedData, newPlanetClass, 'Observed From Space');
                        if (result) setNewPlanetObserved(result);
                      }}
                      options={getPlanetOracleOptions(starforgedData, newPlanetClass, 'Observed From Space')}
                      placeholder="Select observation..."
                    />
                  </ModalField>
                  <ModalField label="Feature">
                    <DiceSelect
                      value={newPlanetFeature}
                      onChange={(e) => setNewPlanetFeature(e.target.value)}
                      onDiceClick={() => {
                        const result = rollPlanetOracle(starforgedData, newPlanetClass, 'Feature');
                        if (result) setNewPlanetFeature(result);
                      }}
                      options={getPlanetOracleOptions(starforgedData, newPlanetClass, 'Feature')}
                      placeholder="Select feature..."
                    />
                  </ModalField>
                  <ModalField label="Life">
                    <DiceSelect
                      value={newPlanetLife}
                      onChange={(e) => {
                        setNewPlanetLife(e.target.value);
                        // Reset peril/opportunity when life changes
                        setNewPlanetPeril('');
                        setNewPlanetOpportunity('');
                      }}
                      onDiceClick={() => {
                        const result = rollPlanetOracle(starforgedData, newPlanetClass, 'Life');
                        if (result) {
                          setNewPlanetLife(result);
                          // Reset peril/opportunity when life changes
                          setNewPlanetPeril('');
                          setNewPlanetOpportunity('');
                        }
                      }}
                      options={getPlanetOracleOptions(starforgedData, newPlanetClass, 'Life')}
                      placeholder="Select life..."
                    />
                  </ModalField>
                  {newPlanetLife && (
                    <>
                      <ModalField label="Peril">
                        <DiceSelect
                          value={newPlanetPeril}
                          onChange={(e) => setNewPlanetPeril(e.target.value)}
                          onDiceClick={() => {
                            const hasLife = planetHasLife(newPlanetLife);
                            const result = rollPerilOracle(starforgedData, newPlanetClass, hasLife);
                            if (result) setNewPlanetPeril(result);
                          }}
                          options={getPerilOracleOptions(starforgedData, newPlanetClass, planetHasLife(newPlanetLife))}
                          placeholder="Select peril..."
                        />
                      </ModalField>
                      <ModalField label="Opportunity">
                        <DiceSelect
                          value={newPlanetOpportunity}
                          onChange={(e) => setNewPlanetOpportunity(e.target.value)}
                          onDiceClick={() => {
                            const hasLife = planetHasLife(newPlanetLife);
                            const result = rollOpportunityOracle(starforgedData, newPlanetClass, hasLife);
                            if (result) setNewPlanetOpportunity(result);
                          }}
                          options={getOpportunityOracleOptions(starforgedData, newPlanetClass, planetHasLife(newPlanetLife))}
                          placeholder="Select opportunity..."
                        />
                      </ModalField>
                    </>
                  )}
                </>
              )}
            </>
          ) : (
            <MenuGroup>
              <MenuItem 
                label="Entity details coming soon"
                showChevron={false}
                muted={true}
              />
            </MenuGroup>
          )}
        </Modal>
      </>
    );
  }

  // Location Detail View
  if (viewName.startsWith('location-')) {
    const parts = viewName.split('-');
    const sectorId = parseInt(parts[1]);
    const locationId = parseInt(parts[2]);
    const location = getLocation(sectorId, locationId);
    const sector = getSector(sectorId);

    if (location) {
      const getLocationIcon = (type) => {
        const icons = {
          planet: '🪐',
          station: '🛰️',
          settlement: '🏘️',
          derelict: '🚢',
          vault: '🏛️'
        };
        return icons[type] || '⭐';
      };

      return (
        <NavigationView 
          title={location.name} 
          onBack={goBack}
          {...scrollProps}
        >
          <DetailCard
            icon={getLocationIcon(location.type)}
            iconBg={getGenericIconBg(getLocationIcon(location.type))}
            title={location.name}
            description={location.type.charAt(0).toUpperCase() + location.type.slice(1)}
          />
          
          {location.type === 'planet' && (
            <MenuGroup title="Details">
              {location.atmosphere && (
                <MenuItem 
                  label="Atmosphere"
                  value={location.atmosphere}
                  showChevron={false}
                />
              )}
              {location.settlements && (
                <MenuItem 
                  label="Settlements"
                  value={location.settlements}
                  showChevron={false}
                />
              )}
              {location.observed && (
                <MenuItem 
                  label="Observed from Space"
                  value={location.observed}
                  showChevron={false}
                />
              )}
              {location.feature && (
                <MenuItem 
                  label="Feature"
                  value={location.feature}
                  showChevron={false}
                />
              )}
              {location.life && (
                <MenuItem 
                  label="Life"
                  value={location.life}
                  showChevron={false}
                />
              )}
              {location.peril && (
                <MenuItem 
                  label="Peril"
                  value={location.peril}
                  showChevron={false}
                />
              )}
              {location.opportunity && (
                <MenuItem 
                  label="Opportunity"
                  value={location.opportunity}
                  showChevron={false}
                />
              )}
              {!location.atmosphere && !location.settlements && !location.observed && 
               !location.feature && !location.life && !location.peril && !location.opportunity && (
                <MenuItem 
                  label="No details recorded"
                  showChevron={false}
                  muted={true}
                />
              )}
            </MenuGroup>
          )}

          {sector && (
            <MenuGroup title="Location">
              <MenuItem 
                label="Sector"
                value={sector.name}
                showChevron={false}
              />
              <MenuItem 
                label="Region"
                value={getRegionLabel(sector.region)}
                showChevron={false}
              />
            </MenuGroup>
          )}
        </NavigationView>
      );
    }
  }

  // Faction Detail View
  if (viewName.startsWith('faction-')) {
    const factionId = parseInt(viewName.split('-')[1]);
    const faction = getFaction(factionId);

    if (faction) {
      return (
        <NavigationView title={faction.name} onBack={goBack} {...scrollProps}>
          <MenuGroup>
            <MenuItem 
              label="Faction details coming soon"
              showChevron={false}
              muted={true}
            />
          </MenuGroup>
        </NavigationView>
      );
    }
  }

  // Setting Truth Detail View
  if (viewName.startsWith('setting-truth-') && starforgedData) {
    const truthIndex = parseInt(viewName.split('-')[2]);
    const truth = starforgedData.settingTruths[truthIndex];

    if (truth) {
      const handleLinkClick = (href) => {
        const moveIndices = findMoveFromLink(href, starforgedData);
        if (moveIndices) {
          navigate(`move-${moveIndices.catIndex}-${moveIndices.moveIndex}`);
        }
      };

      return (
        <NavigationView title={truth.Name} onBack={goBack} {...scrollProps}>
          <DetailCard
            icon="🌌"
            iconBg={getGenericIconBg('🌌')}
            title={truth.Name}
            description={truth.Description || ''}
            onLinkClick={handleLinkClick}
          />
          {truth.Options && truth.Options.length > 0 && (
            <MenuGroup title="Options">
              {truth.Options.map((option, optionIndex) => (
                <MenuItem 
                  key={optionIndex}
                  label={option.Name || `Option ${optionIndex + 1}`}
                  subtitle={option.Description || ''}
                  showChevron={false}
                />
              ))}
            </MenuGroup>
          )}
        </NavigationView>
      );
    }
  }

  return null;
};
