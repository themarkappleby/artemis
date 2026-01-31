import { useState } from 'react';
import { maybeAddSettlementTag, filterValidRows } from '../utils/oracleRollers';

export const useOracle = (starforgedData) => {
  const [oracleRolls, setOracleRolls] = useState({});

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

  const rollOracle = (oracleKey, oracleTable, options = {}) => {
    // Handle custom result (for combined oracles like Action + Theme)
    if (options.customResult) {
      setOracleRolls({
        ...oracleRolls,
        [oracleKey]: options.customResult
      });
      return;
    }
    
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
