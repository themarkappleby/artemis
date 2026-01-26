import React from 'react';
import { NavigationView } from '../../../components/NavigationView';
import { MenuGroup } from '../../../components/MenuGroup';
import { MenuItem } from '../../../components/MenuItem';
import { getGenericIconBg } from '../../../utils/icons';
import { resolveOracle } from '../../../utils/oracleHelpers';

export const OracleTableView = ({
  parsed,
  goBack,
  starforgedData,
  getOracleTable,
  navigateToOracleByPath,
  scrollProps = {}
}) => {
  const resolved = resolveOracle(parsed, starforgedData);
  
  if (!resolved || !resolved.oracle) return null;

  const { oracle } = resolved;
  const oracleTable = getOracleTable(oracle);

  // Check if this is a multi-column oracle
  const hasMultiResultColumns = oracle?.Display?.Table?.['Result columns'];
  const isMultiResultColumnOracle = hasMultiResultColumns && hasMultiResultColumns.length > 1;
  
  const hasMultiRollColumns = oracle?.Display?.Table?.['Roll columns'];
  const isMultiRollColumnOracle = hasMultiRollColumns && hasMultiRollColumns.length > 1;

  if (isMultiResultColumnOracle) {
    // Handle multi result-column display (like Name)
    const columns = oracle.Display.Table['Result columns'];
    const columnTables = columns.map(col => {
      const columnOracleId = col['Use content from'];
      const columnOracle = oracle.Oracles?.find(o => o['$id'] === columnOracleId);
      return {
        label: col.Label.replace(/_/g, ' '),
        table: getOracleTable(columnOracle) || []
      };
    });

    return (
      <NavigationView title={`${oracle.Name} - Table`} onBack={goBack} {...scrollProps}>
        <div style={{ padding: '12px', color: '#8e8e93', fontSize: '13px', borderBottom: '0.5px solid #38383a' }}>
          Roll once to get results from all columns, or roll separately for each column.
        </div>
        {columnTables.map((columnData, colIndex) => (
          <MenuGroup key={colIndex} title={columnData.label}>
            {columnData.table.map((row, rowIndex) => (
              <MenuItem 
                key={rowIndex}
                icon="🎲"
                iconBg={getGenericIconBg('🎲')}
                label={row.Result}
                value={`${row.Floor || row.Chance}-${row.Ceiling || ''}`}
                showChevron={false}
                onLinkClick={navigateToOracleByPath}
              />
            ))}
          </MenuGroup>
        ))}
      </NavigationView>
    );
  }

  if (isMultiRollColumnOracle) {
    // Handle multi roll-column display (like Basic Form)
    const columns = oracle.Display.Table['Roll columns'];
    const columnTables = columns.map(col => {
      const columnOracleId = col['Use content from'];
      const columnOracle = oracle.Oracles?.find(o => o['$id'] === columnOracleId);
      return {
        label: col.Label.replace(/_/g, ' '),
        table: getOracleTable(columnOracle) || []
      };
    });

    return (
      <NavigationView title={`${oracle.Name} - Table`} onBack={goBack} {...scrollProps}>
        <div style={{ padding: '12px', color: '#8e8e93', fontSize: '13px', borderBottom: '0.5px solid #38383a' }}>
          Each column represents a different environment or context for rolling.
        </div>
        {columnTables.map((columnData, colIndex) => (
          <MenuGroup key={colIndex} title={columnData.label}>
            {columnData.table.map((row, rowIndex) => (
              <MenuItem 
                key={rowIndex}
                icon="🎲"
                iconBg={getGenericIconBg('🎲')}
                label={row.Result}
                value={`${row.Floor || row.Chance}-${row.Ceiling || ''}`}
                showChevron={false}
                onLinkClick={navigateToOracleByPath}
              />
            ))}
          </MenuGroup>
        ))}
      </NavigationView>
    );
  }

  if (oracleTable) {
    return (
      <NavigationView title={`${oracle.Name} - Table`} onBack={goBack} {...scrollProps}>
        <MenuGroup title="Oracle Table">
          {oracleTable.map((row, rowIndex) => (
            <MenuItem 
              key={rowIndex}
              icon="🎲"
              iconBg={getGenericIconBg('🎲')}
              label={row.Result}
              value={`${row.Floor || row.Chance}-${row.Ceiling || ''}`}
              showChevron={false}
              onLinkClick={navigateToOracleByPath}
            />
          ))}
        </MenuGroup>
      </NavigationView>
    );
  }

  return null;
};
