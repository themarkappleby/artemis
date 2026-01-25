import { useState } from 'react';

export const useOracle = (starforgedData) => {
  const [oracleRolls, setOracleRolls] = useState({});

  // Helper to get oracle table data (handles different data structures)
  const getOracleTable = (oracle) => {
    if (!oracle) return null;
    if (oracle.Table && oracle.Table.length > 0) return oracle.Table;
    if (oracle.Tables) {
      const tableKeys = Object.keys(oracle.Tables);
      if (tableKeys.length > 0) {
        return oracle.Tables[tableKeys[0]]?.Table || null;
      }
    }
    return null;
  };

  const rollOracle = (oracleKey, oracleTable) => {
    if (!oracleTable || oracleTable.length === 0) return;

    const roll = Math.floor(Math.random() * 100) + 1;

    const result = oracleTable.find(row => {
      const floor = row.Floor || row.Chance || 1;
      const ceiling = row.Ceiling || row.Chance || 100;
      return roll >= floor && roll <= ceiling;
    });

    const rawResult = result?.Result || 'No result found';
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
