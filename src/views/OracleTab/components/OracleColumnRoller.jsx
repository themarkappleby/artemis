import React from 'react';
import { MenuGroup } from '../../../components/MenuGroup';
import { MenuItem } from '../../../components/MenuItem';
import { OracleRollResult } from './OracleRollResult';
import { findOracleByPath } from '../../../utils/oracleHelpers';

// Renders a group of rollable columns for multi-column oracles
export const OracleColumnRoller = ({ 
  columns, 
  columnType, // 'result' or 'roll'
  oracleKey,
  oracle,
  oracleRolls,
  getOracleTable,
  rollOracle,
  renderResult,
  categoryName,
  starforgedData
}) => {
  const columnsData = columnType === 'result' 
    ? oracle.Display?.Table?.['Result columns']
    : oracle.Display?.Table?.['Roll columns'];

  if (!columnsData) return null;

  return (
    <>
      {columnsData.map((column, colIndex) => {
        const columnOracleId = column['Use content from'];
        let columnTable = null;
        
        // First try nested oracles within the current oracle
        let columnOracle = oracle.Oracles?.find(o => o['$id'] === columnOracleId);
        
        // If not found locally, look up in the global starforged data (external reference)
        if (!columnOracle && columnOracleId) {
          columnOracle = findOracleByPath(columnOracleId, starforgedData);
        }
        
        if (columnOracle) {
          columnTable = getOracleTable(columnOracle);
        } else if (oracle.Tables && columnOracleId) {
          // For region-based oracles, extract the region from the column ID
          const idParts = columnOracleId.split('/');
          const regionKey = idParts[idParts.length - 1];
          
          const tableKey = Object.keys(oracle.Tables).find(
            k => k.toLowerCase() === regionKey?.toLowerCase()
          );
          
          if (tableKey && oracle.Tables[tableKey]) {
            const regionTable = oracle.Tables[tableKey];
            columnTable = getOracleTable(regionTable) || 
              regionTable.Table || regionTable.Rows || null;
          }
        }
        const keySuffix = columnType === 'result' ? 'col' : 'rollcol';
        const columnKey = `${oracleKey}-${keySuffix}-${colIndex}`;
        const columnResult = oracleRolls[columnKey];
        const columnLabel = column.Label.replace(/_/g, ' ');

        return (
          <MenuGroup key={colIndex} title={columnLabel}>
            <OracleRollResult result={columnResult} renderResult={renderResult} />
            <MenuItem 
              label={`Roll ${columnLabel}`}
              onClick={() => rollOracle(columnKey, columnTable, { oracleName: columnLabel, categoryName })}
              isButton={true}
            />
          </MenuGroup>
        );
      })}
    </>
  );
};
