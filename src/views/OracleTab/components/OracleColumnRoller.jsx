import React from 'react';
import { MenuGroup } from '../../../components/MenuGroup';
import { MenuItem } from '../../../components/MenuItem';
import { OracleRollResult } from './OracleRollResult';

// Renders a group of rollable columns for multi-column oracles
export const OracleColumnRoller = ({ 
  columns, 
  columnType, // 'result' or 'roll'
  oracleKey,
  oracle,
  oracleRolls,
  getOracleTable,
  rollOracle,
  renderResult
}) => {
  const columnsData = columnType === 'result' 
    ? oracle.Display?.Table?.['Result columns']
    : oracle.Display?.Table?.['Roll columns'];

  if (!columnsData) return null;

  return (
    <>
      {columnsData.map((column, colIndex) => {
        const columnOracleId = column['Use content from'];
        const columnOracle = oracle.Oracles?.find(o => o['$id'] === columnOracleId);
        const columnTable = getOracleTable(columnOracle);
        const keySuffix = columnType === 'result' ? 'col' : 'rollcol';
        const columnKey = `${oracleKey}-${keySuffix}-${colIndex}`;
        const columnResult = oracleRolls[columnKey];
        const columnLabel = column.Label.replace(/_/g, ' ');

        return (
          <MenuGroup key={colIndex} title={columnLabel}>
            <OracleRollResult result={columnResult} renderResult={renderResult} />
            <MenuItem 
              label={`Roll ${columnLabel}`}
              onClick={() => rollOracle(columnKey, columnTable)}
              isButton={true}
            />
          </MenuGroup>
        );
      })}
    </>
  );
};
