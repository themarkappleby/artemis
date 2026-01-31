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
  
  // For Core category, combine Action+Theme and Descriptor+Focus into single items
  const isCore = category.Name === 'Core';
  const actionIndex = category.Oracles?.findIndex(o => o.Name === 'Action') ?? -1;
  const themeIndex = category.Oracles?.findIndex(o => o.Name === 'Theme') ?? -1;
  const descriptorIndex = category.Oracles?.findIndex(o => o.Name === 'Descriptor') ?? -1;
  const focusIndex = category.Oracles?.findIndex(o => o.Name === 'Focus') ?? -1;
  
  const otherOracles = category.Oracles?.filter(o => {
    if (o.Name === 'Name') return false;
    // For Core, filter out combined oracles
    if (isCore && (o.Name === 'Action' || o.Name === 'Theme' || o.Name === 'Descriptor' || o.Name === 'Focus')) return false;
    return true;
  }) || [];

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
          {/* Combined Action + Theme for Core category */}
          {isCore && actionIndex >= 0 && themeIndex >= 0 && (
            <MenuItem 
              key="action-theme-combined"
              icon={getOracleIcon(category.Name)}
              iconBg={getOracleIconBg(category.Name)}
              label="Action + Theme"
              onClick={() => navigate(`oracle-action-theme-${catIndex}-${actionIndex}-${themeIndex}`)}
            />
          )}
          {/* Combined Descriptor + Focus for Core category */}
          {isCore && descriptorIndex >= 0 && focusIndex >= 0 && (
            <MenuItem 
              key="descriptor-focus-combined"
              icon={getOracleIcon(category.Name)}
              iconBg={getOracleIconBg(category.Name)}
              label="Descriptor + Focus"
              onClick={() => navigate(`oracle-descriptor-focus-${catIndex}-${descriptorIndex}-${focusIndex}`)}
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
