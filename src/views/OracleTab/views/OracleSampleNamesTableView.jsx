import React from 'react';
import { NavigationView } from '../../../components/NavigationView';
import { MenuGroup } from '../../../components/MenuGroup';
import { MenuItem } from '../../../components/MenuItem';
import { getGenericIconBg } from '../../../utils/icons';

export const OracleSampleNamesTableView = ({
  parsed,
  goBack,
  starforgedData,
  scrollProps = {}
}) => {
  const { depth, catIndex, subIndex, subSubIndex } = parsed;

  // Get the category with sample names based on depth
  let category;
  let parentCategory;

  if (depth === 'sub') {
    parentCategory = starforgedData?.oracleCategories[catIndex];
    category = parentCategory?.Categories?.[subIndex];
  } else if (depth === 'deep') {
    parentCategory = starforgedData?.oracleCategories[catIndex];
    const subCategory = parentCategory?.Categories?.[subIndex];
    category = subCategory?.Categories?.[subSubIndex];
  }

  if (!category) return null;

  const sampleNames = category['Sample Names'];
  if (!sampleNames || sampleNames.length === 0) return null;

  return (
    <NavigationView title="Sample Names" onBack={goBack} {...scrollProps}>
      <MenuGroup title={`${category.Name} Names`}>
        {sampleNames.map((name, index) => (
          <MenuItem 
            key={index}
            icon="📝"
            iconBg={getGenericIconBg('📝')}
            label={name}
            showChevron={false}
          />
        ))}
      </MenuGroup>
    </NavigationView>
  );
};
