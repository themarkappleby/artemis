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

  // Helper to find an oracle by its path
  const findOracleByPath = (path) => {
    if (!starforgedData || !path) return null;

    for (const category of starforgedData.oracleCategories) {
      if (path.toLowerCase().includes(category.Name?.toLowerCase())) {
        if (category.Oracles) {
          for (const oracle of category.Oracles) {
            if (path.includes(oracle['$id']) || path.toLowerCase().includes(oracle.Name?.toLowerCase().replace(/\s+/g, '_'))) {
              return oracle;
            }
          }
        }
        if (category.Categories) {
          for (const subCat of category.Categories) {
            if (path.toLowerCase().includes(subCat.Name?.toLowerCase().replace(/\s+/g, '_'))) {
              if (subCat.Oracles) {
                for (const oracle of subCat.Oracles) {
                  if (path.includes(oracle['$id']) || path.toLowerCase().includes(oracle.Name?.toLowerCase().replace(/\s+/g, '_'))) {
                    return oracle;
                  }
                }
                if (subCat.Oracles.length > 0) {
                  return subCat.Oracles[0];
                }
              }
              if (subCat.Categories) {
                for (const subSubCat of subCat.Categories) {
                  if (subSubCat.Oracles) {
                    for (const oracle of subSubCat.Oracles) {
                      if (path.includes(oracle['$id']) || path.toLowerCase().includes(oracle.Name?.toLowerCase().replace(/\s+/g, '_'))) {
                        return oracle;
                      }
                    }
                  }
                }
              }
            }
          }
        }
        if (category.Oracles && category.Oracles.length > 0) {
          return category.Oracles[0];
        }
      }
    }
    return null;
  };

  // Helper to check if a result contains an oracle reference
  const parseOracleReference = (resultText) => {
    if (!resultText) return null;
    const refMatch = resultText.match(/\[(?:▶|>)?\s*([^\]]+)\]\(([^)]+)\)/);
    if (refMatch) {
      return {
        displayName: refMatch[1].trim(),
        path: refMatch[2].trim()
      };
    }
    return null;
  };

  // Roll on a single table and return the result
  const rollOnTable = (table) => {
    if (!table || table.length === 0) return null;
    const roll = Math.floor(Math.random() * 100) + 1;
    const result = table.find(row => {
      const floor = row.Floor || row.Chance || 1;
      const ceiling = row.Ceiling || row.Chance || 100;
      return roll >= floor && roll <= ceiling;
    });
    return { roll, result: result?.Result || 'No result found' };
  };

  // Recursively resolve oracle references
  const resolveOracleResult = (resultText, maxDepth = 5) => {
    if (maxDepth <= 0) return resultText;

    const ref = parseOracleReference(resultText);
    if (!ref) return resultText;

    const referencedOracle = findOracleByPath(ref.path);
    if (!referencedOracle) return resultText;

    const table = getOracleTable(referencedOracle);
    if (!table) return resultText;

    const rollResult = rollOnTable(table);
    if (!rollResult) return resultText;

    const resolvedResult = resolveOracleResult(rollResult.result, maxDepth - 1);
    return resolvedResult;
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
    const finalResult = resolveOracleResult(rawResult);

    setOracleRolls({
      ...oracleRolls,
      [oracleKey]: {
        roll,
        result: finalResult
      }
    });
  };

  return {
    oracleRolls,
    getOracleTable,
    findOracleByPath,
    parseOracleReference,
    rollOnTable,
    resolveOracleResult,
    rollOracle
  };
};
