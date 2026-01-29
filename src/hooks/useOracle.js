import { useState } from 'react';

// Tags that can be added to settlement names (50% chance)
const SETTLEMENT_NAME_TAGS = [
  'Base', 'Citadel', 'Depot', 'Fortress', 'Hold', 
  'Landing', 'Outpost', 'Port', 'Station', 'Terminal'
];

export const useOracle = (starforgedData) => {
  const [oracleRolls, setOracleRolls] = useState({});

  // Helper to filter out invalid oracle table rows (those without proper Floor/Ceiling values)
  const filterValidRows = (table) => {
    if (!table) return null;
    return table.filter(row => {
      // A valid row must have either Floor+Ceiling or Chance defined
      const hasFloorCeiling = row.Floor !== undefined && row.Floor !== null && 
                              row.Ceiling !== undefined && row.Ceiling !== null;
      const hasChance = row.Chance !== undefined && row.Chance !== null;
      return hasFloorCeiling || hasChance;
    });
  };

  // Helper to get oracle table data (handles different data structures)
  const getOracleTable = (oracle) => {
    if (!oracle) return null;
    if (oracle.Table && oracle.Table.length > 0) {
      return filterValidRows(oracle.Table);
    }
    if (oracle.Tables) {
      const tableKeys = Object.keys(oracle.Tables);
      if (tableKeys.length > 0) {
        return filterValidRows(oracle.Tables[tableKeys[0]]?.Table) || null;
      }
    }
    return null;
  };

  // Helper to add random tag suffix to settlement names (50% chance)
  const maybeAddSettlementTag = (name) => {
    if (Math.random() < 0.5) {
      const randomTag = SETTLEMENT_NAME_TAGS[Math.floor(Math.random() * SETTLEMENT_NAME_TAGS.length)];
      return `${name} ${randomTag}`;
    }
    return name;
  };

  const rollOracle = (oracleKey, oracleTable, options = {}) => {
    if (!oracleTable || oracleTable.length === 0) return;

    const roll = Math.floor(Math.random() * 100) + 1;

    const result = oracleTable.find(row => {
      const floor = row.Floor || row.Chance || 1;
      const ceiling = row.Ceiling || row.Chance || 100;
      return roll >= floor && roll <= ceiling;
    });

    let rawResult = result?.Result || 'No result found';
    
    // Check if this is a Settlement Name oracle roll and add tag suffix
    const { oracleName, categoryName } = options;
    const isSettlementNameOracle = 
      (categoryName === 'Settlements' && oracleName === 'Name') ||
      (oracleName === 'Settlement Name');
    
    if (isSettlementNameOracle && rawResult !== 'No result found') {
      rawResult = maybeAddSettlementTag(rawResult);
    }
    
    // Don't auto-roll on nested tables - display links for user to navigate
    setOracleRolls({
      ...oracleRolls,
      [oracleKey]: {
        roll,
        result: rawResult
      }
    });
  };

  return {
    oracleRolls,
    getOracleTable,
    rollOracle
  };
};
