import React, { useState } from 'react';
import { NavigationView } from '../../components/NavigationView';
import { MenuGroup } from '../../components/MenuGroup';
import { MenuItem } from '../../components/MenuItem';
import { DetailCard } from '../../components/DetailCard';
import { Modal, ModalField } from '../../components/Modal/Modal';
import { DiceInput, DiceSelect } from '../../components/DiceInput/DiceInput';
import { ConfirmDialog } from '../../components/ConfirmDialog/ConfirmDialog';
import { getRegionIcon, getRegionIconBg, getRegionLabel, getGenericIconBg } from '../../utils/icons';
import { findMoveFromLink } from '../../utils/oracleHelpers';
import { 
  rollOnTable, 
  parseOracleResult, 
  generateSectorName, 
  generatePlanetClass, 
  getPlanetCategory, 
  getPlanetSampleNames, 
  rollPlanetName, 
  getPlanetOracle, 
  getOracleTableForRegion,
  filterValidRows,
  getOracleCategory,
  getOracleFromCategory
} from '../../utils/oracleRollers';
import { REGION_DESCRIPTIONS } from '../../constants';
import { useStarforgedContext } from '../../contexts/StarforgedContext';
import { useNavigationContext } from '../../contexts/NavigationContext';
import { useExploreContext } from '../../contexts/ExploreContext';
import './ExploreTab.css';

// Region descriptions from Starforged rulebook
const getRegionDescription = (region) => {
  return REGION_DESCRIPTIONS[region] || REGION_DESCRIPTIONS.terminus;
};

// Get options from a planet oracle table
const getPlanetOracleOptions = (starforgedData, planetClass, oracleName, region = 'Terminus') => {
  const oracle = getPlanetOracle(starforgedData, planetClass, oracleName);
  const table = getOracleTableForRegion(oracle, region);
  const validTable = filterValidRows(table);
  
  if (!validTable) return [];
  
  // Extract unique results from the table
  const results = new Set();
  validTable.forEach(row => {
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
  let options = getPlanetOracleOptions(starforgedData, planetClass, 'Peril');
  if (options.length > 0) return options;
  
  // Fall back to generic planetside peril from Planets category
  const planetsCategory = starforgedData?.oracleCategories?.find(c => c.Name === 'Planets');
  if (!planetsCategory?.Oracles) return [];
  
  const oracle = planetsCategory.Oracles.find(o => 
    o.Name.toLowerCase().includes('peril')
  );
  
  if (!oracle) return [];
  
  const extractOptions = (table) => {
    const validTable = filterValidRows(table);
    if (!validTable) return [];
    const results = new Set();
    validTable.forEach(row => {
      if (row.Result) {
        const parsed = parseOracleResult(row.Result);
        if (parsed) results.add(parsed);
      }
    });
    return Array.from(results).map(r => ({ value: r, label: r }));
  };
  
  // Check for life/lifeless sub-oracles
  if (oracle.Oracles) {
    const subOracleName = hasLife ? 'Lifebearing' : 'Lifeless';
    const subOracle = oracle.Oracles.find(o => 
      o.Name.toLowerCase().includes(subOracleName.toLowerCase())
    ) || oracle.Oracles[0];
    if (subOracle?.Table) {
      return extractOptions(subOracle.Table);
    }
  }
  
  // Check if it has life/lifeless table variants
  if (oracle.Tables) {
    const tableKey = hasLife ? 'Lifebearing' : 'Lifeless';
    const table = oracle.Tables[tableKey]?.Table || 
                  oracle.Tables['Life']?.Table ||
                  Object.values(oracle.Tables)[0]?.Table;
    if (table) {
      return extractOptions(table);
    }
  }
  
  if (oracle.Table) {
    return extractOptions(oracle.Table);
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
  
  // Check for life/lifeless sub-oracles
  if (oracle.Oracles) {
    const subOracleName = hasLife ? 'Lifebearing' : 'Lifeless';
    const subOracle = oracle.Oracles.find(o => 
      o.Name.toLowerCase().includes(subOracleName.toLowerCase())
    ) || oracle.Oracles[0];
    if (subOracle?.Table) {
      const result = rollOnTable(subOracle.Table);
      return parseOracleResult(result);
    }
  }
  
  // Check for life/lifeless table variants
  if (oracle.Tables) {
    const tableKey = hasLife ? 'Lifebearing' : 'Lifeless';
    const table = oracle.Tables[tableKey]?.Table || 
                  oracle.Tables['Life']?.Table ||
                  Object.values(oracle.Tables)[0]?.Table;
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
  
  const extractOptions = (table) => {
    const validTable = filterValidRows(table);
    if (!validTable) return [];
    const results = new Set();
    validTable.forEach(row => {
      if (row.Result) {
        const parsed = parseOracleResult(row.Result);
        if (parsed) results.add(parsed);
      }
    });
    return Array.from(results).map(r => ({ value: r, label: r }));
  };
  
  // Check for life/lifeless sub-oracles
  if (oracle.Oracles) {
    const subOracleName = hasLife ? 'Lifebearing' : 'Lifeless';
    const subOracle = oracle.Oracles.find(o => 
      o.Name.toLowerCase().includes(subOracleName.toLowerCase())
    ) || oracle.Oracles[0];
    if (subOracle?.Table) {
      return extractOptions(subOracle.Table);
    }
  }
  
  // Check if it has life/lifeless table variants
  if (oracle.Tables) {
    const tableKey = hasLife ? 'Lifebearing' : 'Lifeless';
    const table = oracle.Tables[tableKey]?.Table || 
                  oracle.Tables['Life']?.Table ||
                  Object.values(oracle.Tables)[0]?.Table;
    if (table) {
      return extractOptions(table);
    }
  }
  
  if (oracle.Table) {
    return extractOptions(oracle.Table);
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
  
  // Check for life/lifeless sub-oracles
  if (oracle.Oracles) {
    const subOracleName = hasLife ? 'Lifebearing' : 'Lifeless';
    const subOracle = oracle.Oracles.find(o => 
      o.Name.toLowerCase().includes(subOracleName.toLowerCase())
    ) || oracle.Oracles[0];
    if (subOracle?.Table) {
      const result = rollOnTable(subOracle.Table);
      return parseOracleResult(result);
    }
  }
  
  // Check for life/lifeless table variants
  if (oracle.Tables) {
    const tableKey = hasLife ? 'Lifebearing' : 'Lifeless';
    const table = oracle.Tables[tableKey]?.Table || 
                  oracle.Tables['Life']?.Table ||
                  Object.values(oracle.Tables)[0]?.Table;
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

// ==================== GENERIC ORACLE HELPERS ====================

// Get oracle from sub-category
const getOracleFromSubCategory = (category, subCategoryName, oracleName) => {
  if (!category?.Categories) return null;
  const subCategory = category.Categories.find(c => 
    c.Name === subCategoryName || 
    c.Name.toLowerCase().includes(subCategoryName.toLowerCase())
  );
  if (!subCategory?.Oracles) return null;
  return subCategory.Oracles.find(o => 
    o.Name === oracleName || 
    o.Name.toLowerCase().includes(oracleName.toLowerCase())
  );
};

// Extract options from an oracle table
const extractOracleOptions = (oracle, region = null) => {
  const table = getOracleTableForRegion(oracle, region);
  const validTable = filterValidRows(table);
  if (!validTable) return [];
  
  const results = new Set();
  validTable.forEach(row => {
    if (row.Result) {
      const parsed = parseOracleResult(row.Result);
      if (parsed) results.add(parsed);
    }
  });
  
  return Array.from(results).map(r => ({ value: r, label: r }));
};

// Roll on oracle and return parsed result
const rollOracleResult = (oracle, region = null) => {
  const table = getOracleTableForRegion(oracle, region);
  if (!table) return null;
  const result = rollOnTable(table);
  return parseOracleResult(result);
};

// ==================== STELLAR OBJECT HELPERS ====================

const getStellarObjectOracle = (starforgedData) => {
  const spaceCategory = getOracleCategory(starforgedData, 'Space');
  return getOracleFromCategory(spaceCategory, 'Stellar Object');
};

const getStellarObjectOptions = (starforgedData) => {
  const oracle = getStellarObjectOracle(starforgedData);
  return extractOracleOptions(oracle);
};

const rollStellarObject = (starforgedData) => {
  const oracle = getStellarObjectOracle(starforgedData);
  return rollOracleResult(oracle);
};

// ==================== SETTLEMENT HELPERS ====================

const getSettlementOracle = (starforgedData, oracleName, region = 'Terminus') => {
  const category = getOracleCategory(starforgedData, 'Settlements');
  const oracle = getOracleFromCategory(category, oracleName);
  return oracle;
};

const getSettlementOracleOptions = (starforgedData, oracleName, region = 'Terminus') => {
  const oracle = getSettlementOracle(starforgedData, oracleName);
  return extractOracleOptions(oracle, region);
};

const rollSettlementOracle = (starforgedData, oracleName, region = 'Terminus') => {
  const oracle = getSettlementOracle(starforgedData, oracleName);
  return rollOracleResult(oracle, region);
};

const SETTLEMENT_NAME_TAGS = [
  'Base', 'Citadel', 'Depot', 'Fortress', 'Hold', 
  'Landing', 'Outpost', 'Port', 'Station', 'Terminal'
];

const generateSettlementName = (starforgedData) => {
  const category = getOracleCategory(starforgedData, 'Settlements');
  if (!category) return null;
  
  const nameOracle = getOracleFromCategory(category, 'Name');
  if (!nameOracle) return null;
  
  let baseName = null;
  
  // Settlement names have a direct Table (not sub-oracles like sector names)
  if (nameOracle.Table) {
    const result = rollOnTable(nameOracle.Table);
    baseName = parseOracleResult(result);
  }
  
  // Fall back to sub-oracles if they exist (prefix/suffix pattern)
  if (!baseName && nameOracle.Oracles && nameOracle.Oracles.length >= 2) {
    const first = rollOnTable(nameOracle.Oracles[0]?.Table);
    const second = rollOnTable(nameOracle.Oracles[1]?.Table);
    if (first && second) {
      baseName = `${parseOracleResult(first)} ${parseOracleResult(second)}`;
    }
  }
  
  if (!baseName) return null;
  
  // 50% chance to add a tag suffix
  if (Math.random() < 0.5) {
    const randomTag = SETTLEMENT_NAME_TAGS[Math.floor(Math.random() * SETTLEMENT_NAME_TAGS.length)];
    return `${baseName} ${randomTag}`;
  }
  
  return baseName;
};

// ==================== STARSHIP HELPERS ====================

const getStarshipOracle = (starforgedData, oracleName) => {
  const category = getOracleCategory(starforgedData, 'Starships');
  return getOracleFromCategory(category, oracleName);
};

const getStarshipOracleOptions = (starforgedData, oracleName) => {
  const oracle = getStarshipOracle(starforgedData, oracleName);
  return extractOracleOptions(oracle);
};

const rollStarshipOracle = (starforgedData, oracleName) => {
  const oracle = getStarshipOracle(starforgedData, oracleName);
  return rollOracleResult(oracle);
};

const generateStarshipName = (starforgedData) => {
  const category = getOracleCategory(starforgedData, 'Starships');
  if (!category) return null;
  
  const nameOracle = getOracleFromCategory(category, 'Name');
  if (!nameOracle?.Table) return null;
  
  const result = rollOnTable(nameOracle.Table);
  return parseOracleResult(result);
};

// ==================== DERELICT HELPERS ====================

const getDerelictOracle = (starforgedData, oracleName) => {
  const category = getOracleCategory(starforgedData, 'Derelicts');
  return getOracleFromCategory(category, oracleName);
};

const getDerelictSubOracle = (starforgedData, subCategoryName, oracleName) => {
  const category = getOracleCategory(starforgedData, 'Derelicts');
  return getOracleFromSubCategory(category, subCategoryName, oracleName);
};

const getDerelictOracleOptions = (starforgedData, oracleName) => {
  const oracle = getDerelictOracle(starforgedData, oracleName);
  return extractOracleOptions(oracle);
};

const rollDerelictOracle = (starforgedData, oracleName) => {
  const oracle = getDerelictOracle(starforgedData, oracleName);
  return rollOracleResult(oracle);
};

// ==================== PRECURSOR VAULT HELPERS ====================

const getVaultOracle = (starforgedData, oracleName) => {
  const category = getOracleCategory(starforgedData, 'Vaults');
  return getOracleFromCategory(category, oracleName);
};

const getVaultOracleOptions = (starforgedData, oracleName) => {
  const oracle = getVaultOracle(starforgedData, oracleName);
  return extractOracleOptions(oracle);
};

const rollVaultOracle = (starforgedData, oracleName) => {
  const oracle = getVaultOracle(starforgedData, oracleName);
  return rollOracleResult(oracle);
};

// ==================== CREATURE HELPERS ====================

const getCreatureOracle = (starforgedData, oracleName) => {
  const category = getOracleCategory(starforgedData, 'Creatures');
  return getOracleFromCategory(category, oracleName);
};

const getCreatureOracleOptions = (starforgedData, oracleName) => {
  const oracle = getCreatureOracle(starforgedData, oracleName);
  return extractOracleOptions(oracle);
};

const rollCreatureOracle = (starforgedData, oracleName) => {
  const oracle = getCreatureOracle(starforgedData, oracleName);
  return rollOracleResult(oracle);
};

// Get creature basic form based on environment
const getCreatureBasicFormOracle = (starforgedData, environment) => {
  const category = getOracleCategory(starforgedData, 'Creatures');
  if (!category?.Oracles) return null;
  
  // Look for Basic Form oracle that might have environment-specific tables
  const formOracle = category.Oracles.find(o => 
    o.Name === 'Basic Form' || o.Name.toLowerCase().includes('basic form')
  );
  
  if (formOracle?.Oracles && environment) {
    // Try to find environment-specific form oracle
    const envOracle = formOracle.Oracles.find(o => 
      o.Name.toLowerCase().includes(environment.toLowerCase())
    );
    if (envOracle) return envOracle;
  }
  
  return formOracle;
};

const getCreatureBasicFormOptions = (starforgedData, environment) => {
  const oracle = getCreatureBasicFormOracle(starforgedData, environment);
  return extractOracleOptions(oracle);
};

const rollCreatureBasicForm = (starforgedData, environment) => {
  const oracle = getCreatureBasicFormOracle(starforgedData, environment);
  return rollOracleResult(oracle);
};

// ==================== CHARACTER ORACLE HELPERS ====================

const getCharacterOracle = (starforgedData, oracleName) => {
  const category = getOracleCategory(starforgedData, 'Characters');
  if (!category) return null;
  
  // First try direct oracle lookup
  let oracle = getOracleFromCategory(category, oracleName);
  if (oracle) return oracle;
  
  // For name-related oracles, they might be nested under a "Name" parent oracle
  const nameOracle = getOracleFromCategory(category, 'Name');
  if (nameOracle?.Oracles) {
    oracle = nameOracle.Oracles.find(o => 
      o.Name === oracleName || 
      o.Name.toLowerCase().includes(oracleName.toLowerCase())
    );
    if (oracle) return oracle;
  }
  
  // Also check sub-categories
  if (category.Categories) {
    for (const subCat of category.Categories) {
      if (subCat.Oracles) {
        oracle = subCat.Oracles.find(o => 
          o.Name === oracleName || 
          o.Name.toLowerCase().includes(oracleName.toLowerCase())
        );
        if (oracle) return oracle;
      }
    }
  }
  
  return null;
};

const getCharacterOracleOptions = (starforgedData, oracleName) => {
  const oracle = getCharacterOracle(starforgedData, oracleName);
  return extractOracleOptions(oracle);
};

const rollCharacterOracle = (starforgedData, oracleName) => {
  const oracle = getCharacterOracle(starforgedData, oracleName);
  return rollOracleResult(oracle);
};

// ==================== CORE ORACLE HELPERS ====================

const getCoreOracle = (starforgedData, oracleName) => {
  const category = getOracleCategory(starforgedData, 'Core');
  if (!category) return null;
  
  // Direct oracle lookup
  let oracle = getOracleFromCategory(category, oracleName);
  if (oracle) return oracle;
  
  // Check sub-categories (Core might have nested structure)
  if (category.Categories) {
    for (const subCat of category.Categories) {
      if (subCat.Oracles) {
        oracle = subCat.Oracles.find(o => 
          o.Name === oracleName || 
          o.Name.toLowerCase().includes(oracleName.toLowerCase())
        );
        if (oracle) return oracle;
      }
    }
  }
  
  return null;
};

const getCoreOracleOptions = (starforgedData, oracleName) => {
  const oracle = getCoreOracle(starforgedData, oracleName);
  return extractOracleOptions(oracle);
};

const rollCoreOracle = (starforgedData, oracleName) => {
  const oracle = getCoreOracle(starforgedData, oracleName);
  return rollOracleResult(oracle);
};

export const ExploreTab = ({ 
  viewName, 
  scrollProps = {}
}) => {
  const { data: starforgedData } = useStarforgedContext();
  const { navigate, goBack } = useNavigationContext();
  const {
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
  } = useExploreContext();

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
  const [newLocationConnected, setNewLocationConnected] = useState(true);
  const [newPlanetClass, setNewPlanetClass] = useState('');
  const [newPlanetName, setNewPlanetName] = useState('');
  const [newPlanetAtmosphere, setNewPlanetAtmosphere] = useState('');
  const [newPlanetSettlements, setNewPlanetSettlements] = useState('');
  const [newPlanetObserved, setNewPlanetObserved] = useState('');
  const [newPlanetFeature, setNewPlanetFeature] = useState('');
  const [newPlanetLife, setNewPlanetLife] = useState('');
  const [newPlanetPeril, setNewPlanetPeril] = useState('');
  const [newPlanetOpportunity, setNewPlanetOpportunity] = useState('');
  
  // Stellar Object state
  const [newStellarType, setNewStellarType] = useState('');
  
  // Settlement state
  const [newSettlementName, setNewSettlementName] = useState('');
  const [newSettlementLocation, setNewSettlementLocation] = useState('');
  const [newSettlementPopulation, setNewSettlementPopulation] = useState('');
  const [newSettlementFirstLook, setNewSettlementFirstLook] = useState('');
  const [newSettlementInitialContact, setNewSettlementInitialContact] = useState('');
  const [newSettlementAuthority, setNewSettlementAuthority] = useState('');
  const [newSettlementProjects, setNewSettlementProjects] = useState('');
  const [newSettlementTrouble, setNewSettlementTrouble] = useState('');
  
  // Starship state
  const [newStarshipName, setNewStarshipName] = useState('');
  const [newStarshipType, setNewStarshipType] = useState('');
  const [newStarshipFleet, setNewStarshipFleet] = useState('');
  const [newStarshipInitialContact, setNewStarshipInitialContact] = useState('');
  const [newStarshipFirstLook, setNewStarshipFirstLook] = useState('');
  const [newStarshipMission, setNewStarshipMission] = useState('');
  
  // Derelict state
  const [newDerelictLocation, setNewDerelictLocation] = useState('');
  const [newDerelictType, setNewDerelictType] = useState('');
  const [newDerelictCondition, setNewDerelictCondition] = useState('');
  const [newDerelictOuterFirstLook, setNewDerelictOuterFirstLook] = useState('');
  const [newDerelictInnerFirstLook, setNewDerelictInnerFirstLook] = useState('');
  
  // Precursor Vault state
  const [newVaultLocation, setNewVaultLocation] = useState('');
  const [newVaultScale, setNewVaultScale] = useState('');
  const [newVaultForm, setNewVaultForm] = useState('');
  const [newVaultShape, setNewVaultShape] = useState('');
  const [newVaultMaterial, setNewVaultMaterial] = useState('');
  const [newVaultOuterFirstLook, setNewVaultOuterFirstLook] = useState('');
  
  // Creature state
  const [newCreatureEnvironment, setNewCreatureEnvironment] = useState('');
  const [newCreatureScale, setNewCreatureScale] = useState('');
  const [newCreatureForm, setNewCreatureForm] = useState('');
  const [newCreatureFirstLook, setNewCreatureFirstLook] = useState('');
  const [newCreatureBehavior, setNewCreatureBehavior] = useState('');
  const [newCreatureAspect, setNewCreatureAspect] = useState('');
  
  // Character state
  const [newCharacterName, setNewCharacterName] = useState('');
  const [newCharacterFirstLook, setNewCharacterFirstLook] = useState('');
  const [newCharacterDisposition, setNewCharacterDisposition] = useState('');
  const [newCharacterRole, setNewCharacterRole] = useState('');
  const [newCharacterGoal, setNewCharacterGoal] = useState('');
  
  // Custom entity state
  const [newCustomName, setNewCustomName] = useState('');
  const [newCustomAction, setNewCustomAction] = useState('');
  const [newCustomTheme, setNewCustomTheme] = useState('');
  const [newCustomDescriptor, setNewCustomDescriptor] = useState('');
  const [newCustomFocus, setNewCustomFocus] = useState('');
  
  // Sub-location modal state (for planets)
  const [showSubLocationModal, setShowSubLocationModal] = useState(false);
  const [subLocationPlacement, setSubLocationPlacement] = useState(null); // 'orbit' or 'planetside'
  const [currentLocationId, setCurrentLocationId] = useState(null);
  const [newSubLocationType, setNewSubLocationType] = useState(null);

  // Onboard entity modal state (for starships)
  const [showOnboardModal, setShowOnboardModal] = useState(false);
  const [currentSubLocationId, setCurrentSubLocationId] = useState(null);
  const [newOnboardEntityType, setNewOnboardEntityType] = useState(null);
  const [onboardTargetType, setOnboardTargetType] = useState(null); // 'location' or 'sublocation'
  const [parentEntityType, setParentEntityType] = useState(null); // Track parent type for modal title

  // Deeply nested entity modal state (for entities within nested entities)
  const [showDeepNestedModal, setShowDeepNestedModal] = useState(false);
  const [currentParentEntityId, setCurrentParentEntityId] = useState(null);
  const [newDeepNestedEntityType, setNewDeepNestedEntityType] = useState(null);
  const [deepNestedTargetType, setDeepNestedTargetType] = useState(null); // 'location-nested' or 'sublocation-nested'

  // Edit mode state for entity detail views
  const [isEditingSector, setIsEditingSector] = useState(false);
  const [isEditingLocation, setIsEditingLocation] = useState(false);
  const [isEditingSubLocation, setIsEditingSubLocation] = useState(false);
  const [isEditingNestedEntity, setIsEditingNestedEntity] = useState(false);
  const [isEditingLocationNestedEntity, setIsEditingLocationNestedEntity] = useState(false);
  const [isEditingLocationNestedEntityChild, setIsEditingLocationNestedEntityChild] = useState(false);
  const [isEditingNestedEntityChild, setIsEditingNestedEntityChild] = useState(false);

  // Confirmation dialog state
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [confirmDialogMessage, setConfirmDialogMessage] = useState('');
  const [confirmDialogCallback, setConfirmDialogCallback] = useState(null);

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
    
    let name;
    let data = { connected: newLocationConnected };
    
    switch (newLocationType) {
      case 'planet':
        name = newPlanetName.trim() || newPlanetClass.trim();
        data = {
          ...data,
          planetClass: newPlanetClass.trim(),
          planetName: newPlanetName.trim(),
          atmosphere: newPlanetAtmosphere,
          settlements: newPlanetSettlements,
          observed: newPlanetObserved,
          feature: newPlanetFeature,
          life: newPlanetLife,
          peril: newPlanetPeril,
          opportunity: newPlanetOpportunity
        };
        break;
      
      case 'stellar':
        name = newStellarType || 'Stellar Object';
        data = {
          ...data,
          stellarType: newStellarType
        };
        break;
      
      case 'settlement':
        name = newSettlementName || 'Settlement';
        data = {
          ...data,
          settlementName: newSettlementName,
          location: newSettlementLocation,
          population: newSettlementPopulation,
          firstLook: newSettlementFirstLook,
          initialContact: newSettlementInitialContact,
          authority: newSettlementAuthority,
          projects: newSettlementProjects,
          trouble: newSettlementTrouble
        };
        break;
      
      case 'starship':
        name = newStarshipName || newStarshipType || 'Starship';
        data = {
          ...data,
          starshipName: newStarshipName,
          starshipType: newStarshipType,
          fleet: newStarshipFleet,
          initialContact: newStarshipInitialContact,
          firstLook: newStarshipFirstLook,
          mission: newStarshipMission
        };
        break;
      
      case 'derelict':
        name = newDerelictType ? `${newDerelictType} Derelict` : 'Derelict';
        data = {
          ...data,
          derelictLocation: newDerelictLocation,
          derelictType: newDerelictType,
          condition: newDerelictCondition,
          outerFirstLook: newDerelictOuterFirstLook,
          innerFirstLook: newDerelictInnerFirstLook
        };
        break;
      
      case 'vault':
        name = 'Precursor Vault';
        data = {
          ...data,
          vaultLocation: newVaultLocation,
          scale: newVaultScale,
          form: newVaultForm,
          shape: newVaultShape,
          material: newVaultMaterial,
          outerFirstLook: newVaultOuterFirstLook
        };
        break;
      
      case 'creature':
        name = newCreatureForm || 'Creature';
        data = {
          ...data,
          environment: newCreatureEnvironment,
          creatureScale: newCreatureScale,
          basicForm: newCreatureForm,
          firstLook: newCreatureFirstLook,
          encounteredBehavior: newCreatureBehavior,
          revealedAspect: newCreatureAspect
        };
        break;
      
      case 'custom':
        name = newCustomName || 'Custom Location';
        data = {
          ...data,
          customName: newCustomName,
          action: newCustomAction,
          theme: newCustomTheme,
          descriptor: newCustomDescriptor,
          focus: newCustomFocus
        };
        break;
      
      default:
        name = 'Location';
    }
    
    addLocation(currentSectorId, name, newLocationType, data);
    setNewLocationType(null);
    resetAllEntityFields();
    setShowLocationModal(false);
  };

  const closeLocationModal = () => {
    setNewLocationType(null);
    setNewLocationConnected(true);
    resetAllEntityFields();
    setShowLocationModal(false);
  };

  const createSubLocation = () => {
    if (!currentSectorId || !currentLocationId || !newSubLocationType || !subLocationPlacement) return;
    
    let name;
    let data = {};
    
    switch (newSubLocationType) {
      case 'settlement':
        name = newSettlementName || 'Settlement';
        data = {
          settlementName: newSettlementName,
          location: newSettlementLocation,
          population: newSettlementPopulation,
          firstLook: newSettlementFirstLook,
          initialContact: newSettlementInitialContact,
          authority: newSettlementAuthority,
          projects: newSettlementProjects,
          trouble: newSettlementTrouble
        };
        break;
      
      case 'starship':
        name = newStarshipName || newStarshipType || 'Starship';
        data = {
          starshipName: newStarshipName,
          starshipType: newStarshipType,
          fleet: newStarshipFleet,
          initialContact: newStarshipInitialContact,
          firstLook: newStarshipFirstLook,
          mission: newStarshipMission
        };
        break;
      
      case 'derelict':
        name = newDerelictType ? `${newDerelictType} Derelict` : 'Derelict';
        data = {
          derelictLocation: newDerelictLocation,
          derelictType: newDerelictType,
          condition: newDerelictCondition,
          outerFirstLook: newDerelictOuterFirstLook,
          innerFirstLook: newDerelictInnerFirstLook
        };
        break;
      
      case 'vault':
        name = 'Precursor Vault';
        data = {
          vaultLocation: newVaultLocation,
          scale: newVaultScale,
          form: newVaultForm,
          shape: newVaultShape,
          material: newVaultMaterial,
          outerFirstLook: newVaultOuterFirstLook
        };
        break;
      
      case 'creature':
        name = newCreatureForm || 'Creature';
        data = {
          environment: newCreatureEnvironment,
          creatureScale: newCreatureScale,
          basicForm: newCreatureForm,
          firstLook: newCreatureFirstLook,
          encounteredBehavior: newCreatureBehavior,
          revealedAspect: newCreatureAspect
        };
        break;
      
      case 'character':
        name = newCharacterName || 'Character';
        data = {
          characterName: newCharacterName,
          firstLook: newCharacterFirstLook,
          initialDisposition: newCharacterDisposition,
          role: newCharacterRole,
          goal: newCharacterGoal
        };
        break;
      
      case 'custom':
        name = newCustomName || 'Custom Location';
        data = {
          customName: newCustomName,
          action: newCustomAction,
          theme: newCustomTheme,
          descriptor: newCustomDescriptor,
          focus: newCustomFocus
        };
        break;
      
      default:
        name = 'Location';
    }
    
    addSubLocation(currentSectorId, currentLocationId, name, newSubLocationType, subLocationPlacement, data);
    setNewSubLocationType(null);
    resetAllEntityFields();
    setShowSubLocationModal(false);
  };

  const closeSubLocationModal = () => {
    setNewSubLocationType(null);
    setSubLocationPlacement(null);
    resetAllEntityFields();
    setShowSubLocationModal(false);
  };

  const createOnboardEntity = () => {
    if (!currentSectorId || !currentLocationId || !newOnboardEntityType) return;
    // For sublocation targets, we also need currentSubLocationId
    if (onboardTargetType === 'sublocation' && !currentSubLocationId) return;
    
    let name;
    let data = {};
    
    switch (newOnboardEntityType) {
      case 'character':
        name = newCharacterName || 'Character';
        data = {
          characterName: newCharacterName,
          firstLook: newCharacterFirstLook,
          initialDisposition: newCharacterDisposition,
          role: newCharacterRole,
          goal: newCharacterGoal
        };
        break;
      
      case 'creature':
        name = newCreatureForm || 'Creature';
        data = {
          environment: newCreatureEnvironment,
          creatureScale: newCreatureScale,
          basicForm: newCreatureForm,
          firstLook: newCreatureFirstLook,
          encounteredBehavior: newCreatureBehavior,
          revealedAspect: newCreatureAspect
        };
        break;
      
      case 'custom':
        name = newCustomName || 'Custom Entity';
        data = {
          customName: newCustomName,
          action: newCustomAction,
          theme: newCustomTheme,
          descriptor: newCustomDescriptor,
          focus: newCustomFocus
        };
        break;
      
      case 'starship':
        name = newStarshipName || newStarshipType || 'Starship';
        data = {
          starshipName: newStarshipName,
          starshipType: newStarshipType,
          fleet: newStarshipFleet,
          initialContact: newStarshipInitialContact,
          firstLook: newStarshipFirstLook,
          mission: newStarshipMission
        };
        break;
      
      default:
        name = 'Entity';
    }
    
    if (onboardTargetType === 'location') {
      addLocationNestedEntity(currentSectorId, currentLocationId, name, newOnboardEntityType, data);
    } else {
      addNestedEntity(currentSectorId, currentLocationId, currentSubLocationId, name, newOnboardEntityType, data);
    }
    setNewOnboardEntityType(null);
    setOnboardTargetType(null);
    resetAllEntityFields();
    setShowOnboardModal(false);
  };

  const closeOnboardModal = () => {
    setNewOnboardEntityType(null);
    setOnboardTargetType(null);
    setParentEntityType(null);
    resetAllEntityFields();
    setShowOnboardModal(false);
  };

  const createDeepNestedEntity = () => {
    if (!currentSectorId || !currentLocationId || !currentParentEntityId || !newDeepNestedEntityType) return;
    // For sublocation-nested targets, we also need currentSubLocationId
    if (deepNestedTargetType === 'sublocation-nested' && !currentSubLocationId) return;
    
    let name;
    let data = {};
    
    switch (newDeepNestedEntityType) {
      case 'character':
        name = newCharacterName || 'Character';
        data = {
          characterName: newCharacterName,
          firstLook: newCharacterFirstLook,
          initialDisposition: newCharacterDisposition,
          role: newCharacterRole,
          goal: newCharacterGoal
        };
        break;
      
      case 'creature':
        name = newCreatureForm || 'Creature';
        data = {
          environment: newCreatureEnvironment,
          creatureScale: newCreatureScale,
          basicForm: newCreatureForm,
          firstLook: newCreatureFirstLook,
          encounteredBehavior: newCreatureBehavior,
          revealedAspect: newCreatureAspect
        };
        break;
      
      case 'custom':
        name = newCustomName || 'Custom Entity';
        data = {
          customName: newCustomName,
          action: newCustomAction,
          theme: newCustomTheme,
          descriptor: newCustomDescriptor,
          focus: newCustomFocus
        };
        break;
      
      case 'starship':
        name = newStarshipName || newStarshipType || 'Starship';
        data = {
          starshipName: newStarshipName,
          starshipType: newStarshipType,
          fleet: newStarshipFleet,
          initialContact: newStarshipInitialContact,
          firstLook: newStarshipFirstLook,
          mission: newStarshipMission
        };
        break;
      
      default:
        name = 'Entity';
    }
    
    if (deepNestedTargetType === 'location-nested') {
      addLocationNestedEntityChild(currentSectorId, currentLocationId, currentParentEntityId, name, newDeepNestedEntityType, data);
    } else {
      addNestedEntityChild(currentSectorId, currentLocationId, currentSubLocationId, currentParentEntityId, name, newDeepNestedEntityType, data);
    }
    setNewDeepNestedEntityType(null);
    setDeepNestedTargetType(null);
    setCurrentParentEntityId(null);
    resetAllEntityFields();
    setShowDeepNestedModal(false);
  };

  const closeDeepNestedModal = () => {
    setNewDeepNestedEntityType(null);
    setDeepNestedTargetType(null);
    setCurrentParentEntityId(null);
    setParentEntityType(null);
    resetAllEntityFields();
    setShowDeepNestedModal(false);
  };
  
  const resetAllEntityFields = () => {
    // Planet fields
    setNewPlanetClass('');
    setNewPlanetName('');
    setNewPlanetAtmosphere('');
    setNewPlanetSettlements('');
    setNewPlanetObserved('');
    setNewPlanetFeature('');
    setNewPlanetLife('');
    setNewPlanetPeril('');
    setNewPlanetOpportunity('');
    // Stellar fields
    setNewStellarType('');
    // Settlement fields
    setNewSettlementName('');
    setNewSettlementLocation('');
    setNewSettlementPopulation('');
    setNewSettlementFirstLook('');
    setNewSettlementInitialContact('');
    setNewSettlementAuthority('');
    setNewSettlementProjects('');
    setNewSettlementTrouble('');
    // Starship fields
    setNewStarshipName('');
    setNewStarshipType('');
    setNewStarshipFleet('');
    setNewStarshipInitialContact('');
    setNewStarshipFirstLook('');
    setNewStarshipMission('');
    // Derelict fields
    setNewDerelictLocation('');
    setNewDerelictType('');
    setNewDerelictCondition('');
    setNewDerelictOuterFirstLook('');
    setNewDerelictInnerFirstLook('');
    // Vault fields
    setNewVaultLocation('');
    setNewVaultScale('');
    setNewVaultForm('');
    setNewVaultShape('');
    setNewVaultMaterial('');
    setNewVaultOuterFirstLook('');
    // Creature fields
    setNewCreatureEnvironment('');
    setNewCreatureScale('');
    setNewCreatureForm('');
    setNewCreatureFirstLook('');
    setNewCreatureBehavior('');
    setNewCreatureAspect('');
    // Character fields
    setNewCharacterName('');
    setNewCharacterFirstLook('');
    setNewCharacterDisposition('');
    setNewCharacterRole('');
    setNewCharacterGoal('');
    // Custom fields
    setNewCustomName('');
    setNewCustomAction('');
    setNewCustomTheme('');
    setNewCustomDescriptor('');
    setNewCustomFocus('');
  };
  
  const resetPlanetFields = () => {
    setNewPlanetClass('');
    setNewPlanetName('');
    setNewPlanetAtmosphere('');
    setNewPlanetSettlements('');
    setNewPlanetObserved('');
    setNewPlanetFeature('');
    setNewPlanetLife('');
    setNewPlanetPeril('');
    setNewPlanetOpportunity('');
  };

  // Roll all planet fields based on a given class
  const rollAllPlanetFields = (planetClass, sectorId) => {
    if (!planetClass) return;
    
    const sector = getSector(sectorId);
    const region = sector?.region ? sector.region.charAt(0).toUpperCase() + sector.region.slice(1) : 'Terminus';
    
    // Roll each field
    const name = rollPlanetName(starforgedData, planetClass);
    const atmosphere = rollPlanetOracle(starforgedData, planetClass, 'Atmosphere');
    const settlements = rollPlanetOracle(starforgedData, planetClass, 'Settlements', region);
    const observed = rollPlanetOracle(starforgedData, planetClass, 'Observed From Space');
    const feature = rollPlanetOracle(starforgedData, planetClass, 'Feature');
    const life = rollPlanetOracle(starforgedData, planetClass, 'Life');
    
    // Set all the values
    if (name) setNewPlanetName(name);
    if (atmosphere) setNewPlanetAtmosphere(atmosphere);
    if (settlements) setNewPlanetSettlements(settlements);
    if (observed) setNewPlanetObserved(observed);
    if (feature) setNewPlanetFeature(feature);
    if (life) {
      setNewPlanetLife(life);
      // Roll peril and opportunity based on life status
      const hasLife = planetHasLife(life);
      const peril = rollPerilOracle(starforgedData, planetClass, hasLife);
      const opportunity = rollOpportunityOracle(starforgedData, planetClass, hasLife);
      if (peril) setNewPlanetPeril(peril);
      if (opportunity) setNewPlanetOpportunity(opportunity);
    }
  };

  // Roll all stellar object fields
  const rollAllStellarFields = () => {
    const stellarType = rollStellarObject(starforgedData);
    if (stellarType) setNewStellarType(stellarType);
  };

  // Roll all settlement fields
  const rollAllSettlementFields = (sectorId) => {
    const sector = getSector(sectorId);
    const region = sector?.region ? sector.region.charAt(0).toUpperCase() + sector.region.slice(1) : 'Terminus';
    
    const name = generateSettlementName(starforgedData);
    const location = rollSettlementOracle(starforgedData, 'Location');
    const population = rollSettlementOracle(starforgedData, 'Population', region);
    const firstLook = rollSettlementOracle(starforgedData, 'First Look');
    const initialContact = rollSettlementOracle(starforgedData, 'Initial Contact');
    const authority = rollSettlementOracle(starforgedData, 'Authority');
    const projects = rollSettlementOracle(starforgedData, 'Projects');
    const trouble = rollSettlementOracle(starforgedData, 'Trouble');
    
    if (name) setNewSettlementName(name);
    if (location) setNewSettlementLocation(location);
    if (population) setNewSettlementPopulation(population);
    if (firstLook) setNewSettlementFirstLook(firstLook);
    if (initialContact) setNewSettlementInitialContact(initialContact);
    if (authority) setNewSettlementAuthority(authority);
    if (projects) setNewSettlementProjects(projects);
    if (trouble) setNewSettlementTrouble(trouble);
  };

  // Roll all starship fields
  const rollAllStarshipFields = () => {
    const name = generateStarshipName(starforgedData);
    const type = rollStarshipOracle(starforgedData, 'Type');
    const fleet = rollStarshipOracle(starforgedData, 'Fleet');
    const initialContact = rollStarshipOracle(starforgedData, 'Initial Contact');
    const firstLook = rollStarshipOracle(starforgedData, 'First Look');
    const mission = rollStarshipOracle(starforgedData, 'Mission');
    
    if (name) setNewStarshipName(name);
    if (type) setNewStarshipType(type);
    if (fleet) setNewStarshipFleet(fleet);
    if (initialContact) setNewStarshipInitialContact(initialContact);
    if (firstLook) setNewStarshipFirstLook(firstLook);
    if (mission) setNewStarshipMission(mission);
  };

  // Roll all derelict fields
  const rollAllDerelictFields = () => {
    const location = rollDerelictOracle(starforgedData, 'Location');
    const type = rollDerelictOracle(starforgedData, 'Type');
    const condition = rollDerelictOracle(starforgedData, 'Condition');
    const outerFirstLook = rollDerelictOracle(starforgedData, 'Outer First Look');
    const innerFirstLook = rollDerelictOracle(starforgedData, 'Inner First Look');
    
    if (location) setNewDerelictLocation(location);
    if (type) setNewDerelictType(type);
    if (condition) setNewDerelictCondition(condition);
    if (outerFirstLook) setNewDerelictOuterFirstLook(outerFirstLook);
    if (innerFirstLook) setNewDerelictInnerFirstLook(innerFirstLook);
  };

  // Roll all vault fields
  const rollAllVaultFields = () => {
    const location = rollVaultOracle(starforgedData, 'Location');
    const scale = rollVaultOracle(starforgedData, 'Scale');
    const form = rollVaultOracle(starforgedData, 'Form');
    const shape = rollVaultOracle(starforgedData, 'Shape');
    const material = rollVaultOracle(starforgedData, 'Material');
    const outerFirstLook = rollVaultOracle(starforgedData, 'Outer First Look');
    
    if (location) setNewVaultLocation(location);
    if (scale) setNewVaultScale(scale);
    if (form) setNewVaultForm(form);
    if (shape) setNewVaultShape(shape);
    if (material) setNewVaultMaterial(material);
    if (outerFirstLook) setNewVaultOuterFirstLook(outerFirstLook);
  };

  // Roll all creature fields
  const rollAllCreatureFields = () => {
    const environment = rollCreatureOracle(starforgedData, 'Environment');
    const scale = rollCreatureOracle(starforgedData, 'Scale');
    const firstLook = rollCreatureOracle(starforgedData, 'First Look');
    const behavior = rollCreatureOracle(starforgedData, 'Encountered Behavior');
    const aspect = rollCreatureOracle(starforgedData, 'Revealed Aspect');
    
    if (environment) {
      setNewCreatureEnvironment(environment);
      // Roll basic form based on environment
      const form = rollCreatureBasicForm(starforgedData, environment);
      if (form) setNewCreatureForm(form);
    }
    if (scale) setNewCreatureScale(scale);
    if (firstLook) setNewCreatureFirstLook(firstLook);
    if (behavior) setNewCreatureBehavior(behavior);
    if (aspect) setNewCreatureAspect(aspect);
  };

  // Roll all character fields
  const rollAllCharacterFields = () => {
    const givenName = rollCharacterOracle(starforgedData, 'Given Name');
    const familyName = rollCharacterOracle(starforgedData, 'Family Name');
    const callsign = rollCharacterOracle(starforgedData, 'Callsign');
    const firstLook = rollCharacterOracle(starforgedData, 'First Look');
    const disposition = rollCharacterOracle(starforgedData, 'Initial Disposition');
    const role = rollCharacterOracle(starforgedData, 'Role');
    const goal = rollCharacterOracle(starforgedData, 'Goal');
    
    // Build name in format: Given "Callsign" Family
    if (givenName && callsign && familyName) {
      setNewCharacterName(`${givenName} "${callsign}" ${familyName}`);
    } else if (givenName && familyName) {
      setNewCharacterName(`${givenName} ${familyName}`);
    } else if (givenName) {
      setNewCharacterName(givenName);
    }
    if (firstLook) setNewCharacterFirstLook(firstLook);
    if (disposition) setNewCharacterDisposition(disposition);
    if (role) setNewCharacterRole(role);
    if (goal) setNewCharacterGoal(goal);
  };
  
  // Generate a random character name
  const generateCharacterName = () => {
    const givenName = rollCharacterOracle(starforgedData, 'Given Name');
    const familyName = rollCharacterOracle(starforgedData, 'Family Name');
    const callsign = rollCharacterOracle(starforgedData, 'Callsign');
    
    if (givenName && callsign && familyName) {
      return `${givenName} "${callsign}" ${familyName}`;
    } else if (givenName && familyName) {
      return `${givenName} ${familyName}`;
    }
    return givenName || familyName || callsign || null;
  };

  // Roll all custom fields using Core oracles
  const rollAllCustomFields = () => {
    const action = rollCoreOracle(starforgedData, 'Action');
    const theme = rollCoreOracle(starforgedData, 'Theme');
    const descriptor = rollCoreOracle(starforgedData, 'Descriptor');
    const focus = rollCoreOracle(starforgedData, 'Focus');
    
    if (action) setNewCustomAction(action);
    if (theme) setNewCustomTheme(theme);
    if (descriptor) setNewCustomDescriptor(descriptor);
    if (focus) setNewCustomFocus(focus);
    
    // Generate a name from descriptor + focus
    if (descriptor && focus) {
      setNewCustomName(`${descriptor} ${focus}`);
    }
  };

  const getEntityTypeInfo = (type) => {
    const types = {
      stellar: { icon: '🌌', iconBg: 'rgba(0, 122, 255, 0.3)', label: 'Stellar Object' },      // Space
      planet: { icon: '🪐', iconBg: 'rgba(255, 149, 0, 0.3)', label: 'Planet' },               // Planets
      settlement: { icon: '🏙️', iconBg: 'rgba(175, 82, 222, 0.3)', label: 'Settlement' },     // Settlements
      starship: { icon: '🚀', iconBg: 'rgba(88, 86, 214, 0.3)', label: 'Starship' },           // Starships
      derelict: { icon: '🛰️', iconBg: 'rgba(142, 142, 147, 0.3)', label: 'Derelict' },        // Derelicts
      vault: { icon: '🔐', iconBg: 'rgba(255, 59, 48, 0.3)', label: 'Precursor Vault' },       // Vaults
      creature: { icon: '👾', iconBg: 'rgba(52, 199, 89, 0.3)', label: 'Creature' },           // Creatures
      character: { icon: '👤', iconBg: 'rgba(255, 204, 0, 0.3)', label: 'Character' },         // Characters
      custom: { icon: '⭐', iconBg: 'rgba(255, 204, 0, 0.3)', label: 'Custom' }
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
              onClick={() => {
                const name = generateSectorName(starforgedData);
                if (name) setNewSectorName(name);
                setShowSectorModal(true);
              }}
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
        <ConfirmDialog
          isOpen={showConfirmDialog}
          message={confirmDialogMessage}
          onConfirm={() => {
            setShowConfirmDialog(false);
            if (confirmDialogCallback) {
              confirmDialogCallback();
            }
          }}
          onCancel={() => {
            setShowConfirmDialog(false);
          }}
        />
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
          onBack={() => {
            if (isEditingSector) {
              // Cancel edit mode
              setIsEditingSector(false);
            } else {
              goBack();
            }
          }}
          backButtonText={isEditingSector ? 'Cancel' : 'Back'}
          rightActionText={isEditingSector ? 'Save' : 'Edit'}
          onRightActionText={() => {
            if (isEditingSector) {
              // TODO: Implement save logic
              console.log('Save sector:', sectorId);
              setIsEditingSector(false);
            } else {
              setIsEditingSector(true);
            }
          }}
          {...scrollProps}
        >
          <DetailCard
            icon={getRegionIcon(sector.region)}
            iconBg={getRegionIconBg(sector.region)}
            title={sector.name}
            description={getRegionLabel(sector.region)}
          />
          <MenuGroup title="Connected">
            {(() => {
              const connectedLocations = (sector.locations || []).filter(l => l.connected !== false);
              return connectedLocations.length === 0 ? (
                <MenuItem 
                  label="No entities yet"
                  showChevron={false}
                  muted={true}
                />
              ) : (
                connectedLocations.map(location => {
                  const typeInfo = getEntityTypeInfo(location.type) || { icon: '📍', label: 'Location' };
                  const entityCount = (location.subLocations || []).length;
                  return (
                    <MenuItem 
                      key={location.id}
                      icon={typeInfo.icon}
                      iconBg={typeInfo.iconBg}
                      label={location.name}
                      value={entityCount > 0 ? entityCount : undefined}
                      onClick={() => navigate(`location-${sectorId}-${location.id}`)}
                    />
                  );
                })
              );
            })()}
            <MenuItem 
              label="Add entity"
              onClick={() => {
                setCurrentSectorId(sectorId);
                setNewLocationConnected(true);
                setShowLocationModal(true);
              }}
              isButton={true}
            />
          </MenuGroup>
          <MenuGroup title="Not connected">
            {(() => {
              const notConnectedLocations = (sector.locations || []).filter(l => l.connected === false);
              return notConnectedLocations.length === 0 ? (
                <MenuItem 
                  label="No entities yet"
                  showChevron={false}
                  muted={true}
                />
              ) : (
                notConnectedLocations.map(location => {
                  const typeInfo = getEntityTypeInfo(location.type) || { icon: '📍', label: 'Location' };
                  const entityCount = (location.subLocations || []).length;
                  return (
                    <MenuItem 
                      key={location.id}
                      icon={typeInfo.icon}
                      iconBg={typeInfo.iconBg}
                      label={location.name}
                      value={entityCount > 0 ? entityCount : undefined}
                      onClick={() => navigate(`location-${sectorId}-${location.id}`)}
                    />
                  );
                })
              );
            })()}
            <MenuItem 
              label="Add entity"
              onClick={() => {
                setCurrentSectorId(sectorId);
                setNewLocationConnected(false);
                setShowLocationModal(true);
              }}
              isButton={true}
            />
          </MenuGroup>
          {isEditingSector && (
            <MenuGroup>
              <MenuItem 
                label={`Remove ${sector.name}`}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setConfirmDialogMessage(`Are you sure you want to remove "${sector.name}"? This action cannot be undone.`);
                  setConfirmDialogCallback(() => () => {
                    removeSector(sectorId);
                    goBack();
                  });
                  setShowConfirmDialog(true);
                }}
                isButton={true}
                destructive={true}
              />
            </MenuGroup>
          )}
        </NavigationView>

        {/* Create Location Modal */}
        <Modal
          isOpen={showLocationModal}
          onClose={closeLocationModal}
          onBack={newLocationType ? () => { setNewLocationType(null); resetPlanetFields(); } : null}
          title={newLocationType ? getEntityTypeInfo(newLocationType).label : "Add entity"}
          action={newLocationType ? {
            label: 'Create',
            onClick: createLocation,
            disabled: (newLocationType === 'planet' && !newPlanetClass.trim()) ||
                      (newLocationType === 'stellar' && !newStellarType.trim()) ||
                      (newLocationType === 'custom' && !newCustomName.trim())
          } : null}
        >
          {!newLocationType ? (
            <MenuGroup>
              <MenuItem 
                icon="🌌"
                iconBg="rgba(0, 122, 255, 0.3)"
                label="Stellar Object"
                onClick={() => {
                  setNewLocationType('stellar');
                  rollAllStellarFields();
                }}
              />
              <MenuItem 
                icon="🪐"
                iconBg="rgba(255, 149, 0, 0.3)"
                label="Planet"
                onClick={() => {
                  setNewLocationType('planet');
                  // Auto-generate random planet class and all fields
                  const planetClass = generatePlanetClass(starforgedData);
                  if (planetClass) {
                    setNewPlanetClass(planetClass);
                    rollAllPlanetFields(planetClass, currentSectorId);
                  }
                }}
              />
              <MenuItem 
                icon="🏙️"
                iconBg="rgba(175, 82, 222, 0.3)"
                label="Settlement"
                onClick={() => {
                  setNewLocationType('settlement');
                  rollAllSettlementFields(currentSectorId);
                }}
              />
              <MenuItem 
                icon="🚀"
                iconBg="rgba(88, 86, 214, 0.3)"
                label="Starship"
                onClick={() => {
                  setNewLocationType('starship');
                  rollAllStarshipFields();
                }}
              />
              <MenuItem 
                icon="🛰️"
                iconBg="rgba(142, 142, 147, 0.3)"
                label="Derelict"
                onClick={() => {
                  setNewLocationType('derelict');
                  rollAllDerelictFields();
                }}
              />
              <MenuItem 
                icon="🔐"
                iconBg="rgba(255, 59, 48, 0.3)"
                label="Precursor Vault"
                onClick={() => {
                  setNewLocationType('vault');
                  rollAllVaultFields();
                }}
              />
              <MenuItem 
                icon="👾"
                iconBg="rgba(52, 199, 89, 0.3)"
                label="Creature"
                onClick={() => {
                  setNewLocationType('creature');
                  rollAllCreatureFields();
                }}
              />
              <MenuItem 
                icon="⭐"
                iconBg="rgba(255, 204, 0, 0.3)"
                label="Custom"
                onClick={() => {
                  setNewLocationType('custom');
                  rollAllCustomFields();
                }}
              />
            </MenuGroup>
          ) : newLocationType === 'planet' ? (
            <>
              <ModalField label="Class">
                <DiceSelect
                  value={newPlanetClass}
                  onChange={(e) => {
                    const planetClass = e.target.value;
                    setNewPlanetClass(planetClass);
                    // Roll all dependent fields with new class
                    if (planetClass) {
                      rollAllPlanetFields(planetClass, currentSectorId);
                    } else {
                      // Clear dependent fields if no class selected
                      setNewPlanetName('');
                      setNewPlanetAtmosphere('');
                      setNewPlanetSettlements('');
                      setNewPlanetObserved('');
                      setNewPlanetFeature('');
                      setNewPlanetLife('');
                      setNewPlanetPeril('');
                      setNewPlanetOpportunity('');
                    }
                  }}
                  onDiceClick={() => {
                    const planetClass = generatePlanetClass(starforgedData);
                    if (planetClass) {
                      setNewPlanetClass(planetClass);
                      // Roll all dependent fields with new class
                      rollAllPlanetFields(planetClass, currentSectorId);
                    }
                  }}
                  options={PLANET_CLASSES}
                  placeholder="Select a class..."
                />
              </ModalField>
              {newPlanetClass && (
                <>
                  <ModalField label="Name">
                    <DiceSelect
                      value={newPlanetName}
                      onChange={(e) => setNewPlanetName(e.target.value)}
                      onDiceClick={() => {
                        const result = rollPlanetName(starforgedData, newPlanetClass);
                        if (result) setNewPlanetName(result);
                      }}
                      options={getPlanetSampleNames(starforgedData, newPlanetClass).map(name => ({ value: name, label: name }))}
                      placeholder="Select name..."
                    />
                  </ModalField>
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
          ) : newLocationType === 'stellar' ? (
            <>
              <ModalField label="Stellar Object Type">
                <DiceSelect
                  value={newStellarType}
                  onChange={(e) => setNewStellarType(e.target.value)}
                  onDiceClick={() => {
                    const result = rollStellarObject(starforgedData);
                    if (result) setNewStellarType(result);
                  }}
                  options={getStellarObjectOptions(starforgedData)}
                  placeholder="Select stellar object type..."
                />
              </ModalField>
            </>
          ) : newLocationType === 'settlement' ? (
            <>
              <ModalField label="Name">
                <DiceInput
                  value={newSettlementName}
                  onChange={(e) => setNewSettlementName(e.target.value)}
                  onDiceClick={() => {
                    const name = generateSettlementName(starforgedData);
                    if (name) setNewSettlementName(name);
                  }}
                  placeholder="Enter settlement name..."
                />
              </ModalField>
              <ModalField label="Location">
                <DiceSelect
                  value={newSettlementLocation}
                  onChange={(e) => setNewSettlementLocation(e.target.value)}
                  onDiceClick={() => {
                    const result = rollSettlementOracle(starforgedData, 'Location');
                    if (result) setNewSettlementLocation(result);
                  }}
                  options={getSettlementOracleOptions(starforgedData, 'Location')}
                  placeholder="Select location..."
                />
              </ModalField>
              <ModalField label="Population">
                <DiceSelect
                  value={newSettlementPopulation}
                  onChange={(e) => setNewSettlementPopulation(e.target.value)}
                  onDiceClick={() => {
                    const sector = getSector(currentSectorId);
                    const region = sector?.region ? sector.region.charAt(0).toUpperCase() + sector.region.slice(1) : 'Terminus';
                    const result = rollSettlementOracle(starforgedData, 'Population', region);
                    if (result) setNewSettlementPopulation(result);
                  }}
                  options={(() => {
                    const sector = getSector(currentSectorId);
                    const region = sector?.region ? sector.region.charAt(0).toUpperCase() + sector.region.slice(1) : 'Terminus';
                    return getSettlementOracleOptions(starforgedData, 'Population', region);
                  })()}
                  placeholder="Select population..."
                />
              </ModalField>
              <ModalField label="First Look">
                <DiceSelect
                  value={newSettlementFirstLook}
                  onChange={(e) => setNewSettlementFirstLook(e.target.value)}
                  onDiceClick={() => {
                    const result = rollSettlementOracle(starforgedData, 'First Look');
                    if (result) setNewSettlementFirstLook(result);
                  }}
                  options={getSettlementOracleOptions(starforgedData, 'First Look')}
                  placeholder="Select first look..."
                />
              </ModalField>
              <ModalField label="Initial Contact">
                <DiceSelect
                  value={newSettlementInitialContact}
                  onChange={(e) => setNewSettlementInitialContact(e.target.value)}
                  onDiceClick={() => {
                    const result = rollSettlementOracle(starforgedData, 'Initial Contact');
                    if (result) setNewSettlementInitialContact(result);
                  }}
                  options={getSettlementOracleOptions(starforgedData, 'Initial Contact')}
                  placeholder="Select initial contact..."
                />
              </ModalField>
              <ModalField label="Authority">
                <DiceSelect
                  value={newSettlementAuthority}
                  onChange={(e) => setNewSettlementAuthority(e.target.value)}
                  onDiceClick={() => {
                    const result = rollSettlementOracle(starforgedData, 'Authority');
                    if (result) setNewSettlementAuthority(result);
                  }}
                  options={getSettlementOracleOptions(starforgedData, 'Authority')}
                  placeholder="Select authority..."
                />
              </ModalField>
              <ModalField label="Projects">
                <DiceSelect
                  value={newSettlementProjects}
                  onChange={(e) => setNewSettlementProjects(e.target.value)}
                  onDiceClick={() => {
                    const result = rollSettlementOracle(starforgedData, 'Projects');
                    if (result) setNewSettlementProjects(result);
                  }}
                  options={getSettlementOracleOptions(starforgedData, 'Projects')}
                  placeholder="Select projects..."
                />
              </ModalField>
              <ModalField label="Trouble">
                <DiceSelect
                  value={newSettlementTrouble}
                  onChange={(e) => setNewSettlementTrouble(e.target.value)}
                  onDiceClick={() => {
                    const result = rollSettlementOracle(starforgedData, 'Trouble');
                    if (result) setNewSettlementTrouble(result);
                  }}
                  options={getSettlementOracleOptions(starforgedData, 'Trouble')}
                  placeholder="Select trouble..."
                />
              </ModalField>
            </>
          ) : newLocationType === 'starship' ? (
            <>
              <ModalField label="Name">
                <DiceInput
                  value={newStarshipName}
                  onChange={(e) => setNewStarshipName(e.target.value)}
                  onDiceClick={() => {
                    const name = generateStarshipName(starforgedData);
                    if (name) setNewStarshipName(name);
                  }}
                  placeholder="Enter starship name..."
                />
              </ModalField>
              <ModalField label="Type">
                <DiceSelect
                  value={newStarshipType}
                  onChange={(e) => setNewStarshipType(e.target.value)}
                  onDiceClick={() => {
                    const result = rollStarshipOracle(starforgedData, 'Type');
                    if (result) setNewStarshipType(result);
                  }}
                  options={getStarshipOracleOptions(starforgedData, 'Type')}
                  placeholder="Select type..."
                />
              </ModalField>
              <ModalField label="Fleet">
                <DiceSelect
                  value={newStarshipFleet}
                  onChange={(e) => setNewStarshipFleet(e.target.value)}
                  onDiceClick={() => {
                    const result = rollStarshipOracle(starforgedData, 'Fleet');
                    if (result) setNewStarshipFleet(result);
                  }}
                  options={getStarshipOracleOptions(starforgedData, 'Fleet')}
                  placeholder="Select fleet..."
                />
              </ModalField>
              <ModalField label="Initial Contact">
                <DiceSelect
                  value={newStarshipInitialContact}
                  onChange={(e) => setNewStarshipInitialContact(e.target.value)}
                  onDiceClick={() => {
                    const result = rollStarshipOracle(starforgedData, 'Initial Contact');
                    if (result) setNewStarshipInitialContact(result);
                  }}
                  options={getStarshipOracleOptions(starforgedData, 'Initial Contact')}
                  placeholder="Select initial contact..."
                />
              </ModalField>
              <ModalField label="First Look">
                <DiceSelect
                  value={newStarshipFirstLook}
                  onChange={(e) => setNewStarshipFirstLook(e.target.value)}
                  onDiceClick={() => {
                    const result = rollStarshipOracle(starforgedData, 'First Look');
                    if (result) setNewStarshipFirstLook(result);
                  }}
                  options={getStarshipOracleOptions(starforgedData, 'First Look')}
                  placeholder="Select first look..."
                />
              </ModalField>
              <ModalField label="Mission">
                <DiceSelect
                  value={newStarshipMission}
                  onChange={(e) => setNewStarshipMission(e.target.value)}
                  onDiceClick={() => {
                    const result = rollStarshipOracle(starforgedData, 'Mission');
                    if (result) setNewStarshipMission(result);
                  }}
                  options={getStarshipOracleOptions(starforgedData, 'Mission')}
                  placeholder="Select mission..."
                />
              </ModalField>
            </>
          ) : newLocationType === 'derelict' ? (
            <>
              <ModalField label="Location">
                <DiceSelect
                  value={newDerelictLocation}
                  onChange={(e) => setNewDerelictLocation(e.target.value)}
                  onDiceClick={() => {
                    const result = rollDerelictOracle(starforgedData, 'Location');
                    if (result) setNewDerelictLocation(result);
                  }}
                  options={getDerelictOracleOptions(starforgedData, 'Location')}
                  placeholder="Select location..."
                />
              </ModalField>
              <ModalField label="Type">
                <DiceSelect
                  value={newDerelictType}
                  onChange={(e) => setNewDerelictType(e.target.value)}
                  onDiceClick={() => {
                    const result = rollDerelictOracle(starforgedData, 'Type');
                    if (result) setNewDerelictType(result);
                  }}
                  options={getDerelictOracleOptions(starforgedData, 'Type')}
                  placeholder="Select type..."
                />
              </ModalField>
              <ModalField label="Condition">
                <DiceSelect
                  value={newDerelictCondition}
                  onChange={(e) => setNewDerelictCondition(e.target.value)}
                  onDiceClick={() => {
                    const result = rollDerelictOracle(starforgedData, 'Condition');
                    if (result) setNewDerelictCondition(result);
                  }}
                  options={getDerelictOracleOptions(starforgedData, 'Condition')}
                  placeholder="Select condition..."
                />
              </ModalField>
              <ModalField label="Outer First Look">
                <DiceSelect
                  value={newDerelictOuterFirstLook}
                  onChange={(e) => setNewDerelictOuterFirstLook(e.target.value)}
                  onDiceClick={() => {
                    const result = rollDerelictOracle(starforgedData, 'Outer First Look');
                    if (result) setNewDerelictOuterFirstLook(result);
                  }}
                  options={getDerelictOracleOptions(starforgedData, 'Outer First Look')}
                  placeholder="Select outer first look..."
                />
              </ModalField>
              <ModalField label="Inner First Look">
                <DiceSelect
                  value={newDerelictInnerFirstLook}
                  onChange={(e) => setNewDerelictInnerFirstLook(e.target.value)}
                  onDiceClick={() => {
                    const result = rollDerelictOracle(starforgedData, 'Inner First Look');
                    if (result) setNewDerelictInnerFirstLook(result);
                  }}
                  options={getDerelictOracleOptions(starforgedData, 'Inner First Look')}
                  placeholder="Select inner first look..."
                />
              </ModalField>
            </>
          ) : newLocationType === 'vault' ? (
            <>
              <ModalField label="Location">
                <DiceSelect
                  value={newVaultLocation}
                  onChange={(e) => setNewVaultLocation(e.target.value)}
                  onDiceClick={() => {
                    const result = rollVaultOracle(starforgedData, 'Location');
                    if (result) setNewVaultLocation(result);
                  }}
                  options={getVaultOracleOptions(starforgedData, 'Location')}
                  placeholder="Select location..."
                />
              </ModalField>
              <ModalField label="Scale">
                <DiceSelect
                  value={newVaultScale}
                  onChange={(e) => setNewVaultScale(e.target.value)}
                  onDiceClick={() => {
                    const result = rollVaultOracle(starforgedData, 'Scale');
                    if (result) setNewVaultScale(result);
                  }}
                  options={getVaultOracleOptions(starforgedData, 'Scale')}
                  placeholder="Select scale..."
                />
              </ModalField>
              <ModalField label="Form">
                <DiceSelect
                  value={newVaultForm}
                  onChange={(e) => setNewVaultForm(e.target.value)}
                  onDiceClick={() => {
                    const result = rollVaultOracle(starforgedData, 'Form');
                    if (result) setNewVaultForm(result);
                  }}
                  options={getVaultOracleOptions(starforgedData, 'Form')}
                  placeholder="Select form..."
                />
              </ModalField>
              <ModalField label="Shape">
                <DiceSelect
                  value={newVaultShape}
                  onChange={(e) => setNewVaultShape(e.target.value)}
                  onDiceClick={() => {
                    const result = rollVaultOracle(starforgedData, 'Shape');
                    if (result) setNewVaultShape(result);
                  }}
                  options={getVaultOracleOptions(starforgedData, 'Shape')}
                  placeholder="Select shape..."
                />
              </ModalField>
              <ModalField label="Material">
                <DiceSelect
                  value={newVaultMaterial}
                  onChange={(e) => setNewVaultMaterial(e.target.value)}
                  onDiceClick={() => {
                    const result = rollVaultOracle(starforgedData, 'Material');
                    if (result) setNewVaultMaterial(result);
                  }}
                  options={getVaultOracleOptions(starforgedData, 'Material')}
                  placeholder="Select material..."
                />
              </ModalField>
              <ModalField label="Outer First Look">
                <DiceSelect
                  value={newVaultOuterFirstLook}
                  onChange={(e) => setNewVaultOuterFirstLook(e.target.value)}
                  onDiceClick={() => {
                    const result = rollVaultOracle(starforgedData, 'Outer First Look');
                    if (result) setNewVaultOuterFirstLook(result);
                  }}
                  options={getVaultOracleOptions(starforgedData, 'Outer First Look')}
                  placeholder="Select outer first look..."
                />
              </ModalField>
            </>
          ) : newLocationType === 'creature' ? (
            <>
              <ModalField label="Environment">
                <DiceSelect
                  value={newCreatureEnvironment}
                  onChange={(e) => {
                    setNewCreatureEnvironment(e.target.value);
                    // Re-roll basic form when environment changes
                    if (e.target.value) {
                      const form = rollCreatureBasicForm(starforgedData, e.target.value);
                      if (form) setNewCreatureForm(form);
                    }
                  }}
                  onDiceClick={() => {
                    const result = rollCreatureOracle(starforgedData, 'Environment');
                    if (result) {
                      setNewCreatureEnvironment(result);
                      const form = rollCreatureBasicForm(starforgedData, result);
                      if (form) setNewCreatureForm(form);
                    }
                  }}
                  options={getCreatureOracleOptions(starforgedData, 'Environment')}
                  placeholder="Select environment..."
                />
              </ModalField>
              <ModalField label="Scale">
                <DiceSelect
                  value={newCreatureScale}
                  onChange={(e) => setNewCreatureScale(e.target.value)}
                  onDiceClick={() => {
                    const result = rollCreatureOracle(starforgedData, 'Scale');
                    if (result) setNewCreatureScale(result);
                  }}
                  options={getCreatureOracleOptions(starforgedData, 'Scale')}
                  placeholder="Select scale..."
                />
              </ModalField>
              <ModalField label="Basic Form">
                <DiceSelect
                  value={newCreatureForm}
                  onChange={(e) => setNewCreatureForm(e.target.value)}
                  onDiceClick={() => {
                    const result = rollCreatureBasicForm(starforgedData, newCreatureEnvironment);
                    if (result) setNewCreatureForm(result);
                  }}
                  options={getCreatureBasicFormOptions(starforgedData, newCreatureEnvironment)}
                  placeholder="Select basic form..."
                />
              </ModalField>
              <ModalField label="First Look">
                <DiceSelect
                  value={newCreatureFirstLook}
                  onChange={(e) => setNewCreatureFirstLook(e.target.value)}
                  onDiceClick={() => {
                    const result = rollCreatureOracle(starforgedData, 'First Look');
                    if (result) setNewCreatureFirstLook(result);
                  }}
                  options={getCreatureOracleOptions(starforgedData, 'First Look')}
                  placeholder="Select first look..."
                />
              </ModalField>
              <ModalField label="Encountered Behavior">
                <DiceSelect
                  value={newCreatureBehavior}
                  onChange={(e) => setNewCreatureBehavior(e.target.value)}
                  onDiceClick={() => {
                    const result = rollCreatureOracle(starforgedData, 'Encountered Behavior');
                    if (result) setNewCreatureBehavior(result);
                  }}
                  options={getCreatureOracleOptions(starforgedData, 'Encountered Behavior')}
                  placeholder="Select behavior..."
                />
              </ModalField>
              <ModalField label="Revealed Aspect">
                <DiceSelect
                  value={newCreatureAspect}
                  onChange={(e) => setNewCreatureAspect(e.target.value)}
                  onDiceClick={() => {
                    const result = rollCreatureOracle(starforgedData, 'Revealed Aspect');
                    if (result) setNewCreatureAspect(result);
                  }}
                  options={getCreatureOracleOptions(starforgedData, 'Revealed Aspect')}
                  placeholder="Select revealed aspect..."
                />
              </ModalField>
            </>
          ) : newLocationType === 'custom' ? (
            <>
              <ModalField label="Name">
                <DiceInput
                  value={newCustomName}
                  onChange={(e) => setNewCustomName(e.target.value)}
                  onDiceClick={() => {
                    const descriptor = newCustomDescriptor || rollCoreOracle(starforgedData, 'Descriptor');
                    const focus = newCustomFocus || rollCoreOracle(starforgedData, 'Focus');
                    if (descriptor && focus) {
                      setNewCustomName(`${descriptor} ${focus}`);
                      if (!newCustomDescriptor) setNewCustomDescriptor(descriptor);
                      if (!newCustomFocus) setNewCustomFocus(focus);
                    }
                  }}
                  placeholder="Enter custom name..."
                />
              </ModalField>
              <ModalField label="Action">
                <DiceSelect
                  value={newCustomAction}
                  onChange={(e) => setNewCustomAction(e.target.value)}
                  onDiceClick={() => {
                    const result = rollCoreOracle(starforgedData, 'Action');
                    if (result) setNewCustomAction(result);
                  }}
                  options={getCoreOracleOptions(starforgedData, 'Action')}
                  placeholder="Select action..."
                />
              </ModalField>
              <ModalField label="Theme">
                <DiceSelect
                  value={newCustomTheme}
                  onChange={(e) => setNewCustomTheme(e.target.value)}
                  onDiceClick={() => {
                    const result = rollCoreOracle(starforgedData, 'Theme');
                    if (result) setNewCustomTheme(result);
                  }}
                  options={getCoreOracleOptions(starforgedData, 'Theme')}
                  placeholder="Select theme..."
                />
              </ModalField>
              <ModalField label="Descriptor">
                <DiceSelect
                  value={newCustomDescriptor}
                  onChange={(e) => setNewCustomDescriptor(e.target.value)}
                  onDiceClick={() => {
                    const result = rollCoreOracle(starforgedData, 'Descriptor');
                    if (result) setNewCustomDescriptor(result);
                  }}
                  options={getCoreOracleOptions(starforgedData, 'Descriptor')}
                  placeholder="Select descriptor..."
                />
              </ModalField>
              <ModalField label="Focus">
                <DiceSelect
                  value={newCustomFocus}
                  onChange={(e) => setNewCustomFocus(e.target.value)}
                  onDiceClick={() => {
                    const result = rollCoreOracle(starforgedData, 'Focus');
                    if (result) setNewCustomFocus(result);
                  }}
                  options={getCoreOracleOptions(starforgedData, 'Focus')}
                  placeholder="Select focus..."
                />
              </ModalField>
            </>
          ) : null}
        </Modal>
        <ConfirmDialog
          isOpen={showConfirmDialog}
          message={confirmDialogMessage}
          onConfirm={() => {
            setShowConfirmDialog(false);
            if (confirmDialogCallback) {
              confirmDialogCallback();
            }
          }}
          onCancel={() => {
            setShowConfirmDialog(false);
          }}
        />
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
      const typeInfo = getEntityTypeInfo(location.type) || { icon: '📍', label: 'Location' };
      
      // Get planet description from oracle data if this is a planet
      let locationDescription = typeInfo.label;
      if (location.type === 'planet' && location.planetClass) {
        const planetCategory = getPlanetCategory(starforgedData, location.planetClass);
        if (planetCategory?.Description) {
          locationDescription = planetCategory.Description;
        }
      }

      return (
        <>
          <NavigationView 
            title={location.name} 
            onBack={() => {
            if (isEditingLocation) {
              // Cancel edit mode
              setIsEditingLocation(false);
            } else {
              goBack();
            }
          }}
          backButtonText={isEditingLocation ? 'Cancel' : 'Back'}
          rightActionText={isEditingLocation ? 'Save' : 'Edit'}
          onRightActionText={() => {
            if (isEditingLocation) {
              // TODO: Implement save logic
              console.log('Save location:', sectorId, locationId);
              setIsEditingLocation(false);
            } else {
              setIsEditingLocation(true);
            }
          }}
          {...scrollProps}
        >
          <DetailCard
            icon={typeInfo.icon}
            iconBg={typeInfo.iconBg}
            title={location.name}
            description={locationDescription}
          />
          
          {/* Sub-location menu groups for planets */}
          {location.type === 'planet' && (
            <>
              <MenuGroup title="In orbit">
                {(() => {
                  const orbitLocations = (location.subLocations || []).filter(sl => sl.placement === 'orbit');
                  return orbitLocations.length === 0 ? (
                    <MenuItem 
                      label="No entities yet"
                      showChevron={false}
                      muted={true}
                    />
                  ) : (
                    orbitLocations.map(subLocation => {
                      const subTypeInfo = getEntityTypeInfo(subLocation.type) || { icon: '📍', label: 'Location' };
                      const entityCount = (subLocation.subLocations || []).length;
                      return (
                        <MenuItem 
                          key={subLocation.id}
                          icon={subTypeInfo.icon}
                          iconBg={subTypeInfo.iconBg}
                          label={subLocation.name}
                          value={entityCount > 0 ? entityCount : undefined}
                          onClick={() => navigate(`sublocation-${sectorId}-${locationId}-${subLocation.id}`)}
                        />
                      );
                    })
                  );
                })()}
                <MenuItem 
                  label="Add entity"
                  onClick={() => {
                    setCurrentSectorId(sectorId);
                    setCurrentLocationId(locationId);
                    setSubLocationPlacement('orbit');
                    setShowSubLocationModal(true);
                  }}
                  isButton={true}
                />
              </MenuGroup>
              <MenuGroup title="Planetside">
                {(() => {
                  const planetsideLocations = (location.subLocations || []).filter(sl => sl.placement === 'planetside');
                  return planetsideLocations.length === 0 ? (
                    <MenuItem 
                      label="No entities yet"
                      showChevron={false}
                      muted={true}
                    />
                  ) : (
                    planetsideLocations.map(subLocation => {
                      const subTypeInfo = getEntityTypeInfo(subLocation.type) || { icon: '📍', label: 'Location' };
                      const entityCount = (subLocation.subLocations || []).length;
                      return (
                        <MenuItem 
                          key={subLocation.id}
                          icon={subTypeInfo.icon}
                          iconBg={subTypeInfo.iconBg}
                          label={subLocation.name}
                          value={entityCount > 0 ? entityCount : undefined}
                          onClick={() => navigate(`sublocation-${sectorId}-${locationId}-${subLocation.id}`)}
                        />
                      );
                    })
                  );
                })()}
                <MenuItem 
                  label="Add entity"
                  onClick={() => {
                    setCurrentSectorId(sectorId);
                    setCurrentLocationId(locationId);
                    setSubLocationPlacement('planetside');
                    setShowSubLocationModal(true);
                  }}
                  isButton={true}
                />
              </MenuGroup>

              {/* Sub-location Modal */}
              <Modal
                isOpen={showSubLocationModal}
                onClose={closeSubLocationModal}
                onBack={newSubLocationType ? () => { setNewSubLocationType(null); resetAllEntityFields(); } : null}
                title={newSubLocationType ? getEntityTypeInfo(newSubLocationType)?.label : `Add ${subLocationPlacement === 'orbit' ? 'orbital' : 'planetside'} entity`}
                action={newSubLocationType ? {
                  label: 'Create',
                  onClick: createSubLocation,
                  disabled: (newSubLocationType === 'settlement' && !newSettlementName.trim()) ||
                            (newSubLocationType === 'character' && !newCharacterName.trim()) ||
                            (newSubLocationType === 'custom' && !newCustomName.trim())
                } : null}
              >
                {!newSubLocationType ? (
                  <MenuGroup>
                    <MenuItem 
                      icon="🏙️"
                      iconBg="rgba(175, 82, 222, 0.3)"
                      label="Settlement"
                      onClick={() => {
                        setNewSubLocationType('settlement');
                        rollAllSettlementFields(currentSectorId);
                      }}
                    />
                    <MenuItem 
                      icon="🚀"
                      iconBg="rgba(88, 86, 214, 0.3)"
                      label="Starship"
                      onClick={() => {
                        setNewSubLocationType('starship');
                        rollAllStarshipFields();
                      }}
                    />
                    <MenuItem 
                      icon="🛰️"
                      iconBg="rgba(142, 142, 147, 0.3)"
                      label="Derelict"
                      onClick={() => {
                        setNewSubLocationType('derelict');
                        rollAllDerelictFields();
                      }}
                    />
                    <MenuItem 
                      icon="🔐"
                      iconBg="rgba(255, 59, 48, 0.3)"
                      label="Precursor Vault"
                      onClick={() => {
                        setNewSubLocationType('vault');
                        rollAllVaultFields();
                      }}
                    />
                    <MenuItem 
                      icon="👾"
                      iconBg="rgba(52, 199, 89, 0.3)"
                      label="Creature"
                      onClick={() => {
                        setNewSubLocationType('creature');
                        rollAllCreatureFields();
                      }}
                    />
                    {subLocationPlacement !== 'orbit' && (
                      <MenuItem 
                        icon="👤"
                        iconBg="rgba(255, 204, 0, 0.3)"
                        label="Character"
                        onClick={() => {
                          setNewSubLocationType('character');
                          rollAllCharacterFields();
                        }}
                      />
                    )}
                    <MenuItem 
                      icon="⭐"
                      iconBg="rgba(255, 204, 0, 0.3)"
                      label="Custom"
                      onClick={() => {
                        setNewSubLocationType('custom');
                        rollAllCustomFields();
                      }}
                    />
                  </MenuGroup>
                ) : newSubLocationType === 'settlement' ? (
                  <>
                    <ModalField label="Name">
                      <DiceInput
                        value={newSettlementName}
                        onChange={(e) => setNewSettlementName(e.target.value)}
                        onDiceClick={() => {
                          const name = generateSettlementName(starforgedData);
                          if (name) setNewSettlementName(name);
                        }}
                        placeholder="Enter settlement name..."
                      />
                    </ModalField>
                    <ModalField label="Population">
                      <DiceSelect
                        value={newSettlementPopulation}
                        onChange={(e) => setNewSettlementPopulation(e.target.value)}
                        onDiceClick={() => {
                          const sector = getSector(currentSectorId);
                          const region = sector?.region ? sector.region.charAt(0).toUpperCase() + sector.region.slice(1) : 'Terminus';
                          const result = rollSettlementOracle(starforgedData, 'Population', region);
                          if (result) setNewSettlementPopulation(result);
                        }}
                        options={(() => {
                          const sector = getSector(currentSectorId);
                          const region = sector?.region ? sector.region.charAt(0).toUpperCase() + sector.region.slice(1) : 'Terminus';
                          return getSettlementOracleOptions(starforgedData, 'Population', region);
                        })()}
                        placeholder="Select population..."
                      />
                    </ModalField>
                    <ModalField label="First Look">
                      <DiceSelect
                        value={newSettlementFirstLook}
                        onChange={(e) => setNewSettlementFirstLook(e.target.value)}
                        onDiceClick={() => {
                          const result = rollSettlementOracle(starforgedData, 'First Look');
                          if (result) setNewSettlementFirstLook(result);
                        }}
                        options={getSettlementOracleOptions(starforgedData, 'First Look')}
                        placeholder="Select first look..."
                      />
                    </ModalField>
                    <ModalField label="Initial Contact">
                      <DiceSelect
                        value={newSettlementInitialContact}
                        onChange={(e) => setNewSettlementInitialContact(e.target.value)}
                        onDiceClick={() => {
                          const result = rollSettlementOracle(starforgedData, 'Initial Contact');
                          if (result) setNewSettlementInitialContact(result);
                        }}
                        options={getSettlementOracleOptions(starforgedData, 'Initial Contact')}
                        placeholder="Select initial contact..."
                      />
                    </ModalField>
                    <ModalField label="Authority">
                      <DiceSelect
                        value={newSettlementAuthority}
                        onChange={(e) => setNewSettlementAuthority(e.target.value)}
                        onDiceClick={() => {
                          const result = rollSettlementOracle(starforgedData, 'Authority');
                          if (result) setNewSettlementAuthority(result);
                        }}
                        options={getSettlementOracleOptions(starforgedData, 'Authority')}
                        placeholder="Select authority..."
                      />
                    </ModalField>
                    <ModalField label="Projects">
                      <DiceSelect
                        value={newSettlementProjects}
                        onChange={(e) => setNewSettlementProjects(e.target.value)}
                        onDiceClick={() => {
                          const result = rollSettlementOracle(starforgedData, 'Projects');
                          if (result) setNewSettlementProjects(result);
                        }}
                        options={getSettlementOracleOptions(starforgedData, 'Projects')}
                        placeholder="Select projects..."
                      />
                    </ModalField>
                    <ModalField label="Trouble">
                      <DiceSelect
                        value={newSettlementTrouble}
                        onChange={(e) => setNewSettlementTrouble(e.target.value)}
                        onDiceClick={() => {
                          const result = rollSettlementOracle(starforgedData, 'Trouble');
                          if (result) setNewSettlementTrouble(result);
                        }}
                        options={getSettlementOracleOptions(starforgedData, 'Trouble')}
                        placeholder="Select trouble..."
                      />
                    </ModalField>
                  </>
                ) : newSubLocationType === 'starship' ? (
                  <>
                    <ModalField label="Name">
                      <DiceInput
                        value={newStarshipName}
                        onChange={(e) => setNewStarshipName(e.target.value)}
                        onDiceClick={() => {
                          const name = generateStarshipName(starforgedData);
                          if (name) setNewStarshipName(name);
                        }}
                        placeholder="Enter starship name..."
                      />
                    </ModalField>
                    <ModalField label="Type">
                      <DiceSelect
                        value={newStarshipType}
                        onChange={(e) => setNewStarshipType(e.target.value)}
                        onDiceClick={() => {
                          const result = rollStarshipOracle(starforgedData, 'Type');
                          if (result) setNewStarshipType(result);
                        }}
                        options={getStarshipOracleOptions(starforgedData, 'Type')}
                        placeholder="Select type..."
                      />
                    </ModalField>
                    <ModalField label="Fleet">
                      <DiceSelect
                        value={newStarshipFleet}
                        onChange={(e) => setNewStarshipFleet(e.target.value)}
                        onDiceClick={() => {
                          const result = rollStarshipOracle(starforgedData, 'Fleet');
                          if (result) setNewStarshipFleet(result);
                        }}
                        options={getStarshipOracleOptions(starforgedData, 'Fleet')}
                        placeholder="Select fleet..."
                      />
                    </ModalField>
                    <ModalField label="Initial Contact">
                      <DiceSelect
                        value={newStarshipInitialContact}
                        onChange={(e) => setNewStarshipInitialContact(e.target.value)}
                        onDiceClick={() => {
                          const result = rollStarshipOracle(starforgedData, 'Initial Contact');
                          if (result) setNewStarshipInitialContact(result);
                        }}
                        options={getStarshipOracleOptions(starforgedData, 'Initial Contact')}
                        placeholder="Select initial contact..."
                      />
                    </ModalField>
                    <ModalField label="First Look">
                      <DiceSelect
                        value={newStarshipFirstLook}
                        onChange={(e) => setNewStarshipFirstLook(e.target.value)}
                        onDiceClick={() => {
                          const result = rollStarshipOracle(starforgedData, 'First Look');
                          if (result) setNewStarshipFirstLook(result);
                        }}
                        options={getStarshipOracleOptions(starforgedData, 'First Look')}
                        placeholder="Select first look..."
                      />
                    </ModalField>
                    <ModalField label="Mission">
                      <DiceSelect
                        value={newStarshipMission}
                        onChange={(e) => setNewStarshipMission(e.target.value)}
                        onDiceClick={() => {
                          const result = rollStarshipOracle(starforgedData, 'Mission');
                          if (result) setNewStarshipMission(result);
                        }}
                        options={getStarshipOracleOptions(starforgedData, 'Mission')}
                        placeholder="Select mission..."
                      />
                    </ModalField>
                  </>
                ) : newSubLocationType === 'derelict' ? (
                  <>
                    <ModalField label="Type">
                      <DiceSelect
                        value={newDerelictType}
                        onChange={(e) => setNewDerelictType(e.target.value)}
                        onDiceClick={() => {
                          const result = rollDerelictOracle(starforgedData, 'Type');
                          if (result) setNewDerelictType(result);
                        }}
                        options={getDerelictOracleOptions(starforgedData, 'Type')}
                        placeholder="Select type..."
                      />
                    </ModalField>
                    <ModalField label="Condition">
                      <DiceSelect
                        value={newDerelictCondition}
                        onChange={(e) => setNewDerelictCondition(e.target.value)}
                        onDiceClick={() => {
                          const result = rollDerelictOracle(starforgedData, 'Condition');
                          if (result) setNewDerelictCondition(result);
                        }}
                        options={getDerelictOracleOptions(starforgedData, 'Condition')}
                        placeholder="Select condition..."
                      />
                    </ModalField>
                    <ModalField label="Outer First Look">
                      <DiceSelect
                        value={newDerelictOuterFirstLook}
                        onChange={(e) => setNewDerelictOuterFirstLook(e.target.value)}
                        onDiceClick={() => {
                          const result = rollDerelictOracle(starforgedData, 'Outer First Look');
                          if (result) setNewDerelictOuterFirstLook(result);
                        }}
                        options={getDerelictOracleOptions(starforgedData, 'Outer First Look')}
                        placeholder="Select outer first look..."
                      />
                    </ModalField>
                    <ModalField label="Inner First Look">
                      <DiceSelect
                        value={newDerelictInnerFirstLook}
                        onChange={(e) => setNewDerelictInnerFirstLook(e.target.value)}
                        onDiceClick={() => {
                          const result = rollDerelictOracle(starforgedData, 'Inner First Look');
                          if (result) setNewDerelictInnerFirstLook(result);
                        }}
                        options={getDerelictOracleOptions(starforgedData, 'Inner First Look')}
                        placeholder="Select inner first look..."
                      />
                    </ModalField>
                  </>
                ) : newSubLocationType === 'vault' ? (
                  <>
                    <ModalField label="Scale">
                      <DiceSelect
                        value={newVaultScale}
                        onChange={(e) => setNewVaultScale(e.target.value)}
                        onDiceClick={() => {
                          const result = rollVaultOracle(starforgedData, 'Scale');
                          if (result) setNewVaultScale(result);
                        }}
                        options={getVaultOracleOptions(starforgedData, 'Scale')}
                        placeholder="Select scale..."
                      />
                    </ModalField>
                    <ModalField label="Form">
                      <DiceSelect
                        value={newVaultForm}
                        onChange={(e) => setNewVaultForm(e.target.value)}
                        onDiceClick={() => {
                          const result = rollVaultOracle(starforgedData, 'Form');
                          if (result) setNewVaultForm(result);
                        }}
                        options={getVaultOracleOptions(starforgedData, 'Form')}
                        placeholder="Select form..."
                      />
                    </ModalField>
                    <ModalField label="Shape">
                      <DiceSelect
                        value={newVaultShape}
                        onChange={(e) => setNewVaultShape(e.target.value)}
                        onDiceClick={() => {
                          const result = rollVaultOracle(starforgedData, 'Shape');
                          if (result) setNewVaultShape(result);
                        }}
                        options={getVaultOracleOptions(starforgedData, 'Shape')}
                        placeholder="Select shape..."
                      />
                    </ModalField>
                    <ModalField label="Material">
                      <DiceSelect
                        value={newVaultMaterial}
                        onChange={(e) => setNewVaultMaterial(e.target.value)}
                        onDiceClick={() => {
                          const result = rollVaultOracle(starforgedData, 'Material');
                          if (result) setNewVaultMaterial(result);
                        }}
                        options={getVaultOracleOptions(starforgedData, 'Material')}
                        placeholder="Select material..."
                      />
                    </ModalField>
                    <ModalField label="Outer First Look">
                      <DiceSelect
                        value={newVaultOuterFirstLook}
                        onChange={(e) => setNewVaultOuterFirstLook(e.target.value)}
                        onDiceClick={() => {
                          const result = rollVaultOracle(starforgedData, 'Outer First Look');
                          if (result) setNewVaultOuterFirstLook(result);
                        }}
                        options={getVaultOracleOptions(starforgedData, 'Outer First Look')}
                        placeholder="Select outer first look..."
                      />
                    </ModalField>
                  </>
                ) : newSubLocationType === 'creature' ? (
                  <>
                    <ModalField label="Scale">
                      <DiceSelect
                        value={newCreatureScale}
                        onChange={(e) => setNewCreatureScale(e.target.value)}
                        onDiceClick={() => {
                          const result = rollCreatureOracle(starforgedData, 'Scale');
                          if (result) setNewCreatureScale(result);
                        }}
                        options={getCreatureOracleOptions(starforgedData, 'Scale')}
                        placeholder="Select scale..."
                      />
                    </ModalField>
                    <ModalField label="Basic Form">
                      <DiceSelect
                        value={newCreatureForm}
                        onChange={(e) => setNewCreatureForm(e.target.value)}
                        onDiceClick={() => {
                          const result = rollCreatureBasicForm(starforgedData, newCreatureEnvironment);
                          if (result) setNewCreatureForm(result);
                        }}
                        options={getCreatureBasicFormOptions(starforgedData, newCreatureEnvironment)}
                        placeholder="Select basic form..."
                      />
                    </ModalField>
                    <ModalField label="First Look">
                      <DiceSelect
                        value={newCreatureFirstLook}
                        onChange={(e) => setNewCreatureFirstLook(e.target.value)}
                        onDiceClick={() => {
                          const result = rollCreatureOracle(starforgedData, 'First Look');
                          if (result) setNewCreatureFirstLook(result);
                        }}
                        options={getCreatureOracleOptions(starforgedData, 'First Look')}
                        placeholder="Select first look..."
                      />
                    </ModalField>
                    <ModalField label="Encountered Behavior">
                      <DiceSelect
                        value={newCreatureBehavior}
                        onChange={(e) => setNewCreatureBehavior(e.target.value)}
                        onDiceClick={() => {
                          const result = rollCreatureOracle(starforgedData, 'Encountered Behavior');
                          if (result) setNewCreatureBehavior(result);
                        }}
                        options={getCreatureOracleOptions(starforgedData, 'Encountered Behavior')}
                        placeholder="Select behavior..."
                      />
                    </ModalField>
                    <ModalField label="Revealed Aspect">
                      <DiceSelect
                        value={newCreatureAspect}
                        onChange={(e) => setNewCreatureAspect(e.target.value)}
                        onDiceClick={() => {
                          const result = rollCreatureOracle(starforgedData, 'Revealed Aspect');
                          if (result) setNewCreatureAspect(result);
                        }}
                        options={getCreatureOracleOptions(starforgedData, 'Revealed Aspect')}
                        placeholder="Select revealed aspect..."
                      />
                    </ModalField>
                  </>
                ) : newSubLocationType === 'character' ? (
                  <>
                    <ModalField label="Name">
                      <DiceInput
                        value={newCharacterName}
                        onChange={(e) => setNewCharacterName(e.target.value)}
                        onDiceClick={() => {
                          const name = generateCharacterName();
                          if (name) setNewCharacterName(name);
                        }}
                        placeholder="Enter character name..."
                      />
                    </ModalField>
                    <ModalField label="First Look">
                      <DiceSelect
                        value={newCharacterFirstLook}
                        onChange={(e) => setNewCharacterFirstLook(e.target.value)}
                        onDiceClick={() => {
                          const result = rollCharacterOracle(starforgedData, 'First Look');
                          if (result) setNewCharacterFirstLook(result);
                        }}
                        options={getCharacterOracleOptions(starforgedData, 'First Look')}
                        placeholder="Select first look..."
                      />
                    </ModalField>
                    <ModalField label="Initial Disposition">
                      <DiceSelect
                        value={newCharacterDisposition}
                        onChange={(e) => setNewCharacterDisposition(e.target.value)}
                        onDiceClick={() => {
                          const result = rollCharacterOracle(starforgedData, 'Initial Disposition');
                          if (result) setNewCharacterDisposition(result);
                        }}
                        options={getCharacterOracleOptions(starforgedData, 'Initial Disposition')}
                        placeholder="Select disposition..."
                      />
                    </ModalField>
                    <ModalField label="Role">
                      <DiceSelect
                        value={newCharacterRole}
                        onChange={(e) => setNewCharacterRole(e.target.value)}
                        onDiceClick={() => {
                          const result = rollCharacterOracle(starforgedData, 'Role');
                          if (result) setNewCharacterRole(result);
                        }}
                        options={getCharacterOracleOptions(starforgedData, 'Role')}
                        placeholder="Select role..."
                      />
                    </ModalField>
                    <ModalField label="Goal">
                      <DiceSelect
                        value={newCharacterGoal}
                        onChange={(e) => setNewCharacterGoal(e.target.value)}
                        onDiceClick={() => {
                          const result = rollCharacterOracle(starforgedData, 'Goal');
                          if (result) setNewCharacterGoal(result);
                        }}
                        options={getCharacterOracleOptions(starforgedData, 'Goal')}
                        placeholder="Select goal..."
                      />
                    </ModalField>
                  </>
                ) : newSubLocationType === 'custom' ? (
                  <>
                    <ModalField label="Name">
                      <DiceInput
                        value={newCustomName}
                        onChange={(e) => setNewCustomName(e.target.value)}
                        onDiceClick={() => {
                          const descriptor = newCustomDescriptor || rollCoreOracle(starforgedData, 'Descriptor');
                          const focus = newCustomFocus || rollCoreOracle(starforgedData, 'Focus');
                          if (descriptor && focus) {
                            setNewCustomName(`${descriptor} ${focus}`);
                            if (!newCustomDescriptor) setNewCustomDescriptor(descriptor);
                            if (!newCustomFocus) setNewCustomFocus(focus);
                          }
                        }}
                        placeholder="Enter custom name..."
                      />
                    </ModalField>
                    <ModalField label="Action">
                      <DiceSelect
                        value={newCustomAction}
                        onChange={(e) => setNewCustomAction(e.target.value)}
                        onDiceClick={() => {
                          const result = rollCoreOracle(starforgedData, 'Action');
                          if (result) setNewCustomAction(result);
                        }}
                        options={getCoreOracleOptions(starforgedData, 'Action')}
                        placeholder="Select action..."
                      />
                    </ModalField>
                    <ModalField label="Theme">
                      <DiceSelect
                        value={newCustomTheme}
                        onChange={(e) => setNewCustomTheme(e.target.value)}
                        onDiceClick={() => {
                          const result = rollCoreOracle(starforgedData, 'Theme');
                          if (result) setNewCustomTheme(result);
                        }}
                        options={getCoreOracleOptions(starforgedData, 'Theme')}
                        placeholder="Select theme..."
                      />
                    </ModalField>
                    <ModalField label="Descriptor">
                      <DiceSelect
                        value={newCustomDescriptor}
                        onChange={(e) => setNewCustomDescriptor(e.target.value)}
                        onDiceClick={() => {
                          const result = rollCoreOracle(starforgedData, 'Descriptor');
                          if (result) setNewCustomDescriptor(result);
                        }}
                        options={getCoreOracleOptions(starforgedData, 'Descriptor')}
                        placeholder="Select descriptor..."
                      />
                    </ModalField>
                    <ModalField label="Focus">
                      <DiceSelect
                        value={newCustomFocus}
                        onChange={(e) => setNewCustomFocus(e.target.value)}
                        onDiceClick={() => {
                          const result = rollCoreOracle(starforgedData, 'Focus');
                          if (result) setNewCustomFocus(result);
                        }}
                        options={getCoreOracleOptions(starforgedData, 'Focus')}
                        placeholder="Select focus..."
                      />
                    </ModalField>
                  </>
                ) : null}
              </Modal>
            </>
          )}

          {/* Within section for settlement locations */}
          {location.type === 'settlement' && (
            <>
              <MenuGroup title="Within">
                {(() => {
                  const withinEntities = location.nestedEntities || [];
                  return withinEntities.length === 0 ? (
                    <MenuItem 
                      label="No entities yet"
                      showChevron={false}
                      muted={true}
                    />
                  ) : (
                    withinEntities.map(entity => {
                      const entityTypeInfo = getEntityTypeInfo(entity.type) || { icon: '📍', label: 'Entity' };
                      return (
                        <MenuItem 
                          key={entity.id}
                          icon={entityTypeInfo.icon}
                          iconBg={entityTypeInfo.iconBg}
                          label={entity.name}
                          onClick={() => navigate(`location-nested-${sectorId}-${locationId}-${entity.id}`)}
                        />
                      );
                    })
                  );
                })()}
                <MenuItem 
                  label="Add entity"
                  onClick={() => {
                    setCurrentSectorId(sectorId);
                    setCurrentLocationId(locationId);
                    setParentEntityType(location.type);
                    setOnboardTargetType('location');
                    setShowOnboardModal(true);
                  }}
                  isButton={true}
                />
              </MenuGroup>
            </>
          )}

          {/* Within section for derelict locations */}
          {location.type === 'derelict' && (
            <>
              <MenuGroup title="Within">
                {(() => {
                  const withinEntities = location.nestedEntities || [];
                  return withinEntities.length === 0 ? (
                    <MenuItem 
                      label="No entities yet"
                      showChevron={false}
                      muted={true}
                    />
                  ) : (
                    withinEntities.map(entity => {
                      const entityTypeInfo = getEntityTypeInfo(entity.type) || { icon: '📍', label: 'Entity' };
                      return (
                        <MenuItem 
                          key={entity.id}
                          icon={entityTypeInfo.icon}
                          iconBg={entityTypeInfo.iconBg}
                          label={entity.name}
                          onClick={() => navigate(`location-nested-${sectorId}-${locationId}-${entity.id}`)}
                        />
                      );
                    })
                  );
                })()}
                <MenuItem 
                  label="Add entity"
                  onClick={() => {
                    setCurrentSectorId(sectorId);
                    setCurrentLocationId(locationId);
                    setParentEntityType(location.type);
                    setOnboardTargetType('location');
                    setShowOnboardModal(true);
                  }}
                  isButton={true}
                />
              </MenuGroup>
            </>
          )}

          {/* Within section for vault locations */}
          {location.type === 'vault' && (
            <>
              <MenuGroup title="Within">
                {(() => {
                  const withinEntities = location.nestedEntities || [];
                  return withinEntities.length === 0 ? (
                    <MenuItem 
                      label="No entities yet"
                      showChevron={false}
                      muted={true}
                    />
                  ) : (
                    withinEntities.map(entity => {
                      const entityTypeInfo = getEntityTypeInfo(entity.type) || { icon: '📍', label: 'Entity' };
                      return (
                        <MenuItem 
                          key={entity.id}
                          icon={entityTypeInfo.icon}
                          iconBg={entityTypeInfo.iconBg}
                          label={entity.name}
                          onClick={() => navigate(`location-nested-${sectorId}-${locationId}-${entity.id}`)}
                        />
                      );
                    })
                  );
                })()}
                <MenuItem 
                  label="Add entity"
                  onClick={() => {
                    setCurrentSectorId(sectorId);
                    setCurrentLocationId(locationId);
                    setParentEntityType(location.type);
                    setOnboardTargetType('location');
                    setShowOnboardModal(true);
                  }}
                  isButton={true}
                />
              </MenuGroup>
            </>
          )}

          {/* Onboard section for starship locations */}
          {location.type === 'starship' && (
            <>
              <MenuGroup title="Onboard">
                {(() => {
                  const onboardEntities = location.nestedEntities || [];
                  return onboardEntities.length === 0 ? (
                    <MenuItem 
                      label="No entities yet"
                      showChevron={false}
                      muted={true}
                    />
                  ) : (
                    onboardEntities.map(entity => {
                      const entityTypeInfo = getEntityTypeInfo(entity.type) || { icon: '📍', label: 'Entity' };
                      return (
                        <MenuItem 
                          key={entity.id}
                          icon={entityTypeInfo.icon}
                          iconBg={entityTypeInfo.iconBg}
                          label={entity.name}
                          onClick={() => navigate(`location-nested-${sectorId}-${locationId}-${entity.id}`)}
                        />
                      );
                    })
                  );
                })()}
                <MenuItem 
                  label="Add entity"
                  onClick={() => {
                    setCurrentSectorId(sectorId);
                    setCurrentLocationId(locationId);
                    setParentEntityType(location.type);
                    setOnboardTargetType('location');
                    setShowOnboardModal(true);
                  }}
                  isButton={true}
                />
              </MenuGroup>
            </>
          )}

          <MenuGroup title="Details">
            {location.type === 'planet' && (
              <>
                {location.planetName && (
                  <MenuItem label="Name" value={location.planetName} showChevron={false} stacked />
                )}
                {location.planetClass && (
                  <MenuItem label="Class" value={location.planetClass} showChevron={false} stacked />
                )}
                {location.atmosphere && (
                  <MenuItem label="Atmosphere" value={location.atmosphere} showChevron={false} stacked />
                )}
                {location.settlements && (
                  <MenuItem label="Settlements" value={location.settlements} showChevron={false} stacked />
                )}
                {location.observed && (
                  <MenuItem label="Observed from Space" value={location.observed} showChevron={false} stacked />
                )}
                {location.feature && (
                  <MenuItem label="Feature" value={location.feature} showChevron={false} stacked />
                )}
                {location.life && (
                  <MenuItem label="Life" value={location.life} showChevron={false} stacked />
                )}
                {location.peril && (
                  <MenuItem label="Peril" value={location.peril} showChevron={false} stacked />
                )}
                {location.opportunity && (
                  <MenuItem label="Opportunity" value={location.opportunity} showChevron={false} stacked />
                )}
              </>
            )}
            {location.type === 'stellar' && (
              <>
                {location.stellarType && (
                  <MenuItem label="Type" value={location.stellarType} showChevron={false} stacked />
                )}
              </>
            )}
            {location.type === 'settlement' && (
              <>
                {location.settlementName && (
                  <MenuItem label="Name" value={location.settlementName} showChevron={false} stacked />
                )}
                {location.location && (
                  <MenuItem label="Location" value={location.location} showChevron={false} stacked />
                )}
                {location.population && (
                  <MenuItem label="Population" value={location.population} showChevron={false} stacked />
                )}
                {location.firstLook && (
                  <MenuItem label="First Look" value={location.firstLook} showChevron={false} stacked />
                )}
                {location.initialContact && (
                  <MenuItem label="Initial Contact" value={location.initialContact} showChevron={false} stacked />
                )}
                {location.authority && (
                  <MenuItem label="Authority" value={location.authority} showChevron={false} stacked />
                )}
                {location.projects && (
                  <MenuItem label="Projects" value={location.projects} showChevron={false} stacked />
                )}
                {location.trouble && (
                  <MenuItem label="Trouble" value={location.trouble} showChevron={false} stacked />
                )}
              </>
            )}
            {location.type === 'starship' && (
              <>
                {location.starshipName && (
                  <MenuItem label="Name" value={location.starshipName} showChevron={false} stacked />
                )}
                {location.starshipType && (
                  <MenuItem label="Type" value={location.starshipType} showChevron={false} stacked />
                )}
                {location.fleet && (
                  <MenuItem label="Fleet" value={location.fleet} showChevron={false} stacked />
                )}
                {location.initialContact && (
                  <MenuItem label="Initial Contact" value={location.initialContact} showChevron={false} stacked />
                )}
                {location.firstLook && (
                  <MenuItem label="First Look" value={location.firstLook} showChevron={false} stacked />
                )}
                {location.mission && (
                  <MenuItem label="Mission" value={location.mission} showChevron={false} stacked />
                )}
              </>
            )}
            {location.type === 'derelict' && (
              <>
                {location.derelictLocation && (
                  <MenuItem label="Location" value={location.derelictLocation} showChevron={false} stacked />
                )}
                {location.derelictType && (
                  <MenuItem label="Type" value={location.derelictType} showChevron={false} stacked />
                )}
                {location.condition && (
                  <MenuItem label="Condition" value={location.condition} showChevron={false} stacked />
                )}
                {location.outerFirstLook && (
                  <MenuItem label="Outer First Look" value={location.outerFirstLook} showChevron={false} stacked />
                )}
                {location.innerFirstLook && (
                  <MenuItem label="Inner First Look" value={location.innerFirstLook} showChevron={false} stacked />
                )}
              </>
            )}
            {location.type === 'vault' && (
              <>
                {location.vaultLocation && (
                  <MenuItem label="Location" value={location.vaultLocation} showChevron={false} stacked />
                )}
                {location.scale && (
                  <MenuItem label="Scale" value={location.scale} showChevron={false} stacked />
                )}
                {location.form && (
                  <MenuItem label="Form" value={location.form} showChevron={false} stacked />
                )}
                {location.shape && (
                  <MenuItem label="Shape" value={location.shape} showChevron={false} stacked />
                )}
                {location.material && (
                  <MenuItem label="Material" value={location.material} showChevron={false} stacked />
                )}
                {location.outerFirstLook && (
                  <MenuItem label="Outer First Look" value={location.outerFirstLook} showChevron={false} stacked />
                )}
              </>
            )}
            {location.type === 'creature' && (
              <>
                {location.environment && (
                  <MenuItem label="Environment" value={location.environment} showChevron={false} stacked />
                )}
                {location.creatureScale && (
                  <MenuItem label="Scale" value={location.creatureScale} showChevron={false} stacked />
                )}
                {location.basicForm && (
                  <MenuItem label="Basic Form" value={location.basicForm} showChevron={false} stacked />
                )}
                {location.firstLook && (
                  <MenuItem label="First Look" value={location.firstLook} showChevron={false} stacked />
                )}
                {location.behavior && (
                  <MenuItem label="Encountered Behavior" value={location.behavior} showChevron={false} stacked />
                )}
                {location.revealedAspect && (
                  <MenuItem label="Revealed Aspect" value={location.revealedAspect} showChevron={false} stacked />
                )}
              </>
            )}
            {location.type === 'custom' && (
              <>
                {location.customName && (
                  <MenuItem label="Name" value={location.customName} showChevron={false} stacked />
                )}
                {location.action && (
                  <MenuItem label="Action" value={location.action} showChevron={false} stacked />
                )}
                {location.theme && (
                  <MenuItem label="Theme" value={location.theme} showChevron={false} stacked />
                )}
                {location.descriptor && (
                  <MenuItem label="Descriptor" value={location.descriptor} showChevron={false} stacked />
                )}
                {location.focus && (
                  <MenuItem label="Focus" value={location.focus} showChevron={false} stacked />
                )}
              </>
            )}
          </MenuGroup>

          {/* Entity Modal for location entities (starship, settlement, derelict, vault) */}
          <Modal
            isOpen={showOnboardModal && onboardTargetType === 'location'}
            onClose={closeOnboardModal}
            onBack={newOnboardEntityType ? () => { setNewOnboardEntityType(null); resetAllEntityFields(); } : null}
            title={newOnboardEntityType ? getEntityTypeInfo(newOnboardEntityType)?.label : (parentEntityType === 'starship' ? 'Add onboard entity' : 'Add entity within')}
            action={newOnboardEntityType ? {
              label: 'Create',
              onClick: createOnboardEntity,
              disabled: (newOnboardEntityType === 'character' && !newCharacterName.trim()) ||
                        (newOnboardEntityType === 'custom' && !newCustomName.trim())
            } : null}
          >
            {!newOnboardEntityType ? (
              <MenuGroup>
                <MenuItem 
                  icon="👤"
                  iconBg="rgba(255, 204, 0, 0.3)"
                  label="Character"
                  onClick={() => {
                    setNewOnboardEntityType('character');
                    rollAllCharacterFields();
                  }}
                />
                <MenuItem 
                  icon="👾"
                  iconBg="rgba(52, 199, 89, 0.3)"
                  label="Creature"
                  onClick={() => {
                    setNewOnboardEntityType('creature');
                    rollAllCreatureFields();
                  }}
                />
                <MenuItem 
                  icon="🚀"
                  iconBg="rgba(88, 86, 214, 0.3)"
                  label="Starship"
                  onClick={() => {
                    setNewOnboardEntityType('starship');
                    rollAllStarshipFields();
                  }}
                />
                <MenuItem 
                  icon="⭐"
                  iconBg="rgba(255, 204, 0, 0.3)"
                  label="Custom"
                  onClick={() => {
                    setNewOnboardEntityType('custom');
                    rollAllCustomFields();
                  }}
                />
              </MenuGroup>
            ) : newOnboardEntityType === 'character' ? (
              <>
                <ModalField label="Name">
                  <DiceInput
                    value={newCharacterName}
                    onChange={(e) => setNewCharacterName(e.target.value)}
                    onDiceClick={() => {
                      const name = generateCharacterName();
                      if (name) setNewCharacterName(name);
                    }}
                    placeholder="Enter name..."
                  />
                </ModalField>
                <ModalField label="First Look">
                  <DiceSelect
                    value={newCharacterFirstLook}
                    onChange={(e) => setNewCharacterFirstLook(e.target.value)}
                    onDiceClick={() => {
                      const result = rollCharacterOracle(starforgedData, 'First Look');
                      if (result) setNewCharacterFirstLook(result);
                    }}
                    options={getCharacterOracleOptions(starforgedData, 'First Look')}
                    placeholder="Select first look..."
                  />
                </ModalField>
                <ModalField label="Initial Disposition">
                  <DiceSelect
                    value={newCharacterDisposition}
                    onChange={(e) => setNewCharacterDisposition(e.target.value)}
                    onDiceClick={() => {
                      const result = rollCharacterOracle(starforgedData, 'Initial Disposition');
                      if (result) setNewCharacterDisposition(result);
                    }}
                    options={getCharacterOracleOptions(starforgedData, 'Initial Disposition')}
                    placeholder="Select disposition..."
                  />
                </ModalField>
                <ModalField label="Role">
                  <DiceSelect
                    value={newCharacterRole}
                    onChange={(e) => setNewCharacterRole(e.target.value)}
                    onDiceClick={() => {
                      const result = rollCharacterOracle(starforgedData, 'Role');
                      if (result) setNewCharacterRole(result);
                    }}
                    options={getCharacterOracleOptions(starforgedData, 'Role')}
                    placeholder="Select role..."
                  />
                </ModalField>
                <ModalField label="Goal">
                  <DiceSelect
                    value={newCharacterGoal}
                    onChange={(e) => setNewCharacterGoal(e.target.value)}
                    onDiceClick={() => {
                      const result = rollCharacterOracle(starforgedData, 'Goal');
                      if (result) setNewCharacterGoal(result);
                    }}
                    options={getCharacterOracleOptions(starforgedData, 'Goal')}
                    placeholder="Select goal..."
                  />
                </ModalField>
              </>
            ) : newOnboardEntityType === 'creature' ? (
              <>
                <ModalField label="Environment">
                  <DiceSelect
                    value={newCreatureEnvironment}
                    onChange={(e) => setNewCreatureEnvironment(e.target.value)}
                    onDiceClick={() => {
                      const result = rollCreatureOracle(starforgedData, 'Environment');
                      if (result) setNewCreatureEnvironment(result);
                    }}
                    options={getCreatureOracleOptions(starforgedData, 'Environment')}
                    placeholder="Select environment..."
                  />
                </ModalField>
                <ModalField label="Scale">
                  <DiceSelect
                    value={newCreatureScale}
                    onChange={(e) => setNewCreatureScale(e.target.value)}
                    onDiceClick={() => {
                      const result = rollCreatureOracle(starforgedData, 'Scale');
                      if (result) setNewCreatureScale(result);
                    }}
                    options={getCreatureOracleOptions(starforgedData, 'Scale')}
                    placeholder="Select scale..."
                  />
                </ModalField>
                <ModalField label="Basic Form">
                  <DiceSelect
                    value={newCreatureForm}
                    onChange={(e) => setNewCreatureForm(e.target.value)}
                    onDiceClick={() => {
                      const basicForm = rollCreatureBasicForm(starforgedData, newCreatureEnvironment);
                      if (basicForm) setNewCreatureForm(basicForm);
                    }}
                    options={getCreatureBasicFormOptions(starforgedData, newCreatureEnvironment)}
                    placeholder="Select basic form..."
                  />
                </ModalField>
                <ModalField label="First Look">
                  <DiceSelect
                    value={newCreatureFirstLook}
                    onChange={(e) => setNewCreatureFirstLook(e.target.value)}
                    onDiceClick={() => {
                      const result = rollCreatureOracle(starforgedData, 'First Look');
                      if (result) setNewCreatureFirstLook(result);
                    }}
                    options={getCreatureOracleOptions(starforgedData, 'First Look')}
                    placeholder="Select first look..."
                  />
                </ModalField>
                <ModalField label="Encountered Behavior">
                  <DiceSelect
                    value={newCreatureBehavior}
                    onChange={(e) => setNewCreatureBehavior(e.target.value)}
                    onDiceClick={() => {
                      const result = rollCreatureOracle(starforgedData, 'Encountered Behavior');
                      if (result) setNewCreatureBehavior(result);
                    }}
                    options={getCreatureOracleOptions(starforgedData, 'Encountered Behavior')}
                    placeholder="Select behavior..."
                  />
                </ModalField>
                <ModalField label="Revealed Aspect">
                  <DiceSelect
                    value={newCreatureAspect}
                    onChange={(e) => setNewCreatureAspect(e.target.value)}
                    onDiceClick={() => {
                      const result = rollCreatureOracle(starforgedData, 'Revealed Aspect');
                      if (result) setNewCreatureAspect(result);
                    }}
                    options={getCreatureOracleOptions(starforgedData, 'Revealed Aspect')}
                    placeholder="Select aspect..."
                  />
                </ModalField>
              </>
            ) : newOnboardEntityType === 'starship' ? (
              <>
                <ModalField label="Name">
                  <DiceInput
                    value={newStarshipName}
                    onChange={(e) => setNewStarshipName(e.target.value)}
                    onDiceClick={() => {
                      const name = generateStarshipName(starforgedData);
                      if (name) setNewStarshipName(name);
                    }}
                    placeholder="Enter starship name..."
                  />
                </ModalField>
                <ModalField label="Type">
                  <DiceSelect
                    value={newStarshipType}
                    onChange={(e) => setNewStarshipType(e.target.value)}
                    onDiceClick={() => {
                      const result = rollStarshipOracle(starforgedData, 'Type');
                      if (result) setNewStarshipType(result);
                    }}
                    options={getStarshipOracleOptions(starforgedData, 'Type')}
                    placeholder="Select type..."
                  />
                </ModalField>
                <ModalField label="Fleet">
                  <DiceSelect
                    value={newStarshipFleet}
                    onChange={(e) => setNewStarshipFleet(e.target.value)}
                    onDiceClick={() => {
                      const result = rollStarshipOracle(starforgedData, 'Fleet');
                      if (result) setNewStarshipFleet(result);
                    }}
                    options={getStarshipOracleOptions(starforgedData, 'Fleet')}
                    placeholder="Select fleet..."
                  />
                </ModalField>
                <ModalField label="Initial Contact">
                  <DiceSelect
                    value={newStarshipInitialContact}
                    onChange={(e) => setNewStarshipInitialContact(e.target.value)}
                    onDiceClick={() => {
                      const result = rollStarshipOracle(starforgedData, 'Initial Contact');
                      if (result) setNewStarshipInitialContact(result);
                    }}
                    options={getStarshipOracleOptions(starforgedData, 'Initial Contact')}
                    placeholder="Select initial contact..."
                  />
                </ModalField>
                <ModalField label="First Look">
                  <DiceSelect
                    value={newStarshipFirstLook}
                    onChange={(e) => setNewStarshipFirstLook(e.target.value)}
                    onDiceClick={() => {
                      const result = rollStarshipOracle(starforgedData, 'First Look');
                      if (result) setNewStarshipFirstLook(result);
                    }}
                    options={getStarshipOracleOptions(starforgedData, 'First Look')}
                    placeholder="Select first look..."
                  />
                </ModalField>
                <ModalField label="Mission">
                  <DiceSelect
                    value={newStarshipMission}
                    onChange={(e) => setNewStarshipMission(e.target.value)}
                    onDiceClick={() => {
                      const result = rollStarshipOracle(starforgedData, 'Mission');
                      if (result) setNewStarshipMission(result);
                    }}
                    options={getStarshipOracleOptions(starforgedData, 'Mission')}
                    placeholder="Select mission..."
                  />
                </ModalField>
              </>
            ) : newOnboardEntityType === 'custom' ? (
              <>
                <ModalField label="Name">
                  <DiceInput
                    value={newCustomName}
                    onChange={(e) => setNewCustomName(e.target.value)}
                    placeholder="Enter name..."
                  />
                </ModalField>
                <ModalField label="Action">
                  <DiceSelect
                    value={newCustomAction}
                    onChange={(e) => setNewCustomAction(e.target.value)}
                    onDiceClick={() => {
                      const result = rollCoreOracle(starforgedData, 'Action');
                      if (result) setNewCustomAction(result);
                    }}
                    options={getCoreOracleOptions(starforgedData, 'Action')}
                    placeholder="Select action..."
                  />
                </ModalField>
                <ModalField label="Theme">
                  <DiceSelect
                    value={newCustomTheme}
                    onChange={(e) => setNewCustomTheme(e.target.value)}
                    onDiceClick={() => {
                      const result = rollCoreOracle(starforgedData, 'Theme');
                      if (result) setNewCustomTheme(result);
                    }}
                    options={getCoreOracleOptions(starforgedData, 'Theme')}
                    placeholder="Select theme..."
                  />
                </ModalField>
                <ModalField label="Descriptor">
                  <DiceSelect
                    value={newCustomDescriptor}
                    onChange={(e) => setNewCustomDescriptor(e.target.value)}
                    onDiceClick={() => {
                      const result = rollCoreOracle(starforgedData, 'Descriptor');
                      if (result) setNewCustomDescriptor(result);
                    }}
                    options={getCoreOracleOptions(starforgedData, 'Descriptor')}
                    placeholder="Select descriptor..."
                  />
                </ModalField>
                <ModalField label="Focus">
                  <DiceSelect
                    value={newCustomFocus}
                    onChange={(e) => setNewCustomFocus(e.target.value)}
                    onDiceClick={() => {
                      const result = rollCoreOracle(starforgedData, 'Focus');
                      if (result) setNewCustomFocus(result);
                    }}
                    options={getCoreOracleOptions(starforgedData, 'Focus')}
                    placeholder="Select focus..."
                  />
                </ModalField>
              </>
            ) : null}
          </Modal>
          {isEditingLocation && (
            <MenuGroup>
              <MenuItem 
                label={`Remove ${location.name}`}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setConfirmDialogMessage(`Are you sure you want to remove "${location.name}"? This action cannot be undone.`);
                  setConfirmDialogCallback(() => () => {
                    removeLocation(sectorId, locationId);
                    goBack();
                  });
                  setShowConfirmDialog(true);
                }}
                isButton={true}
                destructive={true}
              />
            </MenuGroup>
          )}
          </NavigationView>
          <ConfirmDialog
            isOpen={showConfirmDialog}
            message={confirmDialogMessage}
            onConfirm={() => {
              setShowConfirmDialog(false);
              if (confirmDialogCallback) {
                confirmDialogCallback();
              }
            }}
            onCancel={() => {
              setShowConfirmDialog(false);
            }}
          />
        </>
      );
    }
  }

  // Sub-location Detail View
  if (viewName.startsWith('sublocation-')) {
    const parts = viewName.split('-');
    const sectorId = parseInt(parts[1]);
    const locationId = parseInt(parts[2]);
    const subLocationId = parseInt(parts[3]);
    const subLocation = getSubLocation(sectorId, locationId, subLocationId);
    const sector = getSector(sectorId);
    const location = getLocation(sectorId, locationId);

    if (subLocation) {
      const typeInfo = getEntityTypeInfo(subLocation.type) || { icon: '📍', label: 'Location' };

      return (
        <NavigationView 
          title={subLocation.name} 
          onBack={() => {
            if (isEditingSubLocation) {
              // Cancel edit mode
              setIsEditingSubLocation(false);
            } else {
              goBack();
            }
          }}
          backButtonText={isEditingSubLocation ? 'Cancel' : 'Back'}
          rightActionText={isEditingSubLocation ? 'Save' : 'Edit'}
          onRightActionText={() => {
            if (isEditingSubLocation) {
              // TODO: Implement save logic
              console.log('Save sub-location:', sectorId, locationId, subLocationId);
              setIsEditingSubLocation(false);
            } else {
              setIsEditingSubLocation(true);
            }
          }}
          {...scrollProps}
        >
          <DetailCard
            icon={typeInfo.icon}
            iconBg={typeInfo.iconBg}
            title={subLocation.name}
            description={typeInfo.label}
          />

          <MenuGroup title="Details">
            {subLocation.type === 'settlement' && (
              <>
                {subLocation.settlementName && (
                  <MenuItem label="Name" value={subLocation.settlementName} showChevron={false} stacked />
                )}
                {subLocation.location && (
                  <MenuItem label="Location" value={subLocation.location} showChevron={false} stacked />
                )}
                {subLocation.population && (
                  <MenuItem label="Population" value={subLocation.population} showChevron={false} stacked />
                )}
                {subLocation.firstLook && (
                  <MenuItem label="First Look" value={subLocation.firstLook} showChevron={false} stacked />
                )}
                {subLocation.initialContact && (
                  <MenuItem label="Initial Contact" value={subLocation.initialContact} showChevron={false} stacked />
                )}
                {subLocation.authority && (
                  <MenuItem label="Authority" value={subLocation.authority} showChevron={false} stacked />
                )}
                {subLocation.projects && (
                  <MenuItem label="Projects" value={subLocation.projects} showChevron={false} stacked />
                )}
                {subLocation.trouble && (
                  <MenuItem label="Trouble" value={subLocation.trouble} showChevron={false} stacked />
                )}
              </>
            )}
            {subLocation.type === 'starship' && (
              <>
                {subLocation.starshipName && (
                  <MenuItem label="Name" value={subLocation.starshipName} showChevron={false} stacked />
                )}
                {subLocation.starshipType && (
                  <MenuItem label="Type" value={subLocation.starshipType} showChevron={false} stacked />
                )}
                {subLocation.fleet && (
                  <MenuItem label="Fleet" value={subLocation.fleet} showChevron={false} stacked />
                )}
                {subLocation.initialContact && (
                  <MenuItem label="Initial Contact" value={subLocation.initialContact} showChevron={false} stacked />
                )}
                {subLocation.firstLook && (
                  <MenuItem label="First Look" value={subLocation.firstLook} showChevron={false} stacked />
                )}
                {subLocation.mission && (
                  <MenuItem label="Mission" value={subLocation.mission} showChevron={false} stacked />
                )}
              </>
            )}
            {subLocation.type === 'derelict' && (
              <>
                {subLocation.derelictLocation && (
                  <MenuItem label="Location" value={subLocation.derelictLocation} showChevron={false} stacked />
                )}
                {subLocation.derelictType && (
                  <MenuItem label="Type" value={subLocation.derelictType} showChevron={false} stacked />
                )}
                {subLocation.condition && (
                  <MenuItem label="Condition" value={subLocation.condition} showChevron={false} stacked />
                )}
                {subLocation.outerFirstLook && (
                  <MenuItem label="Outer First Look" value={subLocation.outerFirstLook} showChevron={false} stacked />
                )}
                {subLocation.innerFirstLook && (
                  <MenuItem label="Inner First Look" value={subLocation.innerFirstLook} showChevron={false} stacked />
                )}
              </>
            )}
            {subLocation.type === 'vault' && (
              <>
                {subLocation.vaultLocation && (
                  <MenuItem label="Location" value={subLocation.vaultLocation} showChevron={false} stacked />
                )}
                {subLocation.scale && (
                  <MenuItem label="Scale" value={subLocation.scale} showChevron={false} stacked />
                )}
                {subLocation.form && (
                  <MenuItem label="Form" value={subLocation.form} showChevron={false} stacked />
                )}
                {subLocation.shape && (
                  <MenuItem label="Shape" value={subLocation.shape} showChevron={false} stacked />
                )}
                {subLocation.material && (
                  <MenuItem label="Material" value={subLocation.material} showChevron={false} stacked />
                )}
                {subLocation.outerFirstLook && (
                  <MenuItem label="Outer First Look" value={subLocation.outerFirstLook} showChevron={false} stacked />
                )}
              </>
            )}
            {subLocation.type === 'creature' && (
              <>
                {subLocation.environment && (
                  <MenuItem label="Environment" value={subLocation.environment} showChevron={false} stacked />
                )}
                {subLocation.creatureScale && (
                  <MenuItem label="Scale" value={subLocation.creatureScale} showChevron={false} stacked />
                )}
                {subLocation.basicForm && (
                  <MenuItem label="Basic Form" value={subLocation.basicForm} showChevron={false} stacked />
                )}
                {subLocation.firstLook && (
                  <MenuItem label="First Look" value={subLocation.firstLook} showChevron={false} stacked />
                )}
                {subLocation.behavior && (
                  <MenuItem label="Encountered Behavior" value={subLocation.behavior} showChevron={false} stacked />
                )}
                {subLocation.revealedAspect && (
                  <MenuItem label="Revealed Aspect" value={subLocation.revealedAspect} showChevron={false} stacked />
                )}
              </>
            )}
            {subLocation.type === 'character' && (
              <>
                {subLocation.characterName && (
                  <MenuItem label="Name" value={subLocation.characterName} showChevron={false} stacked />
                )}
                {subLocation.firstLook && (
                  <MenuItem label="First Look" value={subLocation.firstLook} showChevron={false} stacked />
                )}
                {subLocation.initialDisposition && (
                  <MenuItem label="Initial Disposition" value={subLocation.initialDisposition} showChevron={false} stacked />
                )}
                {subLocation.role && (
                  <MenuItem label="Role" value={subLocation.role} showChevron={false} stacked />
                )}
                {subLocation.goal && (
                  <MenuItem label="Goal" value={subLocation.goal} showChevron={false} stacked />
                )}
              </>
            )}
            {subLocation.type === 'custom' && (
              <>
                {subLocation.customName && (
                  <MenuItem label="Name" value={subLocation.customName} showChevron={false} stacked />
                )}
                {subLocation.action && (
                  <MenuItem label="Action" value={subLocation.action} showChevron={false} stacked />
                )}
                {subLocation.theme && (
                  <MenuItem label="Theme" value={subLocation.theme} showChevron={false} stacked />
                )}
                {subLocation.descriptor && (
                  <MenuItem label="Descriptor" value={subLocation.descriptor} showChevron={false} stacked />
                )}
                {subLocation.focus && (
                  <MenuItem label="Focus" value={subLocation.focus} showChevron={false} stacked />
                )}
              </>
            )}
            {location && (
              <MenuItem label="Planet" value={location.name} showChevron={false} stacked />
            )}
            {subLocation.placement && (
              <MenuItem label="Placement" value={subLocation.placement === 'orbit' ? 'In Orbit' : 'Planetside'} showChevron={false} stacked />
            )}
          </MenuGroup>

          {/* Within section for settlement sublocations */}
          {subLocation.type === 'settlement' && (
            <>
              <MenuGroup title="Within">
                {(() => {
                  const withinEntities = subLocation.nestedEntities || [];
                  return withinEntities.length === 0 ? (
                    <MenuItem 
                      label="No entities yet"
                      showChevron={false}
                      muted={true}
                    />
                  ) : (
                    withinEntities.map(entity => {
                      const entityTypeInfo = getEntityTypeInfo(entity.type) || { icon: '📍', label: 'Entity' };
                      return (
                        <MenuItem 
                          key={entity.id}
                          icon={entityTypeInfo.icon}
                          iconBg={entityTypeInfo.iconBg}
                          label={entity.name}
                          onClick={() => navigate(`nested-${sectorId}-${locationId}-${subLocationId}-${entity.id}`)}
                        />
                      );
                    })
                  );
                })()}
                <MenuItem 
                  label="Add entity"
                  onClick={() => {
                    setCurrentSectorId(sectorId);
                    setCurrentLocationId(locationId);
                    setCurrentSubLocationId(subLocationId);
                    setParentEntityType(subLocation.type);
                    setOnboardTargetType('sublocation');
                    setShowOnboardModal(true);
                  }}
                  isButton={true}
                />
              </MenuGroup>
            </>
          )}

          {/* Within section for derelict sublocations */}
          {subLocation.type === 'derelict' && (
            <>
              <MenuGroup title="Within">
                {(() => {
                  const withinEntities = subLocation.nestedEntities || [];
                  return withinEntities.length === 0 ? (
                    <MenuItem 
                      label="No entities yet"
                      showChevron={false}
                      muted={true}
                    />
                  ) : (
                    withinEntities.map(entity => {
                      const entityTypeInfo = getEntityTypeInfo(entity.type) || { icon: '📍', label: 'Entity' };
                      return (
                        <MenuItem 
                          key={entity.id}
                          icon={entityTypeInfo.icon}
                          iconBg={entityTypeInfo.iconBg}
                          label={entity.name}
                          onClick={() => navigate(`nested-${sectorId}-${locationId}-${subLocationId}-${entity.id}`)}
                        />
                      );
                    })
                  );
                })()}
                <MenuItem 
                  label="Add entity"
                  onClick={() => {
                    setCurrentSectorId(sectorId);
                    setCurrentLocationId(locationId);
                    setCurrentSubLocationId(subLocationId);
                    setParentEntityType(subLocation.type);
                    setOnboardTargetType('sublocation');
                    setShowOnboardModal(true);
                  }}
                  isButton={true}
                />
              </MenuGroup>
            </>
          )}

          {/* Within section for vault sublocations */}
          {subLocation.type === 'vault' && (
            <>
              <MenuGroup title="Within">
                {(() => {
                  const withinEntities = subLocation.nestedEntities || [];
                  return withinEntities.length === 0 ? (
                    <MenuItem 
                      label="No entities yet"
                      showChevron={false}
                      muted={true}
                    />
                  ) : (
                    withinEntities.map(entity => {
                      const entityTypeInfo = getEntityTypeInfo(entity.type) || { icon: '📍', label: 'Entity' };
                      return (
                        <MenuItem 
                          key={entity.id}
                          icon={entityTypeInfo.icon}
                          iconBg={entityTypeInfo.iconBg}
                          label={entity.name}
                          onClick={() => navigate(`nested-${sectorId}-${locationId}-${subLocationId}-${entity.id}`)}
                        />
                      );
                    })
                  );
                })()}
                <MenuItem 
                  label="Add entity"
                  onClick={() => {
                    setCurrentSectorId(sectorId);
                    setCurrentLocationId(locationId);
                    setCurrentSubLocationId(subLocationId);
                    setParentEntityType(subLocation.type);
                    setOnboardTargetType('sublocation');
                    setShowOnboardModal(true);
                  }}
                  isButton={true}
                />
              </MenuGroup>
            </>
          )}

          {/* Onboard section for starships */}
          {subLocation.type === 'starship' && (
            <>
              <MenuGroup title="Onboard">
                {(() => {
                  const onboardEntities = subLocation.nestedEntities || [];
                  return onboardEntities.length === 0 ? (
                    <MenuItem 
                      label="No entities yet"
                      showChevron={false}
                      muted={true}
                    />
                  ) : (
                    onboardEntities.map(entity => {
                      const entityTypeInfo = getEntityTypeInfo(entity.type) || { icon: '📍', label: 'Entity' };
                      return (
                        <MenuItem 
                          key={entity.id}
                          icon={entityTypeInfo.icon}
                          iconBg={entityTypeInfo.iconBg}
                          label={entity.name}
                          onClick={() => navigate(`nested-${sectorId}-${locationId}-${subLocationId}-${entity.id}`)}
                        />
                      );
                    })
                  );
                })()}
                <MenuItem 
                  label="Add entity"
                  onClick={() => {
                    setCurrentSectorId(sectorId);
                    setCurrentLocationId(locationId);
                    setCurrentSubLocationId(subLocationId);
                    setParentEntityType(subLocation.type);
                    setOnboardTargetType('sublocation');
                    setShowOnboardModal(true);
                  }}
                  isButton={true}
                />
              </MenuGroup>
            </>
          )}

          {/* Entity Modal for sublocation entities (starship, settlement, derelict, vault) */}
          <Modal
            isOpen={showOnboardModal && onboardTargetType === 'sublocation'}
            onClose={closeOnboardModal}
            onBack={newOnboardEntityType ? () => { setNewOnboardEntityType(null); resetAllEntityFields(); } : null}
            title={newOnboardEntityType ? getEntityTypeInfo(newOnboardEntityType)?.label : (parentEntityType === 'starship' ? 'Add onboard entity' : 'Add entity within')}
            action={newOnboardEntityType ? {
              label: 'Create',
              onClick: createOnboardEntity,
              disabled: (newOnboardEntityType === 'character' && !newCharacterName.trim()) ||
                        (newOnboardEntityType === 'custom' && !newCustomName.trim())
            } : null}
          >
            {!newOnboardEntityType ? (
              <MenuGroup>
                <MenuItem 
                  icon="👤"
                  iconBg="rgba(255, 204, 0, 0.3)"
                  label="Character"
                  onClick={() => {
                    setNewOnboardEntityType('character');
                    rollAllCharacterFields();
                  }}
                />
                <MenuItem 
                  icon="👾"
                  iconBg="rgba(52, 199, 89, 0.3)"
                  label="Creature"
                  onClick={() => {
                    setNewOnboardEntityType('creature');
                    rollAllCreatureFields();
                  }}
                />
                <MenuItem 
                  icon="🚀"
                  iconBg="rgba(88, 86, 214, 0.3)"
                  label="Starship"
                  onClick={() => {
                    setNewOnboardEntityType('starship');
                    rollAllStarshipFields();
                  }}
                />
                <MenuItem 
                  icon="⭐"
                  iconBg="rgba(255, 204, 0, 0.3)"
                  label="Custom"
                  onClick={() => {
                    setNewOnboardEntityType('custom');
                    rollAllCustomFields();
                  }}
                />
              </MenuGroup>
            ) : newOnboardEntityType === 'character' ? (
              <>
                <ModalField label="Name">
                  <DiceInput
                    value={newCharacterName}
                    onChange={(e) => setNewCharacterName(e.target.value)}
                    onDiceClick={() => {
                      const name = generateCharacterName();
                      if (name) setNewCharacterName(name);
                    }}
                    placeholder="Enter name..."
                  />
                </ModalField>
                <ModalField label="First Look">
                  <DiceSelect
                    value={newCharacterFirstLook}
                    onChange={(e) => setNewCharacterFirstLook(e.target.value)}
                    onDiceClick={() => {
                      const result = rollCharacterOracle(starforgedData, 'First Look');
                      if (result) setNewCharacterFirstLook(result);
                    }}
                    options={getCharacterOracleOptions(starforgedData, 'First Look')}
                    placeholder="Select first look..."
                  />
                </ModalField>
                <ModalField label="Initial Disposition">
                  <DiceSelect
                    value={newCharacterDisposition}
                    onChange={(e) => setNewCharacterDisposition(e.target.value)}
                    onDiceClick={() => {
                      const result = rollCharacterOracle(starforgedData, 'Initial Disposition');
                      if (result) setNewCharacterDisposition(result);
                    }}
                    options={getCharacterOracleOptions(starforgedData, 'Initial Disposition')}
                    placeholder="Select disposition..."
                  />
                </ModalField>
                <ModalField label="Role">
                  <DiceSelect
                    value={newCharacterRole}
                    onChange={(e) => setNewCharacterRole(e.target.value)}
                    onDiceClick={() => {
                      const result = rollCharacterOracle(starforgedData, 'Role');
                      if (result) setNewCharacterRole(result);
                    }}
                    options={getCharacterOracleOptions(starforgedData, 'Role')}
                    placeholder="Select role..."
                  />
                </ModalField>
                <ModalField label="Goal">
                  <DiceSelect
                    value={newCharacterGoal}
                    onChange={(e) => setNewCharacterGoal(e.target.value)}
                    onDiceClick={() => {
                      const result = rollCharacterOracle(starforgedData, 'Goal');
                      if (result) setNewCharacterGoal(result);
                    }}
                    options={getCharacterOracleOptions(starforgedData, 'Goal')}
                    placeholder="Select goal..."
                  />
                </ModalField>
              </>
            ) : newOnboardEntityType === 'creature' ? (
              <>
                <ModalField label="Environment">
                  <DiceSelect
                    value={newCreatureEnvironment}
                    onChange={(e) => setNewCreatureEnvironment(e.target.value)}
                    onDiceClick={() => {
                      const result = rollCreatureOracle(starforgedData, 'Environment');
                      if (result) setNewCreatureEnvironment(result);
                    }}
                    options={getCreatureOracleOptions(starforgedData, 'Environment')}
                    placeholder="Select environment..."
                  />
                </ModalField>
                <ModalField label="Scale">
                  <DiceSelect
                    value={newCreatureScale}
                    onChange={(e) => setNewCreatureScale(e.target.value)}
                    onDiceClick={() => {
                      const result = rollCreatureOracle(starforgedData, 'Scale');
                      if (result) setNewCreatureScale(result);
                    }}
                    options={getCreatureOracleOptions(starforgedData, 'Scale')}
                    placeholder="Select scale..."
                  />
                </ModalField>
                <ModalField label="Basic Form">
                  <DiceSelect
                    value={newCreatureForm}
                    onChange={(e) => setNewCreatureForm(e.target.value)}
                    onDiceClick={() => {
                      const basicForm = rollCreatureBasicForm(starforgedData, newCreatureEnvironment);
                      if (basicForm) setNewCreatureForm(basicForm);
                    }}
                    options={getCreatureBasicFormOptions(starforgedData, newCreatureEnvironment)}
                    placeholder="Select basic form..."
                  />
                </ModalField>
                <ModalField label="First Look">
                  <DiceSelect
                    value={newCreatureFirstLook}
                    onChange={(e) => setNewCreatureFirstLook(e.target.value)}
                    onDiceClick={() => {
                      const result = rollCreatureOracle(starforgedData, 'First Look');
                      if (result) setNewCreatureFirstLook(result);
                    }}
                    options={getCreatureOracleOptions(starforgedData, 'First Look')}
                    placeholder="Select first look..."
                  />
                </ModalField>
                <ModalField label="Encountered Behavior">
                  <DiceSelect
                    value={newCreatureBehavior}
                    onChange={(e) => setNewCreatureBehavior(e.target.value)}
                    onDiceClick={() => {
                      const result = rollCreatureOracle(starforgedData, 'Encountered Behavior');
                      if (result) setNewCreatureBehavior(result);
                    }}
                    options={getCreatureOracleOptions(starforgedData, 'Encountered Behavior')}
                    placeholder="Select behavior..."
                  />
                </ModalField>
                <ModalField label="Revealed Aspect">
                  <DiceSelect
                    value={newCreatureAspect}
                    onChange={(e) => setNewCreatureAspect(e.target.value)}
                    onDiceClick={() => {
                      const result = rollCreatureOracle(starforgedData, 'Revealed Aspect');
                      if (result) setNewCreatureAspect(result);
                    }}
                    options={getCreatureOracleOptions(starforgedData, 'Revealed Aspect')}
                    placeholder="Select aspect..."
                  />
                </ModalField>
              </>
            ) : newOnboardEntityType === 'starship' ? (
              <>
                <ModalField label="Name">
                  <DiceInput
                    value={newStarshipName}
                    onChange={(e) => setNewStarshipName(e.target.value)}
                    onDiceClick={() => {
                      const name = generateStarshipName(starforgedData);
                      if (name) setNewStarshipName(name);
                    }}
                    placeholder="Enter starship name..."
                  />
                </ModalField>
                <ModalField label="Type">
                  <DiceSelect
                    value={newStarshipType}
                    onChange={(e) => setNewStarshipType(e.target.value)}
                    onDiceClick={() => {
                      const result = rollStarshipOracle(starforgedData, 'Type');
                      if (result) setNewStarshipType(result);
                    }}
                    options={getStarshipOracleOptions(starforgedData, 'Type')}
                    placeholder="Select type..."
                  />
                </ModalField>
                <ModalField label="Fleet">
                  <DiceSelect
                    value={newStarshipFleet}
                    onChange={(e) => setNewStarshipFleet(e.target.value)}
                    onDiceClick={() => {
                      const result = rollStarshipOracle(starforgedData, 'Fleet');
                      if (result) setNewStarshipFleet(result);
                    }}
                    options={getStarshipOracleOptions(starforgedData, 'Fleet')}
                    placeholder="Select fleet..."
                  />
                </ModalField>
                <ModalField label="Initial Contact">
                  <DiceSelect
                    value={newStarshipInitialContact}
                    onChange={(e) => setNewStarshipInitialContact(e.target.value)}
                    onDiceClick={() => {
                      const result = rollStarshipOracle(starforgedData, 'Initial Contact');
                      if (result) setNewStarshipInitialContact(result);
                    }}
                    options={getStarshipOracleOptions(starforgedData, 'Initial Contact')}
                    placeholder="Select initial contact..."
                  />
                </ModalField>
                <ModalField label="First Look">
                  <DiceSelect
                    value={newStarshipFirstLook}
                    onChange={(e) => setNewStarshipFirstLook(e.target.value)}
                    onDiceClick={() => {
                      const result = rollStarshipOracle(starforgedData, 'First Look');
                      if (result) setNewStarshipFirstLook(result);
                    }}
                    options={getStarshipOracleOptions(starforgedData, 'First Look')}
                    placeholder="Select first look..."
                  />
                </ModalField>
                <ModalField label="Mission">
                  <DiceSelect
                    value={newStarshipMission}
                    onChange={(e) => setNewStarshipMission(e.target.value)}
                    onDiceClick={() => {
                      const result = rollStarshipOracle(starforgedData, 'Mission');
                      if (result) setNewStarshipMission(result);
                    }}
                    options={getStarshipOracleOptions(starforgedData, 'Mission')}
                    placeholder="Select mission..."
                  />
                </ModalField>
              </>
            ) : newOnboardEntityType === 'custom' ? (
              <>
                <ModalField label="Name">
                  <DiceInput
                    value={newCustomName}
                    onChange={(e) => setNewCustomName(e.target.value)}
                    placeholder="Enter name..."
                  />
                </ModalField>
                <ModalField label="Action">
                  <DiceSelect
                    value={newCustomAction}
                    onChange={(e) => setNewCustomAction(e.target.value)}
                    onDiceClick={() => {
                      const result = rollCoreOracle(starforgedData, 'Action');
                      if (result) setNewCustomAction(result);
                    }}
                    options={getCoreOracleOptions(starforgedData, 'Action')}
                    placeholder="Select action..."
                  />
                </ModalField>
                <ModalField label="Theme">
                  <DiceSelect
                    value={newCustomTheme}
                    onChange={(e) => setNewCustomTheme(e.target.value)}
                    onDiceClick={() => {
                      const result = rollCoreOracle(starforgedData, 'Theme');
                      if (result) setNewCustomTheme(result);
                    }}
                    options={getCoreOracleOptions(starforgedData, 'Theme')}
                    placeholder="Select theme..."
                  />
                </ModalField>
                <ModalField label="Descriptor">
                  <DiceSelect
                    value={newCustomDescriptor}
                    onChange={(e) => setNewCustomDescriptor(e.target.value)}
                    onDiceClick={() => {
                      const result = rollCoreOracle(starforgedData, 'Descriptor');
                      if (result) setNewCustomDescriptor(result);
                    }}
                    options={getCoreOracleOptions(starforgedData, 'Descriptor')}
                    placeholder="Select descriptor..."
                  />
                </ModalField>
                <ModalField label="Focus">
                  <DiceSelect
                    value={newCustomFocus}
                    onChange={(e) => setNewCustomFocus(e.target.value)}
                    onDiceClick={() => {
                      const result = rollCoreOracle(starforgedData, 'Focus');
                      if (result) setNewCustomFocus(result);
                    }}
                    options={getCoreOracleOptions(starforgedData, 'Focus')}
                    placeholder="Select focus..."
                  />
                </ModalField>
              </>
            ) : null}
          </Modal>
          {isEditingSubLocation && (
            <MenuGroup>
              <MenuItem 
                label={`Remove ${subLocation.name}`}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setConfirmDialogMessage(`Are you sure you want to remove "${subLocation.name}"? This action cannot be undone.`);
                  setConfirmDialogCallback(() => () => {
                    removeSubLocation(sectorId, locationId, subLocationId);
                    goBack();
                  });
                  setShowConfirmDialog(true);
                }}
                isButton={true}
                destructive={true}
              />
            </MenuGroup>
          )}
        </NavigationView>
      );
    }
  }

  // Location Nested Entity Detail View (entities within locations)
  if (viewName.startsWith('location-nested-')) {
    const parts = viewName.split('-');
    const sectorId = parseInt(parts[2]);
    const locationId = parseInt(parts[3]);
    const entityId = parseInt(parts[4]);
    const location = getLocation(sectorId, locationId);
    const entity = getLocationNestedEntity(sectorId, locationId, entityId);

    if (entity && location) {
      const typeInfo = getEntityTypeInfo(entity.type) || { icon: '📍', label: 'Entity' };

      return (
        <NavigationView 
          title={entity.name} 
          onBack={() => {
            if (isEditingLocationNestedEntity) {
              // Cancel edit mode
              setIsEditingLocationNestedEntity(false);
            } else {
              goBack();
            }
          }}
          backButtonText={isEditingLocationNestedEntity ? 'Cancel' : 'Back'}
          rightActionText={isEditingLocationNestedEntity ? 'Save' : 'Edit'}
          onRightActionText={() => {
            if (isEditingLocationNestedEntity) {
              // TODO: Implement save logic
              console.log('Save nested entity:', sectorId, locationId, entityId);
              setIsEditingLocationNestedEntity(false);
            } else {
              setIsEditingLocationNestedEntity(true);
            }
          }}
          {...scrollProps}
        >
          <DetailCard
            icon={typeInfo.icon}
            iconBg={typeInfo.iconBg}
            title={entity.name}
            description={typeInfo.label}
          />

          {/* Onboard section for nested starship entities */}
          {entity.type === 'starship' && (
            <>
              <MenuGroup title="Onboard">
                {(() => {
                  const onboardEntities = entity.nestedEntities || [];
                  return onboardEntities.length === 0 ? (
                    <MenuItem 
                      label="No entities yet"
                      showChevron={false}
                      muted={true}
                    />
                  ) : (
                    onboardEntities.map(childEntity => {
                      const entityTypeInfo = getEntityTypeInfo(childEntity.type) || { icon: '📍', label: 'Entity' };
                      return (
                        <MenuItem 
                          key={childEntity.id}
                          icon={entityTypeInfo.icon}
                          iconBg={entityTypeInfo.iconBg}
                          label={childEntity.name}
                          onClick={() => navigate(`location-nested-child-${sectorId}-${locationId}-${entityId}-${childEntity.id}`)}
                        />
                      );
                    })
                  );
                })()}
                <MenuItem 
                  label="Add entity"
                  onClick={() => {
                    setCurrentSectorId(sectorId);
                    setCurrentLocationId(locationId);
                    setCurrentParentEntityId(entityId);
                    setParentEntityType(entity.type);
                    setDeepNestedTargetType('location-nested');
                    setShowDeepNestedModal(true);
                  }}
                  isButton={true}
                />
              </MenuGroup>
            </>
          )}

          <MenuGroup title="Details">
            {entity.type === 'character' && (
              <>
                {entity.characterName && (
                  <MenuItem label="Name" value={entity.characterName} showChevron={false} stacked />
                )}
                {entity.firstLook && (
                  <MenuItem label="First Look" value={entity.firstLook} showChevron={false} stacked />
                )}
                {entity.initialDisposition && (
                  <MenuItem label="Initial Disposition" value={entity.initialDisposition} showChevron={false} stacked />
                )}
                {entity.role && (
                  <MenuItem label="Role" value={entity.role} showChevron={false} stacked />
                )}
                {entity.goal && (
                  <MenuItem label="Goal" value={entity.goal} showChevron={false} stacked />
                )}
              </>
            )}
            {entity.type === 'creature' && (
              <>
                {entity.environment && (
                  <MenuItem label="Environment" value={entity.environment} showChevron={false} stacked />
                )}
                {entity.creatureScale && (
                  <MenuItem label="Scale" value={entity.creatureScale} showChevron={false} stacked />
                )}
                {entity.basicForm && (
                  <MenuItem label="Basic Form" value={entity.basicForm} showChevron={false} stacked />
                )}
                {entity.firstLook && (
                  <MenuItem label="First Look" value={entity.firstLook} showChevron={false} stacked />
                )}
                {entity.encounteredBehavior && (
                  <MenuItem label="Encountered Behavior" value={entity.encounteredBehavior} showChevron={false} stacked />
                )}
                {entity.revealedAspect && (
                  <MenuItem label="Revealed Aspect" value={entity.revealedAspect} showChevron={false} stacked />
                )}
              </>
            )}
            {entity.type === 'starship' && (
              <>
                {entity.starshipName && (
                  <MenuItem label="Name" value={entity.starshipName} showChevron={false} stacked />
                )}
                {entity.starshipType && (
                  <MenuItem label="Type" value={entity.starshipType} showChevron={false} stacked />
                )}
                {entity.fleet && (
                  <MenuItem label="Fleet" value={entity.fleet} showChevron={false} stacked />
                )}
                {entity.initialContact && (
                  <MenuItem label="Initial Contact" value={entity.initialContact} showChevron={false} stacked />
                )}
                {entity.firstLook && (
                  <MenuItem label="First Look" value={entity.firstLook} showChevron={false} stacked />
                )}
                {entity.mission && (
                  <MenuItem label="Mission" value={entity.mission} showChevron={false} stacked />
                )}
              </>
            )}
            {entity.type === 'custom' && (
              <>
                {entity.customName && (
                  <MenuItem label="Name" value={entity.customName} showChevron={false} stacked />
                )}
                {entity.action && (
                  <MenuItem label="Action" value={entity.action} showChevron={false} stacked />
                )}
                {entity.theme && (
                  <MenuItem label="Theme" value={entity.theme} showChevron={false} stacked />
                )}
                {entity.descriptor && (
                  <MenuItem label="Descriptor" value={entity.descriptor} showChevron={false} stacked />
                )}
                {entity.focus && (
                  <MenuItem label="Focus" value={entity.focus} showChevron={false} stacked />
                )}
              </>
            )}
          </MenuGroup>

          <MenuGroup>
            <MenuItem 
              label="Remove Entity"
              onClick={() => {
                removeLocationNestedEntity(sectorId, locationId, entityId);
                goBack();
              }}
              isButton={true}
            />
          </MenuGroup>

          {/* Modal for entities within nested entities (location-nested) */}
          <Modal
            isOpen={showDeepNestedModal && deepNestedTargetType === 'location-nested'}
            onClose={closeDeepNestedModal}
            onBack={newDeepNestedEntityType ? () => { setNewDeepNestedEntityType(null); resetAllEntityFields(); } : null}
            title={newDeepNestedEntityType ? getEntityTypeInfo(newDeepNestedEntityType)?.label : 'Add onboard entity'}
            action={newDeepNestedEntityType ? {
              label: 'Create',
              onClick: createDeepNestedEntity,
              disabled: (newDeepNestedEntityType === 'character' && !newCharacterName.trim()) ||
                        (newDeepNestedEntityType === 'custom' && !newCustomName.trim())
            } : null}
          >
            {!newDeepNestedEntityType ? (
              <MenuGroup>
                <MenuItem 
                  icon="👤"
                  iconBg="rgba(255, 204, 0, 0.3)"
                  label="Character"
                  onClick={() => {
                    setNewDeepNestedEntityType('character');
                    rollAllCharacterFields();
                  }}
                />
                <MenuItem 
                  icon="👾"
                  iconBg="rgba(52, 199, 89, 0.3)"
                  label="Creature"
                  onClick={() => {
                    setNewDeepNestedEntityType('creature');
                    rollAllCreatureFields();
                  }}
                />
                <MenuItem 
                  icon="🚀"
                  iconBg="rgba(88, 86, 214, 0.3)"
                  label="Starship"
                  onClick={() => {
                    setNewDeepNestedEntityType('starship');
                    rollAllStarshipFields();
                  }}
                />
                <MenuItem 
                  icon="⭐"
                  iconBg="rgba(255, 204, 0, 0.3)"
                  label="Custom"
                  onClick={() => {
                    setNewDeepNestedEntityType('custom');
                    rollAllCustomFields();
                  }}
                />
              </MenuGroup>
            ) : newDeepNestedEntityType === 'character' ? (
              <>
                <ModalField label="Name">
                  <DiceInput
                    value={newCharacterName}
                    onChange={(e) => setNewCharacterName(e.target.value)}
                    onDiceClick={() => {
                      const name = generateCharacterName();
                      if (name) setNewCharacterName(name);
                    }}
                    placeholder="Enter name..."
                  />
                </ModalField>
                <ModalField label="First Look">
                  <DiceSelect
                    value={newCharacterFirstLook}
                    onChange={(e) => setNewCharacterFirstLook(e.target.value)}
                    onDiceClick={() => {
                      const result = rollCharacterOracle(starforgedData, 'First Look');
                      if (result) setNewCharacterFirstLook(result);
                    }}
                    options={getCharacterOracleOptions(starforgedData, 'First Look')}
                    placeholder="Select first look..."
                  />
                </ModalField>
                <ModalField label="Initial Disposition">
                  <DiceSelect
                    value={newCharacterDisposition}
                    onChange={(e) => setNewCharacterDisposition(e.target.value)}
                    onDiceClick={() => {
                      const result = rollCharacterOracle(starforgedData, 'Initial Disposition');
                      if (result) setNewCharacterDisposition(result);
                    }}
                    options={getCharacterOracleOptions(starforgedData, 'Initial Disposition')}
                    placeholder="Select disposition..."
                  />
                </ModalField>
                <ModalField label="Role">
                  <DiceSelect
                    value={newCharacterRole}
                    onChange={(e) => setNewCharacterRole(e.target.value)}
                    onDiceClick={() => {
                      const result = rollCharacterOracle(starforgedData, 'Role');
                      if (result) setNewCharacterRole(result);
                    }}
                    options={getCharacterOracleOptions(starforgedData, 'Role')}
                    placeholder="Select role..."
                  />
                </ModalField>
                <ModalField label="Goal">
                  <DiceSelect
                    value={newCharacterGoal}
                    onChange={(e) => setNewCharacterGoal(e.target.value)}
                    onDiceClick={() => {
                      const result = rollCharacterOracle(starforgedData, 'Goal');
                      if (result) setNewCharacterGoal(result);
                    }}
                    options={getCharacterOracleOptions(starforgedData, 'Goal')}
                    placeholder="Select goal..."
                  />
                </ModalField>
              </>
            ) : newDeepNestedEntityType === 'creature' ? (
              <>
                <ModalField label="Environment">
                  <DiceSelect
                    value={newCreatureEnvironment}
                    onChange={(e) => setNewCreatureEnvironment(e.target.value)}
                    onDiceClick={() => {
                      const result = rollCreatureOracle(starforgedData, 'Environment');
                      if (result) setNewCreatureEnvironment(result);
                    }}
                    options={getCreatureOracleOptions(starforgedData, 'Environment')}
                    placeholder="Select environment..."
                  />
                </ModalField>
                <ModalField label="Scale">
                  <DiceSelect
                    value={newCreatureScale}
                    onChange={(e) => setNewCreatureScale(e.target.value)}
                    onDiceClick={() => {
                      const result = rollCreatureOracle(starforgedData, 'Scale');
                      if (result) setNewCreatureScale(result);
                    }}
                    options={getCreatureOracleOptions(starforgedData, 'Scale')}
                    placeholder="Select scale..."
                  />
                </ModalField>
                <ModalField label="Basic Form">
                  <DiceSelect
                    value={newCreatureForm}
                    onChange={(e) => setNewCreatureForm(e.target.value)}
                    onDiceClick={() => {
                      const basicForm = rollCreatureBasicForm(starforgedData, newCreatureEnvironment);
                      if (basicForm) setNewCreatureForm(basicForm);
                    }}
                    options={getCreatureBasicFormOptions(starforgedData, newCreatureEnvironment)}
                    placeholder="Select basic form..."
                  />
                </ModalField>
                <ModalField label="First Look">
                  <DiceSelect
                    value={newCreatureFirstLook}
                    onChange={(e) => setNewCreatureFirstLook(e.target.value)}
                    onDiceClick={() => {
                      const result = rollCreatureOracle(starforgedData, 'First Look');
                      if (result) setNewCreatureFirstLook(result);
                    }}
                    options={getCreatureOracleOptions(starforgedData, 'First Look')}
                    placeholder="Select first look..."
                  />
                </ModalField>
                <ModalField label="Encountered Behavior">
                  <DiceSelect
                    value={newCreatureBehavior}
                    onChange={(e) => setNewCreatureBehavior(e.target.value)}
                    onDiceClick={() => {
                      const result = rollCreatureOracle(starforgedData, 'Encountered Behavior');
                      if (result) setNewCreatureBehavior(result);
                    }}
                    options={getCreatureOracleOptions(starforgedData, 'Encountered Behavior')}
                    placeholder="Select behavior..."
                  />
                </ModalField>
                <ModalField label="Revealed Aspect">
                  <DiceSelect
                    value={newCreatureAspect}
                    onChange={(e) => setNewCreatureAspect(e.target.value)}
                    onDiceClick={() => {
                      const result = rollCreatureOracle(starforgedData, 'Revealed Aspect');
                      if (result) setNewCreatureAspect(result);
                    }}
                    options={getCreatureOracleOptions(starforgedData, 'Revealed Aspect')}
                    placeholder="Select aspect..."
                  />
                </ModalField>
              </>
            ) : newDeepNestedEntityType === 'starship' ? (
              <>
                <ModalField label="Name">
                  <DiceInput
                    value={newStarshipName}
                    onChange={(e) => setNewStarshipName(e.target.value)}
                    onDiceClick={() => {
                      const name = generateStarshipName(starforgedData);
                      if (name) setNewStarshipName(name);
                    }}
                    placeholder="Enter starship name..."
                  />
                </ModalField>
                <ModalField label="Type">
                  <DiceSelect
                    value={newStarshipType}
                    onChange={(e) => setNewStarshipType(e.target.value)}
                    onDiceClick={() => {
                      const result = rollStarshipOracle(starforgedData, 'Type');
                      if (result) setNewStarshipType(result);
                    }}
                    options={getStarshipOracleOptions(starforgedData, 'Type')}
                    placeholder="Select type..."
                  />
                </ModalField>
                <ModalField label="Fleet">
                  <DiceSelect
                    value={newStarshipFleet}
                    onChange={(e) => setNewStarshipFleet(e.target.value)}
                    onDiceClick={() => {
                      const result = rollStarshipOracle(starforgedData, 'Fleet');
                      if (result) setNewStarshipFleet(result);
                    }}
                    options={getStarshipOracleOptions(starforgedData, 'Fleet')}
                    placeholder="Select fleet..."
                  />
                </ModalField>
                <ModalField label="Initial Contact">
                  <DiceSelect
                    value={newStarshipInitialContact}
                    onChange={(e) => setNewStarshipInitialContact(e.target.value)}
                    onDiceClick={() => {
                      const result = rollStarshipOracle(starforgedData, 'Initial Contact');
                      if (result) setNewStarshipInitialContact(result);
                    }}
                    options={getStarshipOracleOptions(starforgedData, 'Initial Contact')}
                    placeholder="Select contact..."
                  />
                </ModalField>
                <ModalField label="First Look">
                  <DiceSelect
                    value={newStarshipFirstLook}
                    onChange={(e) => setNewStarshipFirstLook(e.target.value)}
                    onDiceClick={() => {
                      const result = rollStarshipOracle(starforgedData, 'First Look');
                      if (result) setNewStarshipFirstLook(result);
                    }}
                    options={getStarshipOracleOptions(starforgedData, 'First Look')}
                    placeholder="Select first look..."
                  />
                </ModalField>
                <ModalField label="Mission">
                  <DiceSelect
                    value={newStarshipMission}
                    onChange={(e) => setNewStarshipMission(e.target.value)}
                    onDiceClick={() => {
                      const mission = rollStarshipMission(starforgedData);
                      if (mission) setNewStarshipMission(mission);
                    }}
                    options={getStarshipMissionOptions(starforgedData)}
                    placeholder="Select mission..."
                  />
                </ModalField>
              </>
            ) : newDeepNestedEntityType === 'custom' ? (
              <>
                <ModalField label="Name">
                  <DiceInput
                    value={newCustomName}
                    onChange={(e) => setNewCustomName(e.target.value)}
                    placeholder="Enter name..."
                  />
                </ModalField>
                <ModalField label="Action">
                  <DiceSelect
                    value={newCustomAction}
                    onChange={(e) => setNewCustomAction(e.target.value)}
                    onDiceClick={() => {
                      const result = rollCoreOracle(starforgedData, 'Action');
                      if (result) setNewCustomAction(result);
                    }}
                    options={getCoreOracleOptions(starforgedData, 'Action')}
                    placeholder="Select action..."
                  />
                </ModalField>
                <ModalField label="Theme">
                  <DiceSelect
                    value={newCustomTheme}
                    onChange={(e) => setNewCustomTheme(e.target.value)}
                    onDiceClick={() => {
                      const result = rollCoreOracle(starforgedData, 'Theme');
                      if (result) setNewCustomTheme(result);
                    }}
                    options={getCoreOracleOptions(starforgedData, 'Theme')}
                    placeholder="Select theme..."
                  />
                </ModalField>
                <ModalField label="Descriptor">
                  <DiceSelect
                    value={newCustomDescriptor}
                    onChange={(e) => setNewCustomDescriptor(e.target.value)}
                    onDiceClick={() => {
                      const result = rollCoreOracle(starforgedData, 'Descriptor');
                      if (result) setNewCustomDescriptor(result);
                    }}
                    options={getCoreOracleOptions(starforgedData, 'Descriptor')}
                    placeholder="Select descriptor..."
                  />
                </ModalField>
                <ModalField label="Focus">
                  <DiceSelect
                    value={newCustomFocus}
                    onChange={(e) => setNewCustomFocus(e.target.value)}
                    onDiceClick={() => {
                      const result = rollCoreOracle(starforgedData, 'Focus');
                      if (result) setNewCustomFocus(result);
                    }}
                    options={getCoreOracleOptions(starforgedData, 'Focus')}
                    placeholder="Select focus..."
                  />
                </ModalField>
              </>
            ) : null}
          </Modal>
          {isEditingLocationNestedEntity && (
            <MenuGroup>
              <MenuItem 
                label={`Remove ${entity.name}`}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setConfirmDialogMessage(`Are you sure you want to remove "${entity.name}"? This action cannot be undone.`);
                  setConfirmDialogCallback(() => () => {
                    removeLocationNestedEntity(sectorId, locationId, entityId);
                    goBack();
                  });
                  setShowConfirmDialog(true);
                }}
                isButton={true}
                destructive={true}
              />
            </MenuGroup>
          )}
        </NavigationView>
      );
    }
  }

  // Sublocation Nested Entity Detail View (entities within sublocations)
  if (viewName.startsWith('nested-')) {
    const parts = viewName.split('-');
    const sectorId = parseInt(parts[1]);
    const locationId = parseInt(parts[2]);
    const subLocationId = parseInt(parts[3]);
    const entityId = parseInt(parts[4]);
    const subLocation = getSubLocation(sectorId, locationId, subLocationId);
    const location = getLocation(sectorId, locationId);
    const entity = getNestedEntity(sectorId, locationId, subLocationId, entityId);

    if (entity && subLocation) {
      const typeInfo = getEntityTypeInfo(entity.type) || { icon: '📍', label: 'Entity' };

      return (
        <NavigationView 
          title={entity.name} 
          onBack={() => {
            if (isEditingNestedEntity) {
              // Cancel edit mode
              setIsEditingNestedEntity(false);
            } else {
              goBack();
            }
          }}
          backButtonText={isEditingNestedEntity ? 'Cancel' : 'Back'}
          rightActionText={isEditingNestedEntity ? 'Save' : 'Edit'}
          onRightActionText={() => {
            if (isEditingNestedEntity) {
              // TODO: Implement save logic
              console.log('Save nested entity in sub-location:', sectorId, locationId, subLocationId, entityId);
              setIsEditingNestedEntity(false);
            } else {
              setIsEditingNestedEntity(true);
            }
          }}
          {...scrollProps}
        >
          <DetailCard
            icon={typeInfo.icon}
            iconBg={typeInfo.iconBg}
            title={entity.name}
            description={typeInfo.label}
          />

          {/* Onboard section for nested starship entities */}
          {entity.type === 'starship' && (
            <>
              <MenuGroup title="Onboard">
                {(() => {
                  const onboardEntities = entity.nestedEntities || [];
                  return onboardEntities.length === 0 ? (
                    <MenuItem 
                      label="No entities yet"
                      showChevron={false}
                      muted={true}
                    />
                  ) : (
                    onboardEntities.map(childEntity => {
                      const entityTypeInfo = getEntityTypeInfo(childEntity.type) || { icon: '📍', label: 'Entity' };
                      return (
                        <MenuItem 
                          key={childEntity.id}
                          icon={entityTypeInfo.icon}
                          iconBg={entityTypeInfo.iconBg}
                          label={childEntity.name}
                          onClick={() => navigate(`nested-child-${sectorId}-${locationId}-${subLocationId}-${entityId}-${childEntity.id}`)}
                        />
                      );
                    })
                  );
                })()}
                <MenuItem 
                  label="Add entity"
                  onClick={() => {
                    setCurrentSectorId(sectorId);
                    setCurrentLocationId(locationId);
                    setCurrentSubLocationId(subLocationId);
                    setCurrentParentEntityId(entityId);
                    setParentEntityType(entity.type);
                    setDeepNestedTargetType('sublocation-nested');
                    setShowDeepNestedModal(true);
                  }}
                  isButton={true}
                />
              </MenuGroup>
            </>
          )}

          <MenuGroup title="Details">
            {entity.type === 'character' && (
              <>
                {entity.characterName && (
                  <MenuItem label="Name" value={entity.characterName} showChevron={false} stacked />
                )}
                {entity.firstLook && (
                  <MenuItem label="First Look" value={entity.firstLook} showChevron={false} stacked />
                )}
                {entity.initialDisposition && (
                  <MenuItem label="Initial Disposition" value={entity.initialDisposition} showChevron={false} stacked />
                )}
                {entity.role && (
                  <MenuItem label="Role" value={entity.role} showChevron={false} stacked />
                )}
                {entity.goal && (
                  <MenuItem label="Goal" value={entity.goal} showChevron={false} stacked />
                )}
              </>
            )}
            {entity.type === 'creature' && (
              <>
                {entity.environment && (
                  <MenuItem label="Environment" value={entity.environment} showChevron={false} stacked />
                )}
                {entity.creatureScale && (
                  <MenuItem label="Scale" value={entity.creatureScale} showChevron={false} stacked />
                )}
                {entity.basicForm && (
                  <MenuItem label="Basic Form" value={entity.basicForm} showChevron={false} stacked />
                )}
                {entity.firstLook && (
                  <MenuItem label="First Look" value={entity.firstLook} showChevron={false} stacked />
                )}
                {entity.encounteredBehavior && (
                  <MenuItem label="Encountered Behavior" value={entity.encounteredBehavior} showChevron={false} stacked />
                )}
                {entity.revealedAspect && (
                  <MenuItem label="Revealed Aspect" value={entity.revealedAspect} showChevron={false} stacked />
                )}
              </>
            )}
            {entity.type === 'starship' && (
              <>
                {entity.starshipName && (
                  <MenuItem label="Name" value={entity.starshipName} showChevron={false} stacked />
                )}
                {entity.starshipType && (
                  <MenuItem label="Type" value={entity.starshipType} showChevron={false} stacked />
                )}
                {entity.fleet && (
                  <MenuItem label="Fleet" value={entity.fleet} showChevron={false} stacked />
                )}
                {entity.initialContact && (
                  <MenuItem label="Initial Contact" value={entity.initialContact} showChevron={false} stacked />
                )}
                {entity.firstLook && (
                  <MenuItem label="First Look" value={entity.firstLook} showChevron={false} stacked />
                )}
                {entity.mission && (
                  <MenuItem label="Mission" value={entity.mission} showChevron={false} stacked />
                )}
              </>
            )}
            {entity.type === 'custom' && (
              <>
                {entity.customName && (
                  <MenuItem label="Name" value={entity.customName} showChevron={false} stacked />
                )}
                {entity.action && (
                  <MenuItem label="Action" value={entity.action} showChevron={false} stacked />
                )}
                {entity.theme && (
                  <MenuItem label="Theme" value={entity.theme} showChevron={false} stacked />
                )}
                {entity.descriptor && (
                  <MenuItem label="Descriptor" value={entity.descriptor} showChevron={false} stacked />
                )}
                {entity.focus && (
                  <MenuItem label="Focus" value={entity.focus} showChevron={false} stacked />
                )}
              </>
            )}
          </MenuGroup>

          <MenuGroup>
            <MenuItem 
              label="Remove Entity"
              onClick={() => {
                removeNestedEntity(sectorId, locationId, subLocationId, entityId);
                goBack();
              }}
              isButton={true}
            />
          </MenuGroup>

          {/* Modal for entities within nested entities (sublocation-nested) */}
          <Modal
            isOpen={showDeepNestedModal && deepNestedTargetType === 'sublocation-nested'}
            onClose={closeDeepNestedModal}
            onBack={newDeepNestedEntityType ? () => { setNewDeepNestedEntityType(null); resetAllEntityFields(); } : null}
            title={newDeepNestedEntityType ? getEntityTypeInfo(newDeepNestedEntityType)?.label : 'Add onboard entity'}
            action={newDeepNestedEntityType ? {
              label: 'Create',
              onClick: createDeepNestedEntity,
              disabled: (newDeepNestedEntityType === 'character' && !newCharacterName.trim()) ||
                        (newDeepNestedEntityType === 'custom' && !newCustomName.trim())
            } : null}
          >
            {!newDeepNestedEntityType ? (
              <MenuGroup>
                <MenuItem 
                  icon="👤"
                  iconBg="rgba(255, 204, 0, 0.3)"
                  label="Character"
                  onClick={() => {
                    setNewDeepNestedEntityType('character');
                    rollAllCharacterFields();
                  }}
                />
                <MenuItem 
                  icon="👾"
                  iconBg="rgba(52, 199, 89, 0.3)"
                  label="Creature"
                  onClick={() => {
                    setNewDeepNestedEntityType('creature');
                    rollAllCreatureFields();
                  }}
                />
                <MenuItem 
                  icon="🚀"
                  iconBg="rgba(88, 86, 214, 0.3)"
                  label="Starship"
                  onClick={() => {
                    setNewDeepNestedEntityType('starship');
                    rollAllStarshipFields();
                  }}
                />
                <MenuItem 
                  icon="⭐"
                  iconBg="rgba(255, 204, 0, 0.3)"
                  label="Custom"
                  onClick={() => {
                    setNewDeepNestedEntityType('custom');
                    rollAllCustomFields();
                  }}
                />
              </MenuGroup>
            ) : newDeepNestedEntityType === 'character' ? (
              <>
                <ModalField label="Name">
                  <DiceInput
                    value={newCharacterName}
                    onChange={(e) => setNewCharacterName(e.target.value)}
                    onDiceClick={() => {
                      const name = generateCharacterName();
                      if (name) setNewCharacterName(name);
                    }}
                    placeholder="Enter name..."
                  />
                </ModalField>
                <ModalField label="First Look">
                  <DiceSelect
                    value={newCharacterFirstLook}
                    onChange={(e) => setNewCharacterFirstLook(e.target.value)}
                    onDiceClick={() => {
                      const result = rollCharacterOracle(starforgedData, 'First Look');
                      if (result) setNewCharacterFirstLook(result);
                    }}
                    options={getCharacterOracleOptions(starforgedData, 'First Look')}
                    placeholder="Select first look..."
                  />
                </ModalField>
                <ModalField label="Initial Disposition">
                  <DiceSelect
                    value={newCharacterDisposition}
                    onChange={(e) => setNewCharacterDisposition(e.target.value)}
                    onDiceClick={() => {
                      const result = rollCharacterOracle(starforgedData, 'Initial Disposition');
                      if (result) setNewCharacterDisposition(result);
                    }}
                    options={getCharacterOracleOptions(starforgedData, 'Initial Disposition')}
                    placeholder="Select disposition..."
                  />
                </ModalField>
                <ModalField label="Role">
                  <DiceSelect
                    value={newCharacterRole}
                    onChange={(e) => setNewCharacterRole(e.target.value)}
                    onDiceClick={() => {
                      const result = rollCharacterOracle(starforgedData, 'Role');
                      if (result) setNewCharacterRole(result);
                    }}
                    options={getCharacterOracleOptions(starforgedData, 'Role')}
                    placeholder="Select role..."
                  />
                </ModalField>
                <ModalField label="Goal">
                  <DiceSelect
                    value={newCharacterGoal}
                    onChange={(e) => setNewCharacterGoal(e.target.value)}
                    onDiceClick={() => {
                      const result = rollCharacterOracle(starforgedData, 'Goal');
                      if (result) setNewCharacterGoal(result);
                    }}
                    options={getCharacterOracleOptions(starforgedData, 'Goal')}
                    placeholder="Select goal..."
                  />
                </ModalField>
              </>
            ) : newDeepNestedEntityType === 'creature' ? (
              <>
                <ModalField label="Environment">
                  <DiceSelect
                    value={newCreatureEnvironment}
                    onChange={(e) => setNewCreatureEnvironment(e.target.value)}
                    onDiceClick={() => {
                      const result = rollCreatureOracle(starforgedData, 'Environment');
                      if (result) setNewCreatureEnvironment(result);
                    }}
                    options={getCreatureOracleOptions(starforgedData, 'Environment')}
                    placeholder="Select environment..."
                  />
                </ModalField>
                <ModalField label="Scale">
                  <DiceSelect
                    value={newCreatureScale}
                    onChange={(e) => setNewCreatureScale(e.target.value)}
                    onDiceClick={() => {
                      const result = rollCreatureOracle(starforgedData, 'Scale');
                      if (result) setNewCreatureScale(result);
                    }}
                    options={getCreatureOracleOptions(starforgedData, 'Scale')}
                    placeholder="Select scale..."
                  />
                </ModalField>
                <ModalField label="Basic Form">
                  <DiceSelect
                    value={newCreatureForm}
                    onChange={(e) => setNewCreatureForm(e.target.value)}
                    onDiceClick={() => {
                      const basicForm = rollCreatureBasicForm(starforgedData, newCreatureEnvironment);
                      if (basicForm) setNewCreatureForm(basicForm);
                    }}
                    options={getCreatureBasicFormOptions(starforgedData, newCreatureEnvironment)}
                    placeholder="Select basic form..."
                  />
                </ModalField>
                <ModalField label="First Look">
                  <DiceSelect
                    value={newCreatureFirstLook}
                    onChange={(e) => setNewCreatureFirstLook(e.target.value)}
                    onDiceClick={() => {
                      const result = rollCreatureOracle(starforgedData, 'First Look');
                      if (result) setNewCreatureFirstLook(result);
                    }}
                    options={getCreatureOracleOptions(starforgedData, 'First Look')}
                    placeholder="Select first look..."
                  />
                </ModalField>
                <ModalField label="Encountered Behavior">
                  <DiceSelect
                    value={newCreatureBehavior}
                    onChange={(e) => setNewCreatureBehavior(e.target.value)}
                    onDiceClick={() => {
                      const result = rollCreatureOracle(starforgedData, 'Encountered Behavior');
                      if (result) setNewCreatureBehavior(result);
                    }}
                    options={getCreatureOracleOptions(starforgedData, 'Encountered Behavior')}
                    placeholder="Select behavior..."
                  />
                </ModalField>
                <ModalField label="Revealed Aspect">
                  <DiceSelect
                    value={newCreatureAspect}
                    onChange={(e) => setNewCreatureAspect(e.target.value)}
                    onDiceClick={() => {
                      const result = rollCreatureOracle(starforgedData, 'Revealed Aspect');
                      if (result) setNewCreatureAspect(result);
                    }}
                    options={getCreatureOracleOptions(starforgedData, 'Revealed Aspect')}
                    placeholder="Select aspect..."
                  />
                </ModalField>
              </>
            ) : newDeepNestedEntityType === 'starship' ? (
              <>
                <ModalField label="Name">
                  <DiceInput
                    value={newStarshipName}
                    onChange={(e) => setNewStarshipName(e.target.value)}
                    onDiceClick={() => {
                      const name = generateStarshipName(starforgedData);
                      if (name) setNewStarshipName(name);
                    }}
                    placeholder="Enter starship name..."
                  />
                </ModalField>
                <ModalField label="Type">
                  <DiceSelect
                    value={newStarshipType}
                    onChange={(e) => setNewStarshipType(e.target.value)}
                    onDiceClick={() => {
                      const result = rollStarshipOracle(starforgedData, 'Type');
                      if (result) setNewStarshipType(result);
                    }}
                    options={getStarshipOracleOptions(starforgedData, 'Type')}
                    placeholder="Select type..."
                  />
                </ModalField>
                <ModalField label="Fleet">
                  <DiceSelect
                    value={newStarshipFleet}
                    onChange={(e) => setNewStarshipFleet(e.target.value)}
                    onDiceClick={() => {
                      const result = rollStarshipOracle(starforgedData, 'Fleet');
                      if (result) setNewStarshipFleet(result);
                    }}
                    options={getStarshipOracleOptions(starforgedData, 'Fleet')}
                    placeholder="Select fleet..."
                  />
                </ModalField>
                <ModalField label="Initial Contact">
                  <DiceSelect
                    value={newStarshipInitialContact}
                    onChange={(e) => setNewStarshipInitialContact(e.target.value)}
                    onDiceClick={() => {
                      const result = rollStarshipOracle(starforgedData, 'Initial Contact');
                      if (result) setNewStarshipInitialContact(result);
                    }}
                    options={getStarshipOracleOptions(starforgedData, 'Initial Contact')}
                    placeholder="Select contact..."
                  />
                </ModalField>
                <ModalField label="First Look">
                  <DiceSelect
                    value={newStarshipFirstLook}
                    onChange={(e) => setNewStarshipFirstLook(e.target.value)}
                    onDiceClick={() => {
                      const result = rollStarshipOracle(starforgedData, 'First Look');
                      if (result) setNewStarshipFirstLook(result);
                    }}
                    options={getStarshipOracleOptions(starforgedData, 'First Look')}
                    placeholder="Select first look..."
                  />
                </ModalField>
                <ModalField label="Mission">
                  <DiceSelect
                    value={newStarshipMission}
                    onChange={(e) => setNewStarshipMission(e.target.value)}
                    onDiceClick={() => {
                      const mission = rollStarshipMission(starforgedData);
                      if (mission) setNewStarshipMission(mission);
                    }}
                    options={getStarshipMissionOptions(starforgedData)}
                    placeholder="Select mission..."
                  />
                </ModalField>
              </>
            ) : newDeepNestedEntityType === 'custom' ? (
              <>
                <ModalField label="Name">
                  <DiceInput
                    value={newCustomName}
                    onChange={(e) => setNewCustomName(e.target.value)}
                    placeholder="Enter name..."
                  />
                </ModalField>
                <ModalField label="Action">
                  <DiceSelect
                    value={newCustomAction}
                    onChange={(e) => setNewCustomAction(e.target.value)}
                    onDiceClick={() => {
                      const result = rollCoreOracle(starforgedData, 'Action');
                      if (result) setNewCustomAction(result);
                    }}
                    options={getCoreOracleOptions(starforgedData, 'Action')}
                    placeholder="Select action..."
                  />
                </ModalField>
                <ModalField label="Theme">
                  <DiceSelect
                    value={newCustomTheme}
                    onChange={(e) => setNewCustomTheme(e.target.value)}
                    onDiceClick={() => {
                      const result = rollCoreOracle(starforgedData, 'Theme');
                      if (result) setNewCustomTheme(result);
                    }}
                    options={getCoreOracleOptions(starforgedData, 'Theme')}
                    placeholder="Select theme..."
                  />
                </ModalField>
                <ModalField label="Descriptor">
                  <DiceSelect
                    value={newCustomDescriptor}
                    onChange={(e) => setNewCustomDescriptor(e.target.value)}
                    onDiceClick={() => {
                      const result = rollCoreOracle(starforgedData, 'Descriptor');
                      if (result) setNewCustomDescriptor(result);
                    }}
                    options={getCoreOracleOptions(starforgedData, 'Descriptor')}
                    placeholder="Select descriptor..."
                  />
                </ModalField>
                <ModalField label="Focus">
                  <DiceSelect
                    value={newCustomFocus}
                    onChange={(e) => setNewCustomFocus(e.target.value)}
                    onDiceClick={() => {
                      const result = rollCoreOracle(starforgedData, 'Focus');
                      if (result) setNewCustomFocus(result);
                    }}
                    options={getCoreOracleOptions(starforgedData, 'Focus')}
                    placeholder="Select focus..."
                  />
                </ModalField>
              </>
            ) : null}
          </Modal>
          {isEditingNestedEntity && (
            <MenuGroup>
              <MenuItem 
                label={`Remove ${entity.name}`}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setConfirmDialogMessage(`Are you sure you want to remove "${entity.name}"? This action cannot be undone.`);
                  setConfirmDialogCallback(() => () => {
                    removeNestedEntity(sectorId, locationId, subLocationId, entityId);
                    goBack();
                  });
                  setShowConfirmDialog(true);
                }}
                isButton={true}
                destructive={true}
              />
            </MenuGroup>
          )}
        </NavigationView>
      );
    }
  }

  // Location Nested Entity Child Detail View (entities within location nested entities)
  if (viewName.startsWith('location-nested-child-')) {
    const parts = viewName.split('-');
    const sectorId = parseInt(parts[3]);
    const locationId = parseInt(parts[4]);
    const parentEntityId = parseInt(parts[5]);
    const childEntityId = parseInt(parts[6]);
    const location = getLocation(sectorId, locationId);
    const parentEntity = getLocationNestedEntity(sectorId, locationId, parentEntityId);
    const childEntity = getLocationNestedEntityChild(sectorId, locationId, parentEntityId, childEntityId);

    if (childEntity && parentEntity && location) {
      const typeInfo = getEntityTypeInfo(childEntity.type) || { icon: '📍', label: 'Entity' };

      return (
        <NavigationView 
          title={childEntity.name} 
          onBack={() => {
            if (isEditingLocationNestedEntityChild) {
              // Cancel edit mode
              setIsEditingLocationNestedEntityChild(false);
            } else {
              goBack();
            }
          }}
          backButtonText={isEditingLocationNestedEntityChild ? 'Cancel' : 'Back'}
          rightActionText={isEditingLocationNestedEntityChild ? 'Save' : 'Edit'}
          onRightActionText={() => {
            if (isEditingLocationNestedEntityChild) {
              // TODO: Implement save logic
              console.log('Save child entity in location:', sectorId, locationId, parentEntityId, childEntityId);
              setIsEditingLocationNestedEntityChild(false);
            } else {
              setIsEditingLocationNestedEntityChild(true);
            }
          }}
          {...scrollProps}
        >
          <DetailCard
            icon={typeInfo.icon}
            iconBg={typeInfo.iconBg}
            title={childEntity.name}
            description={typeInfo.label}
          />

          <MenuGroup title="Details">
            {childEntity.type === 'character' && (
              <>
                {childEntity.characterName && (
                  <MenuItem label="Name" value={childEntity.characterName} showChevron={false} stacked />
                )}
                {childEntity.firstLook && (
                  <MenuItem label="First Look" value={childEntity.firstLook} showChevron={false} stacked />
                )}
                {childEntity.initialDisposition && (
                  <MenuItem label="Initial Disposition" value={childEntity.initialDisposition} showChevron={false} stacked />
                )}
                {childEntity.role && (
                  <MenuItem label="Role" value={childEntity.role} showChevron={false} stacked />
                )}
                {childEntity.goal && (
                  <MenuItem label="Goal" value={childEntity.goal} showChevron={false} stacked />
                )}
              </>
            )}
            {childEntity.type === 'creature' && (
              <>
                {childEntity.environment && (
                  <MenuItem label="Environment" value={childEntity.environment} showChevron={false} stacked />
                )}
                {childEntity.creatureScale && (
                  <MenuItem label="Scale" value={childEntity.creatureScale} showChevron={false} stacked />
                )}
                {childEntity.basicForm && (
                  <MenuItem label="Basic Form" value={childEntity.basicForm} showChevron={false} stacked />
                )}
                {childEntity.firstLook && (
                  <MenuItem label="First Look" value={childEntity.firstLook} showChevron={false} stacked />
                )}
                {childEntity.encounteredBehavior && (
                  <MenuItem label="Encountered Behavior" value={childEntity.encounteredBehavior} showChevron={false} stacked />
                )}
                {childEntity.revealedAspect && (
                  <MenuItem label="Revealed Aspect" value={childEntity.revealedAspect} showChevron={false} stacked />
                )}
              </>
            )}
            {childEntity.type === 'starship' && (
              <>
                {childEntity.starshipName && (
                  <MenuItem label="Name" value={childEntity.starshipName} showChevron={false} stacked />
                )}
                {childEntity.starshipType && (
                  <MenuItem label="Type" value={childEntity.starshipType} showChevron={false} stacked />
                )}
                {childEntity.fleet && (
                  <MenuItem label="Fleet" value={childEntity.fleet} showChevron={false} stacked />
                )}
                {childEntity.initialContact && (
                  <MenuItem label="Initial Contact" value={childEntity.initialContact} showChevron={false} stacked />
                )}
                {childEntity.firstLook && (
                  <MenuItem label="First Look" value={childEntity.firstLook} showChevron={false} stacked />
                )}
                {childEntity.mission && (
                  <MenuItem label="Mission" value={childEntity.mission} showChevron={false} stacked />
                )}
              </>
            )}
            {childEntity.type === 'custom' && (
              <>
                {childEntity.customName && (
                  <MenuItem label="Name" value={childEntity.customName} showChevron={false} stacked />
                )}
                {childEntity.action && (
                  <MenuItem label="Action" value={childEntity.action} showChevron={false} stacked />
                )}
                {childEntity.theme && (
                  <MenuItem label="Theme" value={childEntity.theme} showChevron={false} stacked />
                )}
                {childEntity.descriptor && (
                  <MenuItem label="Descriptor" value={childEntity.descriptor} showChevron={false} stacked />
                )}
                {childEntity.focus && (
                  <MenuItem label="Focus" value={childEntity.focus} showChevron={false} stacked />
                )}
              </>
            )}
          </MenuGroup>

          <MenuGroup>
            <MenuItem 
              label="Remove Entity"
              onClick={() => {
                removeLocationNestedEntityChild(sectorId, locationId, parentEntityId, childEntityId);
                goBack();
              }}
              isButton={true}
            />
          </MenuGroup>
          {isEditingLocationNestedEntityChild && (
            <MenuGroup>
              <MenuItem 
                label={`Remove ${childEntity.name}`}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setConfirmDialogMessage(`Are you sure you want to remove "${childEntity.name}"? This action cannot be undone.`);
                  setConfirmDialogCallback(() => () => {
                    removeLocationNestedEntityChild(sectorId, locationId, parentEntityId, childEntityId);
                    goBack();
                  });
                  setShowConfirmDialog(true);
                }}
                isButton={true}
                destructive={true}
              />
            </MenuGroup>
          )}
        </NavigationView>
      );
    }
  }

  // Sublocation Nested Entity Child Detail View (entities within sublocation nested entities)
  if (viewName.startsWith('nested-child-')) {
    const parts = viewName.split('-');
    const sectorId = parseInt(parts[2]);
    const locationId = parseInt(parts[3]);
    const subLocationId = parseInt(parts[4]);
    const parentEntityId = parseInt(parts[5]);
    const childEntityId = parseInt(parts[6]);
    const subLocation = getSubLocation(sectorId, locationId, subLocationId);
    const location = getLocation(sectorId, locationId);
    const parentEntity = getNestedEntity(sectorId, locationId, subLocationId, parentEntityId);
    const childEntity = getNestedEntityChild(sectorId, locationId, subLocationId, parentEntityId, childEntityId);

    if (childEntity && parentEntity && subLocation) {
      const typeInfo = getEntityTypeInfo(childEntity.type) || { icon: '📍', label: 'Entity' };

      return (
        <NavigationView 
          title={childEntity.name} 
          onBack={() => {
            if (isEditingNestedEntityChild) {
              // Cancel edit mode
              setIsEditingNestedEntityChild(false);
            } else {
              goBack();
            }
          }}
          backButtonText={isEditingNestedEntityChild ? 'Cancel' : 'Back'}
          rightActionText={isEditingNestedEntityChild ? 'Save' : 'Edit'}
          onRightActionText={() => {
            if (isEditingNestedEntityChild) {
              // TODO: Implement save logic
              console.log('Save child entity in sub-location:', sectorId, locationId, subLocationId, parentEntityId, childEntityId);
              setIsEditingNestedEntityChild(false);
            } else {
              setIsEditingNestedEntityChild(true);
            }
          }}
          {...scrollProps}
        >
          <DetailCard
            icon={typeInfo.icon}
            iconBg={typeInfo.iconBg}
            title={childEntity.name}
            description={typeInfo.label}
          />

          <MenuGroup title="Details">
            {childEntity.type === 'character' && (
              <>
                {childEntity.characterName && (
                  <MenuItem label="Name" value={childEntity.characterName} showChevron={false} stacked />
                )}
                {childEntity.firstLook && (
                  <MenuItem label="First Look" value={childEntity.firstLook} showChevron={false} stacked />
                )}
                {childEntity.initialDisposition && (
                  <MenuItem label="Initial Disposition" value={childEntity.initialDisposition} showChevron={false} stacked />
                )}
                {childEntity.role && (
                  <MenuItem label="Role" value={childEntity.role} showChevron={false} stacked />
                )}
                {childEntity.goal && (
                  <MenuItem label="Goal" value={childEntity.goal} showChevron={false} stacked />
                )}
              </>
            )}
            {childEntity.type === 'creature' && (
              <>
                {childEntity.environment && (
                  <MenuItem label="Environment" value={childEntity.environment} showChevron={false} stacked />
                )}
                {childEntity.creatureScale && (
                  <MenuItem label="Scale" value={childEntity.creatureScale} showChevron={false} stacked />
                )}
                {childEntity.basicForm && (
                  <MenuItem label="Basic Form" value={childEntity.basicForm} showChevron={false} stacked />
                )}
                {childEntity.firstLook && (
                  <MenuItem label="First Look" value={childEntity.firstLook} showChevron={false} stacked />
                )}
                {childEntity.encounteredBehavior && (
                  <MenuItem label="Encountered Behavior" value={childEntity.encounteredBehavior} showChevron={false} stacked />
                )}
                {childEntity.revealedAspect && (
                  <MenuItem label="Revealed Aspect" value={childEntity.revealedAspect} showChevron={false} stacked />
                )}
              </>
            )}
            {childEntity.type === 'starship' && (
              <>
                {childEntity.starshipName && (
                  <MenuItem label="Name" value={childEntity.starshipName} showChevron={false} stacked />
                )}
                {childEntity.starshipType && (
                  <MenuItem label="Type" value={childEntity.starshipType} showChevron={false} stacked />
                )}
                {childEntity.fleet && (
                  <MenuItem label="Fleet" value={childEntity.fleet} showChevron={false} stacked />
                )}
                {childEntity.initialContact && (
                  <MenuItem label="Initial Contact" value={childEntity.initialContact} showChevron={false} stacked />
                )}
                {childEntity.firstLook && (
                  <MenuItem label="First Look" value={childEntity.firstLook} showChevron={false} stacked />
                )}
                {childEntity.mission && (
                  <MenuItem label="Mission" value={childEntity.mission} showChevron={false} stacked />
                )}
              </>
            )}
            {childEntity.type === 'custom' && (
              <>
                {childEntity.customName && (
                  <MenuItem label="Name" value={childEntity.customName} showChevron={false} stacked />
                )}
                {childEntity.action && (
                  <MenuItem label="Action" value={childEntity.action} showChevron={false} stacked />
                )}
                {childEntity.theme && (
                  <MenuItem label="Theme" value={childEntity.theme} showChevron={false} stacked />
                )}
                {childEntity.descriptor && (
                  <MenuItem label="Descriptor" value={childEntity.descriptor} showChevron={false} stacked />
                )}
                {childEntity.focus && (
                  <MenuItem label="Focus" value={childEntity.focus} showChevron={false} stacked />
                )}
              </>
            )}
          </MenuGroup>

          <MenuGroup>
            <MenuItem 
              label="Remove Entity"
              onClick={() => {
                removeNestedEntityChild(sectorId, locationId, subLocationId, parentEntityId, childEntityId);
                goBack();
              }}
              isButton={true}
            />
          </MenuGroup>
          {isEditingNestedEntityChild && (
            <MenuGroup>
              <MenuItem 
                label={`Remove ${childEntity.name}`}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setConfirmDialogMessage(`Are you sure you want to remove "${childEntity.name}"? This action cannot be undone.`);
                  setConfirmDialogCallback(() => () => {
                    removeNestedEntityChild(sectorId, locationId, subLocationId, parentEntityId, childEntityId);
                    goBack();
                  });
                  setShowConfirmDialog(true);
                }}
                isButton={true}
                destructive={true}
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

  return (
    <>
      <ConfirmDialog
        isOpen={showConfirmDialog}
        message={confirmDialogMessage}
        onConfirm={() => {
          setShowConfirmDialog(false);
          if (confirmDialogCallback) {
            confirmDialogCallback();
          }
        }}
        onCancel={() => {
          setShowConfirmDialog(false);
        }}
      />
    </>
  );
};
