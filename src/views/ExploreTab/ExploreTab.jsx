import React, { useState } from 'react';
import { NavigationView } from '../../components/NavigationView';
import { MenuGroup } from '../../components/MenuGroup';
import { MenuItem } from '../../components/MenuItem';
import { DetailCard, DetailCardItems } from '../../components/DetailCard';
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

// Helper to filter out invalid oracle table rows
const filterValidRows = (table) => {
  if (!table) return null;
  return table.filter(row => {
    const hasFloorCeiling = row.Floor !== undefined && row.Floor !== null && 
                            row.Ceiling !== undefined && row.Ceiling !== null;
    const hasChance = row.Chance !== undefined && row.Chance !== null;
    return hasFloorCeiling || hasChance;
  });
};

// Helper to roll on an oracle table
const rollOnTable = (table) => {
  const validTable = filterValidRows(table);
  if (!validTable || validTable.length === 0) return null;
  const roll = Math.floor(Math.random() * 100) + 1;
  const result = validTable.find(row => {
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

// Get oracle category by name
const getOracleCategory = (starforgedData, categoryName) => {
  if (!starforgedData?.oracleCategories) return null;
  return starforgedData.oracleCategories.find(c => c.Name === categoryName);
};

// Get oracle from category by name
const getOracleFromCategory = (category, oracleName) => {
  if (!category?.Oracles) return null;
  return category.Oracles.find(o => 
    o.Name === oracleName || 
    o.Name.toLowerCase().includes(oracleName.toLowerCase())
  );
};

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

const generateSettlementName = (starforgedData) => {
  const category = getOracleCategory(starforgedData, 'Settlements');
  if (!category) return null;
  
  const nameOracle = getOracleFromCategory(category, 'Name');
  if (!nameOracle?.Oracles) return null;
  
  // Try to find prefix/suffix or other name sub-oracles
  const subOracles = nameOracle.Oracles;
  if (subOracles.length >= 2) {
    const first = rollOnTable(subOracles[0]?.Table);
    const second = rollOnTable(subOracles[1]?.Table);
    if (first && second) {
      return `${parseOracleResult(first)} ${parseOracleResult(second)}`;
    }
  }
  
  // Fall back to simple roll
  const result = rollOnTable(nameOracle.Table);
  return parseOracleResult(result);
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
  addSubLocation,
  getSubLocation,
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
  const [newLocationConnected, setNewLocationConnected] = useState(true);
  const [newPlanetClass, setNewPlanetClass] = useState('');
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
        name = newPlanetClass.trim();
        data = {
          ...data,
          planetClass: newPlanetClass.trim(),
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
          behavior: newCreatureBehavior,
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
          behavior: newCreatureBehavior,
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
  
  const resetAllEntityFields = () => {
    // Planet fields
    setNewPlanetClass('');
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
    const atmosphere = rollPlanetOracle(starforgedData, planetClass, 'Atmosphere');
    const settlements = rollPlanetOracle(starforgedData, planetClass, 'Settlements', region);
    const observed = rollPlanetOracle(starforgedData, planetClass, 'Observed From Space');
    const feature = rollPlanetOracle(starforgedData, planetClass, 'Feature');
    const life = rollPlanetOracle(starforgedData, planetClass, 'Life');
    
    // Set all the values
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
                  return (
                    <MenuItem 
                      key={location.id}
                      icon={typeInfo.icon}
                      iconBg={typeInfo.iconBg}
                      label={location.name}
                      value={typeInfo.label}
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
                  return (
                    <MenuItem 
                      key={location.id}
                      icon={typeInfo.icon}
                      iconBg={typeInfo.iconBg}
                      label={location.name}
                      value={typeInfo.label}
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

      return (
        <NavigationView 
          title={location.name} 
          onBack={goBack}
          {...scrollProps}
        >
          <DetailCard
            icon={typeInfo.icon}
            iconBg={typeInfo.iconBg}
            title={location.name}
            description={typeInfo.label}
          >
            <DetailCardItems>
              {location.type === 'planet' && (
                <>
                  {location.atmosphere && (
                    <MenuItem label="Atmosphere" value={location.atmosphere} showChevron={false} />
                  )}
                  {location.settlements && (
                    <MenuItem label="Settlements" value={location.settlements} showChevron={false} />
                  )}
                  {location.observed && (
                    <MenuItem label="Observed from Space" value={location.observed} showChevron={false} />
                  )}
                  {location.feature && (
                    <MenuItem label="Feature" value={location.feature} showChevron={false} />
                  )}
                  {location.life && (
                    <MenuItem label="Life" value={location.life} showChevron={false} />
                  )}
                  {location.peril && (
                    <MenuItem label="Peril" value={location.peril} showChevron={false} />
                  )}
                  {location.opportunity && (
                    <MenuItem label="Opportunity" value={location.opportunity} showChevron={false} />
                  )}
                </>
              )}
              {location.type === 'stellar' && (
                <>
                  {location.stellarType && (
                    <MenuItem label="Type" value={location.stellarType} showChevron={false} />
                  )}
                </>
              )}
              {location.type === 'settlement' && (
                <>
                  {location.settlementName && (
                    <MenuItem label="Name" value={location.settlementName} showChevron={false} />
                  )}
                  {location.location && (
                    <MenuItem label="Location" value={location.location} showChevron={false} />
                  )}
                  {location.population && (
                    <MenuItem label="Population" value={location.population} showChevron={false} />
                  )}
                  {location.firstLook && (
                    <MenuItem label="First Look" value={location.firstLook} showChevron={false} />
                  )}
                  {location.initialContact && (
                    <MenuItem label="Initial Contact" value={location.initialContact} showChevron={false} />
                  )}
                  {location.authority && (
                    <MenuItem label="Authority" value={location.authority} showChevron={false} />
                  )}
                  {location.projects && (
                    <MenuItem label="Projects" value={location.projects} showChevron={false} />
                  )}
                  {location.trouble && (
                    <MenuItem label="Trouble" value={location.trouble} showChevron={false} />
                  )}
                </>
              )}
              {location.type === 'starship' && (
                <>
                  {location.starshipName && (
                    <MenuItem label="Name" value={location.starshipName} showChevron={false} />
                  )}
                  {location.starshipType && (
                    <MenuItem label="Type" value={location.starshipType} showChevron={false} />
                  )}
                  {location.fleet && (
                    <MenuItem label="Fleet" value={location.fleet} showChevron={false} />
                  )}
                  {location.initialContact && (
                    <MenuItem label="Initial Contact" value={location.initialContact} showChevron={false} />
                  )}
                  {location.firstLook && (
                    <MenuItem label="First Look" value={location.firstLook} showChevron={false} />
                  )}
                  {location.mission && (
                    <MenuItem label="Mission" value={location.mission} showChevron={false} />
                  )}
                </>
              )}
              {location.type === 'derelict' && (
                <>
                  {location.derelictLocation && (
                    <MenuItem label="Location" value={location.derelictLocation} showChevron={false} />
                  )}
                  {location.derelictType && (
                    <MenuItem label="Type" value={location.derelictType} showChevron={false} />
                  )}
                  {location.condition && (
                    <MenuItem label="Condition" value={location.condition} showChevron={false} />
                  )}
                  {location.outerFirstLook && (
                    <MenuItem label="Outer First Look" value={location.outerFirstLook} showChevron={false} />
                  )}
                  {location.innerFirstLook && (
                    <MenuItem label="Inner First Look" value={location.innerFirstLook} showChevron={false} />
                  )}
                </>
              )}
              {location.type === 'vault' && (
                <>
                  {location.vaultLocation && (
                    <MenuItem label="Location" value={location.vaultLocation} showChevron={false} />
                  )}
                  {location.scale && (
                    <MenuItem label="Scale" value={location.scale} showChevron={false} />
                  )}
                  {location.form && (
                    <MenuItem label="Form" value={location.form} showChevron={false} />
                  )}
                  {location.shape && (
                    <MenuItem label="Shape" value={location.shape} showChevron={false} />
                  )}
                  {location.material && (
                    <MenuItem label="Material" value={location.material} showChevron={false} />
                  )}
                  {location.outerFirstLook && (
                    <MenuItem label="Outer First Look" value={location.outerFirstLook} showChevron={false} />
                  )}
                </>
              )}
              {location.type === 'creature' && (
                <>
                  {location.environment && (
                    <MenuItem label="Environment" value={location.environment} showChevron={false} />
                  )}
                  {location.creatureScale && (
                    <MenuItem label="Scale" value={location.creatureScale} showChevron={false} />
                  )}
                  {location.basicForm && (
                    <MenuItem label="Basic Form" value={location.basicForm} showChevron={false} />
                  )}
                  {location.firstLook && (
                    <MenuItem label="First Look" value={location.firstLook} showChevron={false} />
                  )}
                  {location.behavior && (
                    <MenuItem label="Encountered Behavior" value={location.behavior} showChevron={false} />
                  )}
                  {location.revealedAspect && (
                    <MenuItem label="Revealed Aspect" value={location.revealedAspect} showChevron={false} />
                  )}
                </>
              )}
              {location.type === 'custom' && (
                <>
                  {location.customName && (
                    <MenuItem label="Name" value={location.customName} showChevron={false} />
                  )}
                  {location.action && (
                    <MenuItem label="Action" value={location.action} showChevron={false} />
                  )}
                  {location.theme && (
                    <MenuItem label="Theme" value={location.theme} showChevron={false} />
                  )}
                  {location.descriptor && (
                    <MenuItem label="Descriptor" value={location.descriptor} showChevron={false} />
                  )}
                  {location.focus && (
                    <MenuItem label="Focus" value={location.focus} showChevron={false} />
                  )}
                </>
              )}
              {sector && (
                <>
                  <MenuItem label="Sector" value={sector.name} showChevron={false} />
                  <MenuItem label="Region" value={getRegionLabel(sector.region)} showChevron={false} />
                </>
              )}
            </DetailCardItems>
          </DetailCard>
          
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
                      return (
                        <MenuItem 
                          key={subLocation.id}
                          icon={subTypeInfo.icon}
                          iconBg={subTypeInfo.iconBg}
                          label={subLocation.name}
                          value={subTypeInfo.label}
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
                      return (
                        <MenuItem 
                          key={subLocation.id}
                          icon={subTypeInfo.icon}
                          iconBg={subTypeInfo.iconBg}
                          label={subLocation.name}
                          value={subTypeInfo.label}
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
                    <MenuItem 
                      icon="👤"
                      iconBg="rgba(255, 204, 0, 0.3)"
                      label="Character"
                      onClick={() => {
                        setNewSubLocationType('character');
                        rollAllCharacterFields();
                      }}
                    />
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
        </NavigationView>
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
          onBack={goBack}
          {...scrollProps}
        >
          <DetailCard
            icon={typeInfo.icon}
            iconBg={typeInfo.iconBg}
            title={subLocation.name}
            description={typeInfo.label}
          >
            <DetailCardItems>
              {subLocation.type === 'settlement' && (
                <>
                  {subLocation.settlementName && (
                    <MenuItem label="Name" value={subLocation.settlementName} showChevron={false} />
                  )}
                  {subLocation.location && (
                    <MenuItem label="Location" value={subLocation.location} showChevron={false} />
                  )}
                  {subLocation.population && (
                    <MenuItem label="Population" value={subLocation.population} showChevron={false} />
                  )}
                  {subLocation.firstLook && (
                    <MenuItem label="First Look" value={subLocation.firstLook} showChevron={false} />
                  )}
                  {subLocation.initialContact && (
                    <MenuItem label="Initial Contact" value={subLocation.initialContact} showChevron={false} />
                  )}
                  {subLocation.authority && (
                    <MenuItem label="Authority" value={subLocation.authority} showChevron={false} />
                  )}
                  {subLocation.projects && (
                    <MenuItem label="Projects" value={subLocation.projects} showChevron={false} />
                  )}
                  {subLocation.trouble && (
                    <MenuItem label="Trouble" value={subLocation.trouble} showChevron={false} />
                  )}
                </>
              )}
              {subLocation.type === 'starship' && (
                <>
                  {subLocation.starshipName && (
                    <MenuItem label="Name" value={subLocation.starshipName} showChevron={false} />
                  )}
                  {subLocation.starshipType && (
                    <MenuItem label="Type" value={subLocation.starshipType} showChevron={false} />
                  )}
                  {subLocation.fleet && (
                    <MenuItem label="Fleet" value={subLocation.fleet} showChevron={false} />
                  )}
                  {subLocation.initialContact && (
                    <MenuItem label="Initial Contact" value={subLocation.initialContact} showChevron={false} />
                  )}
                  {subLocation.firstLook && (
                    <MenuItem label="First Look" value={subLocation.firstLook} showChevron={false} />
                  )}
                  {subLocation.mission && (
                    <MenuItem label="Mission" value={subLocation.mission} showChevron={false} />
                  )}
                </>
              )}
              {subLocation.type === 'derelict' && (
                <>
                  {subLocation.derelictLocation && (
                    <MenuItem label="Location" value={subLocation.derelictLocation} showChevron={false} />
                  )}
                  {subLocation.derelictType && (
                    <MenuItem label="Type" value={subLocation.derelictType} showChevron={false} />
                  )}
                  {subLocation.condition && (
                    <MenuItem label="Condition" value={subLocation.condition} showChevron={false} />
                  )}
                  {subLocation.outerFirstLook && (
                    <MenuItem label="Outer First Look" value={subLocation.outerFirstLook} showChevron={false} />
                  )}
                  {subLocation.innerFirstLook && (
                    <MenuItem label="Inner First Look" value={subLocation.innerFirstLook} showChevron={false} />
                  )}
                </>
              )}
              {subLocation.type === 'vault' && (
                <>
                  {subLocation.vaultLocation && (
                    <MenuItem label="Location" value={subLocation.vaultLocation} showChevron={false} />
                  )}
                  {subLocation.scale && (
                    <MenuItem label="Scale" value={subLocation.scale} showChevron={false} />
                  )}
                  {subLocation.form && (
                    <MenuItem label="Form" value={subLocation.form} showChevron={false} />
                  )}
                  {subLocation.shape && (
                    <MenuItem label="Shape" value={subLocation.shape} showChevron={false} />
                  )}
                  {subLocation.material && (
                    <MenuItem label="Material" value={subLocation.material} showChevron={false} />
                  )}
                  {subLocation.outerFirstLook && (
                    <MenuItem label="Outer First Look" value={subLocation.outerFirstLook} showChevron={false} />
                  )}
                </>
              )}
              {subLocation.type === 'creature' && (
                <>
                  {subLocation.environment && (
                    <MenuItem label="Environment" value={subLocation.environment} showChevron={false} />
                  )}
                  {subLocation.creatureScale && (
                    <MenuItem label="Scale" value={subLocation.creatureScale} showChevron={false} />
                  )}
                  {subLocation.basicForm && (
                    <MenuItem label="Basic Form" value={subLocation.basicForm} showChevron={false} />
                  )}
                  {subLocation.firstLook && (
                    <MenuItem label="First Look" value={subLocation.firstLook} showChevron={false} />
                  )}
                  {subLocation.behavior && (
                    <MenuItem label="Encountered Behavior" value={subLocation.behavior} showChevron={false} />
                  )}
                  {subLocation.revealedAspect && (
                    <MenuItem label="Revealed Aspect" value={subLocation.revealedAspect} showChevron={false} />
                  )}
                </>
              )}
              {subLocation.type === 'character' && (
                <>
                  {subLocation.characterName && (
                    <MenuItem label="Name" value={subLocation.characterName} showChevron={false} />
                  )}
                  {subLocation.firstLook && (
                    <MenuItem label="First Look" value={subLocation.firstLook} showChevron={false} />
                  )}
                  {subLocation.initialDisposition && (
                    <MenuItem label="Initial Disposition" value={subLocation.initialDisposition} showChevron={false} />
                  )}
                  {subLocation.role && (
                    <MenuItem label="Role" value={subLocation.role} showChevron={false} />
                  )}
                  {subLocation.goal && (
                    <MenuItem label="Goal" value={subLocation.goal} showChevron={false} />
                  )}
                </>
              )}
              {subLocation.type === 'custom' && (
                <>
                  {subLocation.customName && (
                    <MenuItem label="Name" value={subLocation.customName} showChevron={false} />
                  )}
                  {subLocation.action && (
                    <MenuItem label="Action" value={subLocation.action} showChevron={false} />
                  )}
                  {subLocation.theme && (
                    <MenuItem label="Theme" value={subLocation.theme} showChevron={false} />
                  )}
                  {subLocation.descriptor && (
                    <MenuItem label="Descriptor" value={subLocation.descriptor} showChevron={false} />
                  )}
                  {subLocation.focus && (
                    <MenuItem label="Focus" value={subLocation.focus} showChevron={false} />
                  )}
                </>
              )}
              {location && (
                <MenuItem label="Planet" value={location.name} showChevron={false} />
              )}
              {subLocation.placement && (
                <MenuItem label="Placement" value={subLocation.placement === 'orbit' ? 'In Orbit' : 'Planetside'} showChevron={false} />
              )}
              {sector && (
                <>
                  <MenuItem label="Sector" value={sector.name} showChevron={false} />
                  <MenuItem label="Region" value={getRegionLabel(sector.region)} showChevron={false} />
                </>
              )}
            </DetailCardItems>
          </DetailCard>
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
