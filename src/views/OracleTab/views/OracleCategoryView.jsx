import React from 'react';
import { NavigationView } from '../../../components/NavigationView';
import { MenuGroup } from '../../../components/MenuGroup';
import { MenuItem } from '../../../components/MenuItem';
import { getOracleIcon, getOracleIconBg, getGenericIconBg } from '../../../utils/icons';

export const OracleCategoryView = ({
  catIndex,
  navigate,
  goBack,
  starforgedData,
  scrollProps = {}
}) => {
  const category = starforgedData?.oracleCategories[catIndex];

  if (!category) return null;

  const hasOracles = category.Oracles && category.Oracles.length > 0;
  const hasCategories = category.Categories && category.Categories.length > 0;

  return (
    <NavigationView title={category.Name} onBack={goBack} {...scrollProps}>
      {hasOracles && (
        <MenuGroup title={hasCategories ? "Oracles" : undefined}>
          {category.Oracles.map((oracle, oracleIndex) => (
            <MenuItem 
              key={oracle['$id'] || oracleIndex}
              icon={getOracleIcon(category.Name)}
              iconBg={getOracleIconBg(category.Name)}
              label={oracle.Name}
              onClick={() => navigate(`oracle-${catIndex}-${oracleIndex}`)}
            />
          ))}
        </MenuGroup>
      )}
      {hasCategories && (
        <MenuGroup title={hasOracles ? "Categories" : undefined}>
          {category.Categories.map((subCategory, subIndex) => (
            <MenuItem 
              key={subCategory['$id'] || subIndex}
              icon={getOracleIcon(category.Name)}
              iconBg={getOracleIconBg(category.Name)}
              label={subCategory.Name}
              onClick={() => navigate(`oracle-sub-${catIndex}-${subIndex}`)}
            />
          ))}
        </MenuGroup>
      )}
      {!hasOracles && !hasCategories && (
        <MenuGroup>
          <MenuItem icon="📄" iconBg={getGenericIconBg('📄')} label="No oracles available" showChevron={false} />
        </MenuGroup>
      )}
    </NavigationView>
  );
};
