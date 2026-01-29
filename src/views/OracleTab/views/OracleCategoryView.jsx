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

  // Check if there's a "Name" oracle to render first
  const nameOracleIndex = category.Oracles?.findIndex(o => o.Name === 'Name') ?? -1;
  const nameOracle = nameOracleIndex >= 0 ? category.Oracles[nameOracleIndex] : null;
  const otherOracles = category.Oracles?.filter(o => o.Name !== 'Name') || [];

  return (
    <NavigationView title={category.Name} onBack={goBack} {...scrollProps}>
      {hasOracles && (
        <MenuGroup title={hasCategories ? "Oracles" : undefined}>
          {nameOracle && (
            <MenuItem 
              key={nameOracle['$id'] || 'name-oracle'}
              icon={getOracleIcon(category.Name)}
              iconBg={getOracleIconBg(category.Name)}
              label={nameOracle.Name}
              onClick={() => navigate(`oracle-${catIndex}-${nameOracleIndex}`)}
            />
          )}
          {otherOracles.map((oracle) => {
            const originalIndex = category.Oracles.findIndex(o => o['$id'] === oracle['$id']);
            return (
              <MenuItem 
                key={oracle['$id'] || originalIndex}
                icon={getOracleIcon(category.Name)}
                iconBg={getOracleIconBg(category.Name)}
                label={oracle.Name}
                onClick={() => navigate(`oracle-${catIndex}-${originalIndex}`)}
              />
            );
          })}
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
