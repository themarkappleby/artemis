import React from 'react';
import { NavigationView } from '../../../components/NavigationView';
import { MenuGroup } from '../../../components/MenuGroup';
import { MenuItem } from '../../../components/MenuItem';
import { DetailCard } from '../../../components/DetailCard';
import { getOracleIconBg } from '../../../utils/icons';
import { OracleRollResult } from '../components/OracleRollResult';

export const ActionThemeView = ({
  parsed,
  navigate,
  goBack,
  starforgedData,
  oracleRolls,
  getOracleTable,
  rollOracle,
  renderResult,
  scrollProps = {}
}) => {
  const { catIndex, actionIndex, themeIndex } = parsed;
  const category = starforgedData?.oracleCategories[catIndex];
  const actionOracle = category?.Oracles?.[actionIndex];
  const themeOracle = category?.Oracles?.[themeIndex];

  if (!actionOracle || !themeOracle) return null;

  const oracleKey = 'action-theme-combined';
  const rolledResult = oracleRolls[oracleKey];

  const rollCombined = () => {
    const actionTable = getOracleTable(actionOracle);
    const themeTable = getOracleTable(themeOracle);

    if (actionTable && themeTable) {
      const actionRoll = Math.floor(Math.random() * 100) + 1;
      const themeRoll = Math.floor(Math.random() * 100) + 1;

      const actionResult = actionTable.find(row => {
        const floor = row.Floor || row.Chance || 1;
        const ceiling = row.Ceiling || row.Chance || 100;
        return actionRoll >= floor && actionRoll <= ceiling;
      });

      const themeResult = themeTable.find(row => {
        const floor = row.Floor || row.Chance || 1;
        const ceiling = row.Ceiling || row.Chance || 100;
        return themeRoll >= floor && themeRoll <= ceiling;
      });

      rollOracle(oracleKey, [], {
        customResult: {
          roll: `${actionRoll}, ${themeRoll}`,
          result: `${actionResult?.Result || '?'} ${themeResult?.Result || '?'}`
        }
      });
    }
  };

  return (
    <NavigationView 
      title="Action + Theme" 
      onBack={goBack}
      {...scrollProps}
    >
      <DetailCard
        icon="⭐"
        iconBg={getOracleIconBg('Core')}
        title="Action + Theme"
        description={actionOracle.Description || 'Roll to consult this oracle.'}
      />

      <MenuGroup>
        <OracleRollResult result={rolledResult} renderResult={renderResult} />
        <MenuItem 
          label="Roll Oracle"
          onClick={rollCombined}
          isButton={true}
        />
      </MenuGroup>
    </NavigationView>
  );
};
