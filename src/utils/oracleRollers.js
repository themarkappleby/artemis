import { SETTLEMENT_NAME_TAGS } from '../constants';

// Helper to filter out invalid oracle table rows
export const filterValidRows = (table) => {
  if (!table) return null;
  return table.filter(row => {
    const hasFloorCeiling = row.Floor !== undefined && row.Floor !== null && 
                            row.Ceiling !== undefined && row.Ceiling !== null;
    const hasChance = row.Chance !== undefined && row.Chance !== null;
    return hasFloorCeiling || hasChance;
  });
};

// Helper to roll on an oracle table
export const rollOnTable = (table) => {
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

// Helper to get oracle category by name
export const getOracleCategory = (starforgedData, categoryName) => {
  if (!starforgedData?.oracleCategories) return null;
  return starforgedData.oracleCategories.find(c => c.Name === categoryName);
};

// Helper to get oracle from category (with flexible matching)
export const getOracleFromCategory = (category, oracleName) => {
  if (!category?.Oracles) return null;
  return category.Oracles.find(o => 
    o.Name === oracleName || 
    o.Name.toLowerCase().includes(oracleName.toLowerCase())
  );
};

// Get character oracle (handles nested Name oracle structure)
export const getCharacterOracle = (starforgedData, oracleName) => {
  const category = getOracleCategory(starforgedData, 'Characters');
  if (!category) return null;
  
  let oracle = getOracleFromCategory(category, oracleName);
  if (oracle) return oracle;
  
  // Check nested Name oracle
  const nameOracle = getOracleFromCategory(category, 'Name');
  if (nameOracle?.Oracles) {
    oracle = nameOracle.Oracles.find(o => 
      o.Name === oracleName || 
      o.Name.toLowerCase().includes(oracleName.toLowerCase())
    );
    if (oracle) return oracle;
  }
  
  return null;
};

// Roll on character oracle
export const rollCharacterOracle = (starforgedData, oracleName) => {
  const oracle = getCharacterOracle(starforgedData, oracleName);
  if (!oracle?.Table) return null;
  return rollOnTable(oracle.Table);
};

// Get Character Creation oracle (for Backstory Prompts, Inciting Incident, etc.)
export const getCharacterCreationOracle = (starforgedData, oracleName) => {
  const category = getOracleCategory(starforgedData, 'Character Creation');
  if (!category) return null;
  
  return getOracleFromCategory(category, oracleName);
};

// Roll on Character Creation oracle
export const rollCharacterCreationOracle = (starforgedData, oracleName) => {
  const oracle = getCharacterCreationOracle(starforgedData, oracleName);
  if (!oracle?.Table) return null;
  return rollOnTable(oracle.Table);
};

// Generate character name in format: Given "Callsign" Family
export const generateCharacterName = (starforgedData) => {
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

// Generate starship name from Starships oracle
export const generateStarshipName = (starforgedData) => {
  const category = getOracleCategory(starforgedData, 'Starships');
  if (!category) return null;
  
  const nameOracle = getOracleFromCategory(category, 'Name');
  if (!nameOracle?.Table) return null;
  
  return rollOnTable(nameOracle.Table);
};

// Generate asset input name based on asset type
export const generateAssetInputName = (starforgedData, assetType, inputName) => {
  // Lowercase for comparison
  const type = assetType?.toLowerCase() || '';
  const input = inputName?.toLowerCase() || '';
  
  // Vehicle assets use starship names
  if (type.includes('vehicle') || type.includes('starship')) {
    return generateStarshipName(starforgedData);
  }
  
  // Companion assets use character names or callsigns
  if (type.includes('companion') || type.includes('creature')) {
    // For companions, just use a callsign
    return rollCharacterOracle(starforgedData, 'Callsign');
  }
  
  // Default to callsign for generic "Name" inputs
  if (input === 'name') {
    return rollCharacterOracle(starforgedData, 'Callsign');
  }
  
  return null;
};

// Helper to add random tag suffix to settlement names (50% chance)
export const maybeAddSettlementTag = (name) => {
  if (Math.random() < 0.5) {
    const randomTag = SETTLEMENT_NAME_TAGS[Math.floor(Math.random() * SETTLEMENT_NAME_TAGS.length)];
    return `${name} ${randomTag}`;
  }
  return name;
};

// Generate a random sector name from Starforged oracles
export const generateSectorName = (starforgedData) => {
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

// Helper to extract plain text from oracle result (handles markdown links and symbols)
export const parseOracleResult = (result) => {
  if (!result) return null;
  // Match markdown link format: [text](url)
  const linkMatch = result.match(/\[([^\]]+)\]\([^)]+\)/);
  let text = linkMatch ? linkMatch[1] : result;
  // Remove leading symbols like ⏵
  text = text.replace(/^[⏵▶►→]\s*/, '');
  return text;
};

// Generate a random planet class from Starforged oracles
export const generatePlanetClass = (starforgedData) => {
  if (!starforgedData?.oracleCategories) return null;
  
  const planetsCategory = starforgedData.oracleCategories.find(c => c.Name === 'Planets');
  if (!planetsCategory) return null;
  
  const classOracle = planetsCategory.Oracles?.find(o => o.Name === 'Class');
  if (!classOracle?.Table) return null;
  
  const result = rollOnTable(classOracle.Table);
  return parseOracleResult(result);
};

// Get planet category data for a specific planet class
export const getPlanetCategory = (starforgedData, planetClass) => {
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

// Get sample names for a specific planet class
export const getPlanetSampleNames = (starforgedData, planetClass) => {
  const planetCategory = getPlanetCategory(starforgedData, planetClass);
  if (!planetCategory?.['Sample Names']) return [];
  return planetCategory['Sample Names'];
};

// Roll a random name from the sample names for a planet class
export const rollPlanetName = (starforgedData, planetClass) => {
  const sampleNames = getPlanetSampleNames(starforgedData, planetClass);
  if (sampleNames.length === 0) return null;
  const randomIndex = Math.floor(Math.random() * sampleNames.length);
  return sampleNames[randomIndex];
};

// Get oracle from planet category, handling nested structures
export const getPlanetOracle = (starforgedData, planetClass, oracleName) => {
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
export const getOracleTableForRegion = (oracle, region = 'Terminus') => {
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

// ==================== SECTOR POPULATION HELPERS ====================

// Get settlement count based on region
export const getSettlementCountForRegion = (region) => {
  switch (region) {
    case 'terminus': return 4;
    case 'outlands': return 3;
    case 'expanse': return 2;
    case 'void': return 0;
    default: return 0;
  }
};

// Get settlement oracle
const getSettlementOracle = (starforgedData, oracleName) => {
  const category = getOracleCategory(starforgedData, 'Settlements');
  return getOracleFromCategory(category, oracleName);
};

// Roll on settlement oracle with region support
export const rollSettlementOracle = (starforgedData, oracleName, region = 'Terminus') => {
  const oracle = getSettlementOracle(starforgedData, oracleName);
  if (!oracle) return null;
  
  const table = getOracleTableForRegion(oracle, region);
  if (!table) return null;
  
  const result = rollOnTable(table);
  return parseOracleResult(result);
};

// Generate settlement name
export const generateSettlementName = (starforgedData) => {
  const category = getOracleCategory(starforgedData, 'Settlements');
  if (!category) return null;
  
  const nameOracle = getOracleFromCategory(category, 'Name');
  if (!nameOracle) return null;
  
  let baseName = null;
  
  if (nameOracle.Table) {
    const result = rollOnTable(nameOracle.Table);
    baseName = parseOracleResult(result);
  } else if (nameOracle.Oracles) {
    const subOracle = nameOracle.Oracles[0];
    if (subOracle?.Table) {
      const result = rollOnTable(subOracle.Table);
      baseName = parseOracleResult(result);
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

// Generate complete settlement data for auto-population
export const generateSettlementData = (starforgedData, region) => {
  const capitalizedRegion = region.charAt(0).toUpperCase() + region.slice(1);
  return {
    settlementName: generateSettlementName(starforgedData),
    location: rollSettlementOracle(starforgedData, 'Location'),
    population: rollSettlementOracle(starforgedData, 'Population', capitalizedRegion),
    firstLook: rollSettlementOracle(starforgedData, 'First Look'),
    initialContact: rollSettlementOracle(starforgedData, 'Initial Contact'),
    authority: rollSettlementOracle(starforgedData, 'Authority'),
    projects: rollSettlementOracle(starforgedData, 'Projects'),
    trouble: rollSettlementOracle(starforgedData, 'Trouble')
  };
};

// Roll on a planet-specific oracle
export const rollPlanetOracle = (starforgedData, planetClass, oracleName, region = 'Terminus') => {
  const oracle = getPlanetOracle(starforgedData, planetClass, oracleName);
  const table = getOracleTableForRegion(oracle, region);
  
  if (!table) return null;
  
  const result = rollOnTable(table);
  return parseOracleResult(result);
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
  
  if (oracle.Table) {
    const result = rollOnTable(oracle.Table);
    return parseOracleResult(result);
  }
  
  return null;
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
  
  if (oracle.Table) {
    const result = rollOnTable(oracle.Table);
    return parseOracleResult(result);
  }
  
  return null;
};

// Generate complete planet data for auto-population
export const generatePlanetData = (starforgedData, region, hasSettlement = false) => {
  const capitalizedRegion = region.charAt(0).toUpperCase() + region.slice(1);
  const planetClass = generatePlanetClass(starforgedData);
  if (!planetClass) return null;
  
  const name = rollPlanetName(starforgedData, planetClass);
  const atmosphere = rollPlanetOracle(starforgedData, planetClass, 'Atmosphere');
  
  // Roll settlements detail - if planet has a settlement, re-roll until we get something other than "None"
  let settlements = rollPlanetOracle(starforgedData, planetClass, 'Settlements', capitalizedRegion);
  if (hasSettlement) {
    let rerollCount = 0;
    const maxRerolls = 10;
    while (settlements && settlements.toLowerCase().includes('none') && rerollCount < maxRerolls) {
      settlements = rollPlanetOracle(starforgedData, planetClass, 'Settlements', capitalizedRegion);
      rerollCount++;
    }
  }
  
  const observed = rollPlanetOracle(starforgedData, planetClass, 'Observed From Space');
  const feature = rollPlanetOracle(starforgedData, planetClass, 'Feature');
  const life = rollPlanetOracle(starforgedData, planetClass, 'Life');
  
  // Determine if planet has life for peril/opportunity
  const hasLife = life && !life.toLowerCase().includes('none') && !life.toLowerCase().includes('extinct');
  const peril = rollPerilOracle(starforgedData, planetClass, hasLife);
  const opportunity = rollOpportunityOracle(starforgedData, planetClass, hasLife);
  
  return {
    planetClass,
    planetName: name || planetClass,
    atmosphere,
    settlements,
    observed,
    feature,
    life,
    peril,
    opportunity
  };
};

// Generate complete character data for auto-population
export const generateCharacterData = (starforgedData) => {
  const givenName = rollCharacterOracle(starforgedData, 'Given Name');
  const familyName = rollCharacterOracle(starforgedData, 'Family Name');
  const callsign = rollCharacterOracle(starforgedData, 'Callsign');
  
  let characterName;
  if (givenName && callsign && familyName) {
    characterName = `${givenName} "${callsign}" ${familyName}`;
  } else if (givenName && familyName) {
    characterName = `${givenName} ${familyName}`;
  } else {
    characterName = givenName || familyName || callsign || 'Character';
  }
  
  return {
    characterName,
    firstLook: rollCharacterOracle(starforgedData, 'First Look'),
    initialDisposition: rollCharacterOracle(starforgedData, 'Initial Disposition'),
    role: rollCharacterOracle(starforgedData, 'Role'),
    goal: rollCharacterOracle(starforgedData, 'Goal')
  };
};

// Map population value to number of characters to generate
export const getCharacterCountForPopulation = (population) => {
  if (!population) return 0;
  const pop = population.toLowerCase();
  
  if (pop.includes('tens of thousands')) return 5;
  if (pop.includes('thousands')) return 4;
  if (pop.includes('hundreds')) return 3;
  if (pop.includes('dozens')) return 2;
  if (pop.includes('few')) return 1;
  
  return 0;
};

// Roll sector trouble from Space oracles
export const rollSectorTrouble = (starforgedData) => {
  const spaceCategory = getOracleCategory(starforgedData, 'Space');
  if (!spaceCategory?.Oracles) return null;
  
  const troubleOracle = spaceCategory.Oracles.find(o => 
    o.Name.toLowerCase().includes('trouble')
  );
  
  if (!troubleOracle?.Table) return null;
  
  const result = rollOnTable(troubleOracle.Table);
  return parseOracleResult(result);
};

// Roll stellar object from Space oracles
export const rollStellarObject = (starforgedData) => {
  const spaceCategory = getOracleCategory(starforgedData, 'Space');
  if (!spaceCategory?.Oracles) return null;
  
  const stellarOracle = spaceCategory.Oracles.find(o => 
    o.Name.toLowerCase().includes('stellar object')
  );
  
  if (!stellarOracle?.Table) return null;
  
  const result = rollOnTable(stellarOracle.Table);
  return parseOracleResult(result);
};
