import React from 'react';
import { NavigationView } from '../../../components/NavigationView';
import { MenuGroup } from '../../../components/MenuGroup';
import { MenuItem } from '../../../components/MenuItem';
import { DetailCard } from '../../../components/DetailCard';
import { getOracleIconBg } from '../../../utils/icons';
import { OracleRollResult } from '../components/OracleRollResult';

export const DescriptorFocusView = ({
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
  const { catIndex, descriptorIndex, focusIndex } = parsed;
  const category = starforgedData?.oracleCategories[catIndex];
  const descriptorOracle = category?.Oracles?.[descriptorIndex];
  const focusOracle = category?.Oracles?.[focusIndex];

  if (!descriptorOracle || !focusOracle) return null;

  const oracleKey = 'descriptor-focus-combined';
  const rolledResult = oracleRolls[oracleKey];

  const rollCombined = () => {
    const descriptorTable = getOracleTable(descriptorOracle);
    const focusTable = getOracleTable(focusOracle);

    if (descriptorTable && focusTable) {
      const descriptorRoll = Math.floor(Math.random() * 100) + 1;
      const focusRoll = Math.floor(Math.random() * 100) + 1;

      const descriptorResult = descriptorTable.find(row => {
        const floor = row.Floor || row.Chance || 1;
        const ceiling = row.Ceiling || row.Chance || 100;
        return descriptorRoll >= floor && descriptorRoll <= ceiling;
      });

      const focusResult = focusTable.find(row => {
        const floor = row.Floor || row.Chance || 1;
        const ceiling = row.Ceiling || row.Chance || 100;
        return focusRoll >= floor && focusRoll <= ceiling;
      });

      rollOracle(oracleKey, [], {
        customResult: {
          roll: `${descriptorRoll}, ${focusRoll}`,
          result: `${descriptorResult?.Result || '?'} ${focusResult?.Result || '?'}`
        }
      });
    }
  };

  return (
    <NavigationView 
      title="Descriptor + Focus" 
      onBack={goBack}
      {...scrollProps}
    >
      <DetailCard
        icon="⭐"
        iconBg={getOracleIconBg('Core')}
        title="Descriptor + Focus"
        description={descriptorOracle.Description || 'Roll to consult this oracle.'}
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
