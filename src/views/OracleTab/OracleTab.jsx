import React from 'react';
import { NavigationView } from '../../components/NavigationView';
import { MenuGroup } from '../../components/MenuGroup';
import { MenuItem } from '../../components/MenuItem';
import { DetailCard } from '../../components/DetailCard';
import { getOracleIcon, countOracles } from '../../utils/icons';
import './OracleTab.css';

export const OracleTab = ({
  viewName,
  navigate,
  goBack,
  starforgedData,
  oracleRolls,
  getOracleTable,
  rollOracle,
  scrollProps = {}
}) => {
  // Oracle Home
  if (viewName === 'oracle-home') {
    return (
      <NavigationView title="Oracle" {...scrollProps}>
        <MenuGroup title="Oracle Categories">
          {starforgedData?.oracleCategories.map((category, index) => (
            <MenuItem 
              key={category['$id'] || index}
              icon={getOracleIcon(category.Name)}
              label={category.Name}
              value={countOracles(category)}
              onClick={() => navigate(`oracle-category-${index}`)}
            />
          ))}
        </MenuGroup>
      </NavigationView>
    );
  }

  // Oracle Category Details
  if (viewName.startsWith('oracle-category-') && starforgedData) {
    const index = parseInt(viewName.split('-')[2]);
    const category = starforgedData.oracleCategories[index];

    if (category) {
      return (
        <NavigationView title={category.Name} onBack={goBack} {...scrollProps}>
          <MenuGroup>
            {category.Oracles?.map((oracle, oracleIndex) => (
              <MenuItem 
                key={oracle['$id'] || oracleIndex}
                icon={getOracleIcon(category.Name)}
                label={oracle.Name}
                onClick={() => navigate(`oracle-${index}-${oracleIndex}`)}
              />
            )) || category.Categories?.map((subCategory, subIndex) => (
              <MenuItem 
                key={subCategory['$id'] || subIndex}
                icon={getOracleIcon(subCategory.Name)}
                label={subCategory.Name}
                onClick={() => navigate(`oracle-sub-${index}-${subIndex}`)}
              />
            )) || <MenuItem icon="📄" label="No oracles available" showChevron={false} />}
          </MenuGroup>
        </NavigationView>
      );
    }
  }

  // Oracle Sub-Category Details
  if (viewName.startsWith('oracle-sub-') && !viewName.startsWith('oracle-sub-sub-') && starforgedData) {
    const parts = viewName.split('-');
    const catIndex = parseInt(parts[2]);
    const subIndex = parseInt(parts[3]);
    const subCategory = starforgedData.oracleCategories[catIndex]?.Categories?.[subIndex];

    if (subCategory) {
      return (
        <NavigationView title={subCategory.Name} onBack={goBack} {...scrollProps}>
          <MenuGroup>
            {subCategory.Oracles?.map((oracle, oracleIndex) => (
              <MenuItem 
                key={oracle['$id'] || oracleIndex}
                icon={getOracleIcon(subCategory.Name)}
                label={oracle.Name}
                onClick={() => navigate(`oracle-detail-${catIndex}-${subIndex}-${oracleIndex}`)}
              />
            )) || subCategory.Categories?.map((subSubCategory, subSubIndex) => (
              <MenuItem 
                key={subSubCategory['$id'] || subSubIndex}
                icon={getOracleIcon(subSubCategory.Name)}
                label={subSubCategory.Name}
                onClick={() => navigate(`oracle-sub-sub-${catIndex}-${subIndex}-${subSubIndex}`)}
              />
            )) || <MenuItem icon="📄" label="No oracles available" showChevron={false} />}
          </MenuGroup>
        </NavigationView>
      );
    }
  }

  // Oracle Sub-Sub-Category Details
  if (viewName.startsWith('oracle-sub-sub-') && starforgedData) {
    const parts = viewName.split('-');
    const catIndex = parseInt(parts[3]);
    const subIndex = parseInt(parts[4]);
    const subSubIndex = parseInt(parts[5]);
    const subSubCategory = starforgedData.oracleCategories[catIndex]?.Categories?.[subIndex]?.Categories?.[subSubIndex];

    if (subSubCategory) {
      return (
        <NavigationView title={subSubCategory.Name} onBack={goBack} {...scrollProps}>
          <MenuGroup>
            {subSubCategory.Oracles?.map((oracle, oracleIndex) => (
              <MenuItem 
                key={oracle['$id'] || oracleIndex}
                icon={getOracleIcon(subSubCategory.Name)}
                label={oracle.Name}
                onClick={() => navigate(`oracle-detail-deep-${catIndex}-${subIndex}-${subSubIndex}-${oracleIndex}`)}
              />
            )) || <MenuItem icon="📄" label="No oracles available" showChevron={false} />}
          </MenuGroup>
        </NavigationView>
      );
    }
  }

  // Oracle Details (direct from category)
  if (viewName.startsWith('oracle-') && viewName.split('-').length === 3 && !viewName.includes('sub') && !viewName.includes('detail') && !viewName.includes('table') && starforgedData) {
    const [, catIndex, oracleIndex] = viewName.split('-').map(Number);
    const category = starforgedData.oracleCategories[catIndex];
    const oracle = category?.Oracles?.[oracleIndex];
    const oracleKey = `oracle-${catIndex}-${oracleIndex}`;
    const rolledResult = oracleRolls[oracleKey];
    const oracleTable = getOracleTable(oracle);

    if (oracle) {
      return (
        <NavigationView title={oracle.Name} onBack={goBack} {...scrollProps}>
          <DetailCard
            icon={getOracleIcon(category.Name)}
            title={oracle.Name}
            description={oracle.Description || 'Roll to consult this oracle.'}
          />

          {oracleTable && (
            <>
              <MenuGroup>
                {rolledResult && (
                  <div style={{ padding: '16px', borderBottom: '0.5px solid #38383a' }}>
                    <div style={{ fontSize: '17px', fontWeight: '600', color: '#ffffff', marginBottom: '4px' }}>
                      {rolledResult.result}
                    </div>
                    <div style={{ fontSize: '13px', color: '#8e8e93' }}>
                      Rolled: {rolledResult.roll}
                    </div>
                  </div>
                )}
                <MenuItem 
                  label="Roll Oracle"
                  onClick={() => rollOracle(oracleKey, oracleTable)}
                  isButton={true}
                />
              </MenuGroup>

              <MenuGroup>
                <MenuItem 
                  icon="📋"
                  label="View Oracle Table"
                  onClick={() => navigate(`oracle-table-${catIndex}-${oracleIndex}`)}
                />
              </MenuGroup>
            </>
          )}
        </NavigationView>
      );
    }
  }

  // Oracle Details (from sub-category)
  if (viewName.startsWith('oracle-detail-') && !viewName.startsWith('oracle-detail-deep-') && !viewName.startsWith('oracle-detail-table-') && starforgedData) {
    const parts = viewName.split('-');
    const catIndex = parseInt(parts[2]);
    const subIndex = parseInt(parts[3]);
    const oracleIndex = parseInt(parts[4]);
    const subCategory = starforgedData.oracleCategories[catIndex]?.Categories?.[subIndex];
    const oracle = subCategory?.Oracles?.[oracleIndex];
    const oracleKey = `oracle-detail-${catIndex}-${subIndex}-${oracleIndex}`;
    const rolledResult = oracleRolls[oracleKey];
    const oracleTable = getOracleTable(oracle);

    if (oracle) {
      return (
        <NavigationView title={oracle.Name} onBack={goBack} {...scrollProps}>
          <DetailCard
            icon={getOracleIcon(subCategory.Name)}
            title={oracle.Name}
            description={oracle.Description || 'Roll to consult this oracle.'}
          />

          {oracleTable && (
            <>
              <MenuGroup>
                {rolledResult && (
                  <div style={{ padding: '16px', borderBottom: '0.5px solid #38383a' }}>
                    <div style={{ fontSize: '17px', fontWeight: '600', color: '#ffffff', marginBottom: '4px' }}>
                      {rolledResult.result}
                    </div>
                    <div style={{ fontSize: '13px', color: '#8e8e93' }}>
                      Rolled: {rolledResult.roll}
                    </div>
                  </div>
                )}
                <MenuItem 
                  label="Roll Oracle"
                  onClick={() => rollOracle(oracleKey, oracleTable)}
                  isButton={true}
                />
              </MenuGroup>

              <MenuGroup>
                <MenuItem 
                  icon="📋"
                  label="View Oracle Table"
                  onClick={() => navigate(`oracle-detail-table-${catIndex}-${subIndex}-${oracleIndex}`)}
                />
              </MenuGroup>
            </>
          )}
        </NavigationView>
      );
    }
  }

  // Oracle Details (deeply nested)
  if (viewName.startsWith('oracle-detail-deep-') && !viewName.startsWith('oracle-detail-deep-table-') && starforgedData) {
    const parts = viewName.split('-');
    const catIndex = parseInt(parts[3]);
    const subIndex = parseInt(parts[4]);
    const subSubIndex = parseInt(parts[5]);
    const oracleIndex = parseInt(parts[6]);
    const subSubCategory = starforgedData.oracleCategories[catIndex]?.Categories?.[subIndex]?.Categories?.[subSubIndex];
    const oracle = subSubCategory?.Oracles?.[oracleIndex];
    const oracleKey = `oracle-detail-deep-${catIndex}-${subIndex}-${subSubIndex}-${oracleIndex}`;
    const rolledResult = oracleRolls[oracleKey];
    const oracleTable = getOracleTable(oracle);

    if (oracle) {
      return (
        <NavigationView title={oracle.Name} onBack={goBack} {...scrollProps}>
          <DetailCard
            icon={getOracleIcon(subSubCategory.Name)}
            title={oracle.Name}
            description={oracle.Description || 'Roll to consult this oracle.'}
          />

          {oracleTable && (
            <>
              <MenuGroup>
                {rolledResult && (
                  <div style={{ padding: '16px', borderBottom: '0.5px solid #38383a' }}>
                    <div style={{ fontSize: '17px', fontWeight: '600', color: '#ffffff', marginBottom: '4px' }}>
                      {rolledResult.result}
                    </div>
                    <div style={{ fontSize: '13px', color: '#8e8e93' }}>
                      Rolled: {rolledResult.roll}
                    </div>
                  </div>
                )}
                <MenuItem 
                  label="Roll Oracle"
                  onClick={() => rollOracle(oracleKey, oracleTable)}
                  isButton={true}
                />
              </MenuGroup>

              <MenuGroup>
                <MenuItem 
                  icon="📋"
                  label="View Oracle Table"
                  onClick={() => navigate(`oracle-detail-deep-table-${catIndex}-${subIndex}-${subSubIndex}-${oracleIndex}`)}
                />
              </MenuGroup>
            </>
          )}
        </NavigationView>
      );
    }
  }

  // Oracle Table (direct from category)
  if (viewName.startsWith('oracle-table-') && viewName.split('-').length === 4 && starforgedData) {
    const parts = viewName.split('-');
    const catIndex = parseInt(parts[2]);
    const oracleIndex = parseInt(parts[3]);
    const category = starforgedData.oracleCategories[catIndex];
    const oracle = category?.Oracles?.[oracleIndex];
    const oracleTable = getOracleTable(oracle);

    if (oracleTable) {
      return (
        <NavigationView title={`${oracle.Name} - Table`} onBack={goBack} {...scrollProps}>
          <MenuGroup title="Oracle Table">
            {oracleTable.map((row, rowIndex) => (
              <MenuItem 
                key={rowIndex}
                icon="🎲"
                label={row.Result}
                value={`${row.Floor || row.Chance}-${row.Ceiling || ''}`}
                showChevron={false}
              />
            ))}
          </MenuGroup>
        </NavigationView>
      );
    }
  }

  // Oracle Table (from sub-category)
  if (viewName.startsWith('oracle-detail-table-') && !viewName.startsWith('oracle-detail-deep-table-') && starforgedData) {
    const parts = viewName.split('-');
    const catIndex = parseInt(parts[3]);
    const subIndex = parseInt(parts[4]);
    const oracleIndex = parseInt(parts[5]);
    const subCategory = starforgedData.oracleCategories[catIndex]?.Categories?.[subIndex];
    const oracle = subCategory?.Oracles?.[oracleIndex];
    const oracleTable = getOracleTable(oracle);

    if (oracleTable) {
      return (
        <NavigationView title={`${oracle.Name} - Table`} onBack={goBack} {...scrollProps}>
          <MenuGroup title="Oracle Table">
            {oracleTable.map((row, rowIndex) => (
              <MenuItem 
                key={rowIndex}
                icon="🎲"
                label={row.Result}
                value={`${row.Floor || row.Chance}-${row.Ceiling || ''}`}
                showChevron={false}
              />
            ))}
          </MenuGroup>
        </NavigationView>
      );
    }
  }

  // Oracle Table (deeply nested)
  if (viewName.startsWith('oracle-detail-deep-table-') && starforgedData) {
    const parts = viewName.split('-');
    const catIndex = parseInt(parts[4]);
    const subIndex = parseInt(parts[5]);
    const subSubIndex = parseInt(parts[6]);
    const oracleIndex = parseInt(parts[7]);
    const subSubCategory = starforgedData.oracleCategories[catIndex]?.Categories?.[subIndex]?.Categories?.[subSubIndex];
    const oracle = subSubCategory?.Oracles?.[oracleIndex];
    const oracleTable = getOracleTable(oracle);

    if (oracleTable) {
      return (
        <NavigationView title={`${oracle.Name} - Table`} onBack={goBack} {...scrollProps}>
          <MenuGroup title="Oracle Table">
            {oracleTable.map((row, rowIndex) => (
              <MenuItem 
                key={rowIndex}
                icon="🎲"
                label={row.Result}
                value={`${row.Floor || row.Chance}-${row.Ceiling || ''}`}
                showChevron={false}
              />
            ))}
          </MenuGroup>
        </NavigationView>
      );
    }
  }

  return null;
};
