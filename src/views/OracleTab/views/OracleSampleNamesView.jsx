import React from 'react';
import { NavigationView } from '../../../components/NavigationView';
import { MenuGroup } from '../../../components/MenuGroup';
import { MenuItem } from '../../../components/MenuItem';
import { DetailCard } from '../../../components/DetailCard';
import { getOracleIcon, getOracleIconBg, getGenericIconBg } from '../../../utils/icons';
import { OracleRollResult } from '../components/OracleRollResult';

export const OracleSampleNamesView = ({
  parsed,
  navigate,
  goBack,
  starforgedData,
  oracleRolls,
  rollOracle,
  renderResult,
  scrollProps = {}
}) => {
  const { depth, catIndex, subIndex, subSubIndex } = parsed;

  // Get the category with sample names based on depth
  let category;
  let parentCategory;
  let nameRollKey;
  let tableViewName;

  if (depth === 'sub') {
    parentCategory = starforgedData?.oracleCategories[catIndex];
    category = parentCategory?.Categories?.[subIndex];
    nameRollKey = `oracle-names-${catIndex}-${subIndex}`;
    tableViewName = `oracle-names-table-${catIndex}-${subIndex}`;
  } else if (depth === 'deep') {
    parentCategory = starforgedData?.oracleCategories[catIndex];
    const subCategory = parentCategory?.Categories?.[subIndex];
    category = subCategory?.Categories?.[subSubIndex];
    nameRollKey = `oracle-names-deep-${catIndex}-${subIndex}-${subSubIndex}`;
    tableViewName = `oracle-names-table-deep-${catIndex}-${subIndex}-${subSubIndex}`;
  }

  if (!category) return null;

  const sampleNames = category['Sample Names'];
  if (!sampleNames || sampleNames.length === 0) return null;

  const nameRollResult = oracleRolls?.[nameRollKey];

  // Roll a random name from sample names
  const rollSampleName = () => {
    const randomIndex = Math.floor(Math.random() * sampleNames.length);
    const randomName = sampleNames[randomIndex];
    // Use rollOracle with a fake table to store the result
    rollOracle(nameRollKey, [{ Floor: 1, Ceiling: 100, Result: randomName }]);
  };

  return (
    <NavigationView title="Name" onBack={goBack} {...scrollProps}>
      <DetailCard
        icon={getOracleIcon(parentCategory?.Name)}
        iconBg={getOracleIconBg(parentCategory?.Name)}
        title={`${category.Name} Name`}
        description={`Roll for a random ${category.Name.toLowerCase()} name from ${sampleNames.length} sample names.`}
      />

      <MenuGroup>
        <OracleRollResult result={nameRollResult} renderResult={renderResult} />
        <MenuItem 
          label="Roll Name"
          onClick={rollSampleName}
          isButton={true}
        />
      </MenuGroup>

      <MenuGroup>
        <MenuItem 
          icon="📋"
          iconBg={getGenericIconBg('📋')}
          label="View Oracle Table"
          onClick={() => navigate(tableViewName)}
        />
      </MenuGroup>
    </NavigationView>
  );
};
