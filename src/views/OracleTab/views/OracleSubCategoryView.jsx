import React from 'react';
import { NavigationView } from '../../../components/NavigationView';
import { MenuGroup } from '../../../components/MenuGroup';
import { MenuItem } from '../../../components/MenuItem';
import { DetailCard } from '../../../components/DetailCard';
import { getOracleIcon, getOracleIconBg, getGenericIconBg } from '../../../utils/icons';
import { OracleRollResult } from '../components/OracleRollResult';

export const OracleSubCategoryView = ({
  catIndex,
  subIndex,
  navigate,
  goBack,
  starforgedData,
  oracleRolls,
  getOracleTable,
  rollOracle,
  renderResult,
  scrollProps = {}
}) => {
  const parentCategory = starforgedData?.oracleCategories[catIndex];
  const subCategory = parentCategory?.Categories?.[subIndex];

  if (!subCategory) return null;

  const hasOracles = subCategory.Oracles && subCategory.Oracles.length > 0;
  const hasCategories = subCategory.Categories && subCategory.Categories.length > 0;

  // Check if this is a Location Theme sub-category (has Feature, Peril, Opportunity oracles)
  const oracleNames = subCategory.Oracles?.map(o => o.Name) || [];
  const isLocationTheme = oracleNames.includes('Feature') && 
                          oracleNames.includes('Peril') && 
                          oracleNames.includes('Opportunity');

  if (isLocationTheme) {
    // Consolidated Location Theme view
    const featureOracle = subCategory.Oracles.find(o => o.Name === 'Feature');
    const perilOracle = subCategory.Oracles.find(o => o.Name === 'Peril');
    const opportunityOracle = subCategory.Oracles.find(o => o.Name === 'Opportunity');

    const featureKey = `oracle-sub-${catIndex}-${subIndex}-feature`;
    const perilKey = `oracle-sub-${catIndex}-${subIndex}-peril`;
    const opportunityKey = `oracle-sub-${catIndex}-${subIndex}-opportunity`;

    const featureResult = oracleRolls[featureKey];
    const perilResult = oracleRolls[perilKey];
    const opportunityResult = oracleRolls[opportunityKey];

    return (
      <NavigationView title={subCategory.Name} onBack={goBack} {...scrollProps}>
        <DetailCard
          icon={getOracleIcon(parentCategory.Name)}
          iconBg={getOracleIconBg(parentCategory.Name)}
          title={subCategory.Name}
          description={subCategory.Description || 'A location theme with unique features, perils, and opportunities.'}
        />

        <MenuGroup title="Feature">
          <OracleRollResult result={featureResult} renderResult={renderResult} />
          <MenuItem 
            label="Roll Feature"
            onClick={() => rollOracle(featureKey, getOracleTable(featureOracle))}
            isButton={true}
          />
        </MenuGroup>

        <MenuGroup title="Peril">
          <OracleRollResult result={perilResult} renderResult={renderResult} />
          <MenuItem 
            label="Roll Peril"
            onClick={() => rollOracle(perilKey, getOracleTable(perilOracle))}
            isButton={true}
          />
        </MenuGroup>

        <MenuGroup title="Opportunity">
          <OracleRollResult result={opportunityResult} renderResult={renderResult} />
          <MenuItem 
            label="Roll Opportunity"
            onClick={() => rollOracle(opportunityKey, getOracleTable(opportunityOracle))}
            isButton={true}
          />
        </MenuGroup>
      </NavigationView>
    );
  }

  // Default sub-category view (list of oracles/sub-categories)
  return (
    <NavigationView title={subCategory.Name} onBack={goBack} {...scrollProps}>
      {hasOracles && (
        <MenuGroup title={hasCategories ? "Oracles" : undefined}>
          {subCategory.Oracles.map((oracle, oracleIndex) => (
            <MenuItem 
              key={oracle['$id'] || oracleIndex}
              icon={getOracleIcon(subCategory.Name)}
              iconBg={getOracleIconBg(subCategory.Name)}
              label={oracle.Name}
              onClick={() => navigate(`oracle-detail-${catIndex}-${subIndex}-${oracleIndex}`)}
            />
          ))}
        </MenuGroup>
      )}
      {hasCategories && (
        <MenuGroup title={hasOracles ? "Categories" : undefined}>
          {subCategory.Categories.map((subSubCategory, subSubIndex) => (
            <MenuItem 
              key={subSubCategory['$id'] || subSubIndex}
              icon={getOracleIcon(subSubCategory.Name)}
              iconBg={getOracleIconBg(subSubCategory.Name)}
              label={subSubCategory.Name}
              onClick={() => navigate(`oracle-sub-sub-${catIndex}-${subIndex}-${subSubIndex}`)}
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

// Sub-Sub-Category View (deeply nested)
export const OracleSubSubCategoryView = ({
  catIndex,
  subIndex,
  subSubIndex,
  navigate,
  goBack,
  starforgedData,
  scrollProps = {}
}) => {
  const subSubCategory = starforgedData?.oracleCategories[catIndex]?.Categories?.[subIndex]?.Categories?.[subSubIndex];

  if (!subSubCategory) return null;

  return (
    <NavigationView title={subSubCategory.Name} onBack={goBack} {...scrollProps}>
      <MenuGroup>
        {subSubCategory.Oracles?.map((oracle, oracleIndex) => (
          <MenuItem 
            key={oracle['$id'] || oracleIndex}
            icon={getOracleIcon(subSubCategory.Name)}
            iconBg={getOracleIconBg(subSubCategory.Name)}
            label={oracle.Name}
            onClick={() => navigate(`oracle-detail-deep-${catIndex}-${subIndex}-${subSubIndex}-${oracleIndex}`)}
          />
        )) || <MenuItem icon="📄" iconBg={getGenericIconBg('📄')} label="No oracles available" showChevron={false} />}
      </MenuGroup>
    </NavigationView>
  );
};
