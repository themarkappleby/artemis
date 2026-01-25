import React from 'react';
import ReactMarkdown from 'react-markdown';
import { NavigationView } from '../../components/NavigationView';
import { MenuGroup } from '../../components/MenuGroup';
import { MenuItem } from '../../components/MenuItem';
import { DetailCard } from '../../components/DetailCard';
import { getOracleIcon, getOracleIconBg, countOracles, getGenericIconBg } from '../../utils/icons';
import './OracleTab.css';

// Helper to find move indices from a Starforged link
const findMoveFromLink = (link, starforgedData) => {
  if (!link || !link.startsWith('Starforged/Moves/') || !starforgedData) {
    return null;
  }

  const parts = link.split('/');
  if (parts.length < 4) return null;

  const categoryName = parts[2];
  const moveName = parts[3].replace(/_/g, ' ');

  const catIndex = starforgedData.moveCategories?.findIndex(
    cat => cat.Name === categoryName
  );

  if (catIndex === -1 || catIndex === undefined) return null;

  const category = starforgedData.moveCategories[catIndex];
  const moveIndex = category.Moves?.findIndex(
    move => move.Name === moveName || move.Name.replace(/\s/g, '_') === parts[3]
  );

  if (moveIndex === -1 || moveIndex === undefined) return null;

  return { catIndex, moveIndex };
};

export const OracleTab = ({
  viewName,
  navigate,
  goBack,
  starforgedData,
  oracleRolls,
  getOracleTable,
  rollOracle,
  favoritedOracles = [],
  editingOracleFavorites,
  tempOracleFavoriteOrder,
  oracleDraggedIndex,
  toggleFavoriteOracle,
  startEditingOracleFavorites,
  saveOracleFavoriteOrder,
  cancelEditingOracleFavorites,
  handleOracleDragStart,
  handleOracleDragOver,
  handleOracleDragEnd,
  isOracleFavorited,
  scrollProps = {}
}) => {
  // Helper to resolve oracle data from favoriteId
  const getOracleFromId = (oracleId) => {
    if (!starforgedData) return null;
    
    // Direct from category: oracle-{catIndex}-{oracleIndex}
    if (oracleId.startsWith('oracle-') && !oracleId.includes('detail')) {
      const parts = oracleId.split('-');
      const catIndex = parseInt(parts[1]);
      const oracleIndex = parseInt(parts[2]);
      const category = starforgedData.oracleCategories[catIndex];
      const oracle = category?.Oracles?.[oracleIndex];
      return oracle ? { oracle, category, oracleId, catIndex, oracleIndex, type: 'direct' } : null;
    }
    
    // From sub-category: oracle-detail-{catIndex}-{subIndex}-{oracleIndex}
    if (oracleId.startsWith('oracle-detail-') && !oracleId.includes('deep')) {
      const parts = oracleId.split('-');
      const catIndex = parseInt(parts[2]);
      const subIndex = parseInt(parts[3]);
      const oracleIndex = parseInt(parts[4]);
      const subCategory = starforgedData.oracleCategories[catIndex]?.Categories?.[subIndex];
      const oracle = subCategory?.Oracles?.[oracleIndex];
      return oracle ? { oracle, category: subCategory, oracleId, catIndex, subIndex, oracleIndex, type: 'sub' } : null;
    }
    
    // Deeply nested: oracle-detail-deep-{catIndex}-{subIndex}-{subSubIndex}-{oracleIndex}
    if (oracleId.startsWith('oracle-detail-deep-')) {
      const parts = oracleId.split('-');
      const catIndex = parseInt(parts[3]);
      const subIndex = parseInt(parts[4]);
      const subSubIndex = parseInt(parts[5]);
      const oracleIndex = parseInt(parts[6]);
      const subSubCategory = starforgedData.oracleCategories[catIndex]?.Categories?.[subIndex]?.Categories?.[subSubIndex];
      const oracle = subSubCategory?.Oracles?.[oracleIndex];
      return oracle ? { oracle, category: subSubCategory, oracleId, catIndex, subIndex, subSubIndex, oracleIndex, type: 'deep' } : null;
    }
    
    return null;
  };

  // Helper to get navigation view name from oracleId
  const getOracleViewName = (oracleId, type) => {
    if (type === 'direct') {
      return oracleId; // oracle-{catIndex}-{oracleIndex}
    }
    if (type === 'sub') {
      // oracle-detail-{catIndex}-{subIndex}-{oracleIndex}
      return oracleId;
    }
    if (type === 'deep') {
      // oracle-detail-deep-{catIndex}-{subIndex}-{subSubIndex}-{oracleIndex}
      return oracleId;
    }
    return oracleId;
  };

  // Helper to navigate to an oracle or move from a Starforged path
  const navigateToOracleByPath = (path) => {
    if (!starforgedData || !path) return;

    // Check if it's a move link
    if (path.startsWith('Starforged/Moves/')) {
      const moveIndices = findMoveFromLink(path, starforgedData);
      if (moveIndices) {
        navigate(`move-${moveIndices.catIndex}-${moveIndices.moveIndex}`);
        return;
      }
    }

    // Find the oracle or category in the data structure
    for (let catIndex = 0; catIndex < starforgedData.oracleCategories.length; catIndex++) {
      const category = starforgedData.oracleCategories[catIndex];
      
      // Check if this top-level category matches
      if (category['$id'] === path) {
        navigate(`oracle-category-${catIndex}`);
        return;
      }
      
      // Check direct oracles in category
      if (category.Oracles) {
        for (let oracleIndex = 0; oracleIndex < category.Oracles.length; oracleIndex++) {
          const oracle = category.Oracles[oracleIndex];
          if (oracle['$id'] === path) {
            navigate(`oracle-${catIndex}-${oracleIndex}`);
            return;
          }
        }
      }
      
      // Check sub-categories
      if (category.Categories) {
        for (let subIndex = 0; subIndex < category.Categories.length; subIndex++) {
          const subCat = category.Categories[subIndex];
          
          // Check if this sub-category matches
          if (subCat['$id'] === path) {
            navigate(`oracle-sub-${catIndex}-${subIndex}`);
            return;
          }
          
          if (subCat.Oracles) {
            for (let oracleIndex = 0; oracleIndex < subCat.Oracles.length; oracleIndex++) {
              const oracle = subCat.Oracles[oracleIndex];
              if (oracle['$id'] === path) {
                navigate(`oracle-detail-${catIndex}-${subIndex}-${oracleIndex}`);
                return;
              }
            }
          }
          
          // Check deeply nested categories
          if (subCat.Categories) {
            for (let subSubIndex = 0; subSubIndex < subCat.Categories.length; subSubIndex++) {
              const subSubCat = subCat.Categories[subSubIndex];
              
              // Check if this sub-sub-category matches
              if (subSubCat['$id'] === path) {
                navigate(`oracle-sub-sub-${catIndex}-${subIndex}-${subSubIndex}`);
                return;
              }
              
              if (subSubCat.Oracles) {
                for (let oracleIndex = 0; oracleIndex < subSubCat.Oracles.length; oracleIndex++) {
                  const oracle = subSubCat.Oracles[oracleIndex];
                  if (oracle['$id'] === path) {
                    navigate(`oracle-detail-deep-${catIndex}-${subIndex}-${subSubIndex}-${oracleIndex}`);
                    return;
                  }
                }
              }
            }
          }
        }
      }
    }
  };

  // Helper component for rendering oracle results with clickable links
  const OracleResultLink = ({ href, children }) => {
    const handleClick = (e) => {
      if (href && href.startsWith('Starforged/')) {
        e.preventDefault();
        navigateToOracleByPath(href);
      }
    };
    return <a href={href} onClick={handleClick} style={{ color: '#007AFF', textDecoration: 'none' }}>{children}</a>;
  };

  const renderOracleResult = (result) => (
    <ReactMarkdown components={{ a: OracleResultLink, p: ({ children }) => <>{children}</> }}>
      {result}
    </ReactMarkdown>
  );

  // Oracle Home
  if (viewName === 'oracle-home') {
    const oraclesToDisplay = editingOracleFavorites ? tempOracleFavoriteOrder : favoritedOracles;
    const favoriteOraclesList = oraclesToDisplay.map(oracleId => {
      const oracleData = getOracleFromId(oracleId);
      return oracleData;
    }).filter(Boolean);

    return (
      <NavigationView title="Oracle" {...scrollProps}>
        {favoriteOraclesList.length > 0 && (
          <MenuGroup title="Favorites">
            {editingOracleFavorites ? (
              <>
                {favoriteOraclesList.map((data, index) => (
                  <div
                    key={data.oracleId}
                    draggable
                    onDragStart={() => handleOracleDragStart(index)}
                    onDragOver={(e) => handleOracleDragOver(e, index)}
                    onDragEnd={handleOracleDragEnd}
                    style={{ 
                      display: 'flex', 
                      alignItems: 'center',
                      opacity: oracleDraggedIndex === index ? 0.5 : 1,
                      transition: 'opacity 0.2s'
                    }}
                  >
                    <div className="favorite-drag-handle">
                      ☰
                    </div>
                    <MenuItem 
                      icon={getOracleIcon(data.category.Name)}
                      iconBg={getOracleIconBg(data.category.Name)}
                      label={data.oracle.Name}
                      showChevron={false}
                    />
                  </div>
                ))}
                <div className="track-actions">
                  <MenuItem
                    label="Cancel"
                    onClick={cancelEditingOracleFavorites}
                    isButton={true}
                  />
                  <MenuItem
                    label="Save"
                    onClick={saveOracleFavoriteOrder}
                    isButton={true}
                  />
                </div>
              </>
            ) : (
              <>
                {favoriteOraclesList.map((data) => (
                  <MenuItem 
                    key={data.oracleId}
                    icon={getOracleIcon(data.category.Name)}
                    iconBg={getOracleIconBg(data.category.Name)}
                    label={data.oracle.Name}
                    onClick={() => navigate(getOracleViewName(data.oracleId, data.type))}
                  />
                ))}
                <MenuItem
                  label="Edit Order"
                  onClick={startEditingOracleFavorites}
                  isButton={true}
                />
              </>
            )}
          </MenuGroup>
        )}
        <MenuGroup title="Oracle Categories">
          {starforgedData?.oracleCategories.map((category, index) => (
            <MenuItem 
              key={category['$id'] || index}
              icon={getOracleIcon(category.Name)}
              iconBg={getOracleIconBg(category.Name)}
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
                  onClick={() => navigate(`oracle-${index}-${oracleIndex}`)}
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
                  onClick={() => navigate(`oracle-sub-${index}-${subIndex}`)}
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
    }
  }

  // Oracle Sub-Category Details
  if (viewName.startsWith('oracle-sub-') && !viewName.startsWith('oracle-sub-sub-') && starforgedData) {
    const parts = viewName.split('-');
    const catIndex = parseInt(parts[2]);
    const subIndex = parseInt(parts[3]);
    const parentCategory = starforgedData.oracleCategories[catIndex];
    const subCategory = parentCategory?.Categories?.[subIndex];

    if (subCategory) {
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
              {featureResult && (
                <div style={{ padding: '16px', borderBottom: '0.5px solid #38383a' }}>
                  <div style={{ fontSize: '17px', fontWeight: '600', color: '#ffffff', marginBottom: '4px' }}>
                    {renderOracleResult(featureResult.result)}
                  </div>
                  <div style={{ fontSize: '13px', color: '#8e8e93' }}>
                    Rolled: {featureResult.roll}
                  </div>
                </div>
              )}
              <MenuItem 
                label="Roll Feature"
                onClick={() => rollOracle(featureKey, getOracleTable(featureOracle))}
                isButton={true}
              />
            </MenuGroup>

            <MenuGroup title="Peril">
              {perilResult && (
                <div style={{ padding: '16px', borderBottom: '0.5px solid #38383a' }}>
                  <div style={{ fontSize: '17px', fontWeight: '600', color: '#ffffff', marginBottom: '4px' }}>
                    {renderOracleResult(perilResult.result)}
                  </div>
                  <div style={{ fontSize: '13px', color: '#8e8e93' }}>
                    Rolled: {perilResult.roll}
                  </div>
                </div>
              )}
              <MenuItem 
                label="Roll Peril"
                onClick={() => rollOracle(perilKey, getOracleTable(perilOracle))}
                isButton={true}
              />
            </MenuGroup>

            <MenuGroup title="Opportunity">
              {opportunityResult && (
                <div style={{ padding: '16px', borderBottom: '0.5px solid #38383a' }}>
                  <div style={{ fontSize: '17px', fontWeight: '600', color: '#ffffff', marginBottom: '4px' }}>
                    {renderOracleResult(opportunityResult.result)}
                  </div>
                  <div style={{ fontSize: '13px', color: '#8e8e93' }}>
                    Rolled: {opportunityResult.roll}
                  </div>
                </div>
              )}
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
                iconBg={getOracleIconBg(subSubCategory.Name)}
                label={oracle.Name}
                onClick={() => navigate(`oracle-detail-deep-${catIndex}-${subIndex}-${subSubIndex}-${oracleIndex}`)}
              />
            )) || <MenuItem icon="📄" iconBg={getGenericIconBg('📄')} label="No oracles available" showChevron={false} />}
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
    const oracleIsFavorited = isOracleFavorited(oracleKey);

    // Check if this is a multi-column oracle
    const hasMultiResultColumns = oracle?.Display?.Table?.['Result columns'];
    const isMultiResultColumnOracle = hasMultiResultColumns && hasMultiResultColumns.length > 1;
    
    // Check if this has multiple roll columns (like Basic Form with Space/Interior/Land/etc)
    const hasMultiRollColumns = oracle?.Display?.Table?.['Roll columns'];
    const isMultiRollColumnOracle = hasMultiRollColumns && hasMultiRollColumns.length > 1;

    if (oracle) {
      const handleLinkClick = (href) => {
        const moveIndices = findMoveFromLink(href, starforgedData);
        if (moveIndices) {
          navigate(`move-${moveIndices.catIndex}-${moveIndices.moveIndex}`);
        }
      };

      return (
        <NavigationView 
          title={oracle.Name} 
          onBack={goBack}
          actionIcon={oracleIsFavorited}
          onAction={() => toggleFavoriteOracle(oracleKey)}
          {...scrollProps}
        >
          <DetailCard
            icon={getOracleIcon(category.Name)}
            iconBg={getOracleIconBg(category.Name)}
            title={oracle.Name}
            description={oracle.Description || 'Roll to consult this oracle.'}
            onLinkClick={handleLinkClick}
          />

          {isMultiResultColumnOracle ? (
            // Display separate roll cards for each result column (like Name)
            <>
              {oracle.Display.Table['Result columns'].map((column, colIndex) => {
                const columnOracleId = column['Use content from'];
                const columnOracle = oracle.Oracles?.find(o => o['$id'] === columnOracleId);
                const columnTable = getOracleTable(columnOracle);
                const columnKey = `${oracleKey}-col-${colIndex}`;
                const columnResult = oracleRolls[columnKey];
                const columnLabel = column.Label.replace(/_/g, ' ');

                return (
                  <MenuGroup key={colIndex} title={columnLabel}>
                    {columnResult && (
                      <div style={{ padding: '16px', borderBottom: '0.5px solid #38383a' }}>
                        <div style={{ fontSize: '17px', fontWeight: '600', color: '#ffffff', marginBottom: '4px' }}>
                          {renderOracleResult(columnResult.result)}
                        </div>
                        <div style={{ fontSize: '13px', color: '#8e8e93' }}>
                          Rolled: {columnResult.roll}
                        </div>
                      </div>
                    )}
                    <MenuItem 
                      label={`Roll ${columnLabel}`}
                      onClick={() => rollOracle(columnKey, columnTable)}
                      isButton={true}
                    />
                  </MenuGroup>
                );
              })}
              <MenuGroup>
                <MenuItem 
                  icon="📋"
                  iconBg={getGenericIconBg('📋')}
                  label="View Oracle Table"
                  onClick={() => navigate(`oracle-table-${catIndex}-${oracleIndex}`)}
                />
              </MenuGroup>
            </>
          ) : isMultiRollColumnOracle ? (
            // Display separate roll cards for each roll column (like Basic Form)
            <>
              {oracle.Display.Table['Roll columns'].map((column, colIndex) => {
                const columnOracleId = column['Use content from'];
                const columnOracle = oracle.Oracles?.find(o => o['$id'] === columnOracleId);
                const columnTable = getOracleTable(columnOracle);
                const columnKey = `${oracleKey}-rollcol-${colIndex}`;
                const columnResult = oracleRolls[columnKey];
                const columnLabel = column.Label.replace(/_/g, ' ');

                return (
                  <MenuGroup key={colIndex} title={columnLabel}>
                    {columnResult && (
                      <div style={{ padding: '16px', borderBottom: '0.5px solid #38383a' }}>
                        <div style={{ fontSize: '17px', fontWeight: '600', color: '#ffffff', marginBottom: '4px' }}>
                          {renderOracleResult(columnResult.result)}
                        </div>
                        <div style={{ fontSize: '13px', color: '#8e8e93' }}>
                          Rolled: {columnResult.roll}
                        </div>
                      </div>
                    )}
                    <MenuItem 
                      label={`Roll ${columnLabel}`}
                      onClick={() => rollOracle(columnKey, columnTable)}
                      isButton={true}
                    />
                  </MenuGroup>
                );
              })}
              <MenuGroup>
                <MenuItem 
                  icon="📋"
                  iconBg={getGenericIconBg('📋')}
                  label="View Oracle Table"
                  onClick={() => navigate(`oracle-table-${catIndex}-${oracleIndex}`)}
                />
              </MenuGroup>
            </>
          ) : oracleTable ? (
            <>
              <MenuGroup>
                {rolledResult && (
                  <div style={{ padding: '16px', borderBottom: '0.5px solid #38383a' }}>
                    <div style={{ fontSize: '17px', fontWeight: '600', color: '#ffffff', marginBottom: '4px' }}>
                      {renderOracleResult(rolledResult.result)}
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
                  iconBg={getGenericIconBg('📋')}
                  label="View Oracle Table"
                  onClick={() => navigate(`oracle-table-${catIndex}-${oracleIndex}`)}
                />
              </MenuGroup>
            </>
          ) : oracle.Oracles && oracle.Oracles.length > 0 ? (
            // Handle oracles with nested sub-oracles (like Ask the Oracle)
            <>
              {oracle.Oracles.map((subOracle, subIndex) => {
                const subOracleTable = getOracleTable(subOracle);
                const subOracleKey = `${oracleKey}-sub-${subIndex}`;
                const subOracleResult = oracleRolls[subOracleKey];
                // Extract percentage from table for display (e.g., "Almost Certain" shows "90%")
                const yesEntry = subOracleTable?.find(row => row.Result === 'Yes');
                const percentage = yesEntry ? `${yesEntry.Ceiling}%` : '';

                return (
                  <MenuGroup key={subIndex} title={`${subOracle.Name}${percentage ? ` (${percentage})` : ''}`}>
                    {subOracleResult && (
                      <div style={{ padding: '16px', borderBottom: '0.5px solid #38383a' }}>
                        <div style={{ fontSize: '17px', fontWeight: '600', color: '#ffffff', marginBottom: '4px' }}>
                          {renderOracleResult(subOracleResult.result)}
                        </div>
                        <div style={{ fontSize: '13px', color: '#8e8e93' }}>
                          Rolled: {subOracleResult.roll}
                        </div>
                      </div>
                    )}
                    <MenuItem 
                      label={`Roll ${subOracle.Name}`}
                      onClick={() => rollOracle(subOracleKey, subOracleTable)}
                      isButton={true}
                    />
                  </MenuGroup>
                );
              })}
            </>
          ) : null}
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
    const oracleIsFavorited = isOracleFavorited(oracleKey);

    // Check if this is a multi-column oracle (like Name)
    const hasMultiResultColumns = oracle?.Display?.Table?.['Result columns'];
    const isMultiResultColumnOracle = hasMultiResultColumns && hasMultiResultColumns.length > 1;
    
    // Check if this has multiple roll columns (like Basic Form with Space/Interior/Land/etc)
    const hasMultiRollColumns = oracle?.Display?.Table?.['Roll columns'];
    const isMultiRollColumnOracle = hasMultiRollColumns && hasMultiRollColumns.length > 1;

    if (oracle) {
      const handleLinkClick = (href) => {
        const moveIndices = findMoveFromLink(href, starforgedData);
        if (moveIndices) {
          navigate(`move-${moveIndices.catIndex}-${moveIndices.moveIndex}`);
        }
      };

      return (
        <NavigationView 
          title={oracle.Name} 
          onBack={goBack}
          actionIcon={oracleIsFavorited}
          onAction={() => toggleFavoriteOracle(oracleKey)}
          {...scrollProps}
        >
          <DetailCard
            icon={getOracleIcon(subCategory.Name)}
            iconBg={getOracleIconBg(subCategory.Name)}
            title={oracle.Name}
            description={oracle.Description || 'Roll to consult this oracle.'}
            onLinkClick={handleLinkClick}
          />

          {isMultiResultColumnOracle ? (
            // Display separate roll cards for each result column (like Name)
            <>
              {oracle.Display.Table['Result columns'].map((column, colIndex) => {
                const columnOracleId = column['Use content from'];
                const columnOracle = oracle.Oracles?.find(o => o['$id'] === columnOracleId);
                const columnTable = getOracleTable(columnOracle);
                const columnKey = `${oracleKey}-col-${colIndex}`;
                const columnResult = oracleRolls[columnKey];
                const columnLabel = column.Label.replace(/_/g, ' ');

                return (
                  <MenuGroup key={colIndex} title={columnLabel}>
                    {columnResult && (
                      <div style={{ padding: '16px', borderBottom: '0.5px solid #38383a' }}>
                        <div style={{ fontSize: '17px', fontWeight: '600', color: '#ffffff', marginBottom: '4px' }}>
                          {renderOracleResult(columnResult.result)}
                        </div>
                        <div style={{ fontSize: '13px', color: '#8e8e93' }}>
                          Rolled: {columnResult.roll}
                        </div>
                      </div>
                    )}
                    <MenuItem 
                      label={`Roll ${columnLabel}`}
                      onClick={() => rollOracle(columnKey, columnTable)}
                      isButton={true}
                    />
                  </MenuGroup>
                );
              })}
              <MenuGroup>
                <MenuItem 
                  icon="📋"
                  iconBg={getGenericIconBg('📋')}
                  label="View Oracle Table"
                  onClick={() => navigate(`oracle-detail-table-${catIndex}-${subIndex}-${oracleIndex}`)}
                />
              </MenuGroup>
            </>
          ) : isMultiRollColumnOracle ? (
            // Display separate roll cards for each roll column (like Basic Form)
            <>
              {oracle.Display.Table['Roll columns'].map((column, colIndex) => {
                const columnOracleId = column['Use content from'];
                const columnOracle = oracle.Oracles?.find(o => o['$id'] === columnOracleId);
                const columnTable = getOracleTable(columnOracle);
                const columnKey = `${oracleKey}-rollcol-${colIndex}`;
                const columnResult = oracleRolls[columnKey];
                const columnLabel = column.Label.replace(/_/g, ' ');

                return (
                  <MenuGroup key={colIndex} title={columnLabel}>
                    {columnResult && (
                      <div style={{ padding: '16px', borderBottom: '0.5px solid #38383a' }}>
                        <div style={{ fontSize: '17px', fontWeight: '600', color: '#ffffff', marginBottom: '4px' }}>
                          {renderOracleResult(columnResult.result)}
                        </div>
                        <div style={{ fontSize: '13px', color: '#8e8e93' }}>
                          Rolled: {columnResult.roll}
                        </div>
                      </div>
                    )}
                    <MenuItem 
                      label={`Roll ${columnLabel}`}
                      onClick={() => rollOracle(columnKey, columnTable)}
                      isButton={true}
                    />
                  </MenuGroup>
                );
              })}
              <MenuGroup>
                <MenuItem 
                  icon="📋"
                  iconBg={getGenericIconBg('📋')}
                  label="View Oracle Table"
                  onClick={() => navigate(`oracle-detail-table-${catIndex}-${subIndex}-${oracleIndex}`)}
                />
              </MenuGroup>
            </>
          ) : oracleTable ? (
            <>
              <MenuGroup>
                {rolledResult && (
                  <div style={{ padding: '16px', borderBottom: '0.5px solid #38383a' }}>
                    <div style={{ fontSize: '17px', fontWeight: '600', color: '#ffffff', marginBottom: '4px' }}>
                      {renderOracleResult(rolledResult.result)}
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
                  iconBg={getGenericIconBg('📋')}
                  label="View Oracle Table"
                  onClick={() => navigate(`oracle-detail-table-${catIndex}-${subIndex}-${oracleIndex}`)}
                />
              </MenuGroup>
            </>
          ) : oracle.Oracles && oracle.Oracles.length > 0 ? (
            // Handle oracles with nested sub-oracles (like Ask the Oracle)
            <>
              {oracle.Oracles.map((subOracle, subIndex2) => {
                const subOracleTable = getOracleTable(subOracle);
                const subOracleKey = `${oracleKey}-sub-${subIndex2}`;
                const subOracleResult = oracleRolls[subOracleKey];
                const yesEntry = subOracleTable?.find(row => row.Result === 'Yes');
                const percentage = yesEntry ? `${yesEntry.Ceiling}%` : '';

                return (
                  <MenuGroup key={subIndex2} title={`${subOracle.Name}${percentage ? ` (${percentage})` : ''}`}>
                    {subOracleResult && (
                      <div style={{ padding: '16px', borderBottom: '0.5px solid #38383a' }}>
                        <div style={{ fontSize: '17px', fontWeight: '600', color: '#ffffff', marginBottom: '4px' }}>
                          {renderOracleResult(subOracleResult.result)}
                        </div>
                        <div style={{ fontSize: '13px', color: '#8e8e93' }}>
                          Rolled: {subOracleResult.roll}
                        </div>
                      </div>
                    )}
                    <MenuItem 
                      label={`Roll ${subOracle.Name}`}
                      onClick={() => rollOracle(subOracleKey, subOracleTable)}
                      isButton={true}
                    />
                  </MenuGroup>
                );
              })}
            </>
          ) : null}
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
    const oracleIsFavorited = isOracleFavorited(oracleKey);

    // Check if this is a multi-column oracle
    const hasMultiResultColumns = oracle?.Display?.Table?.['Result columns'];
    const isMultiResultColumnOracle = hasMultiResultColumns && hasMultiResultColumns.length > 1;
    
    // Check if this has multiple roll columns (like Basic Form with Space/Interior/Land/etc)
    const hasMultiRollColumns = oracle?.Display?.Table?.['Roll columns'];
    const isMultiRollColumnOracle = hasMultiRollColumns && hasMultiRollColumns.length > 1;

    if (oracle) {
      const handleLinkClick = (href) => {
        const moveIndices = findMoveFromLink(href, starforgedData);
        if (moveIndices) {
          navigate(`move-${moveIndices.catIndex}-${moveIndices.moveIndex}`);
        }
      };

      return (
        <NavigationView 
          title={oracle.Name} 
          onBack={goBack}
          actionIcon={oracleIsFavorited}
          onAction={() => toggleFavoriteOracle(oracleKey)}
          {...scrollProps}
        >
          <DetailCard
            icon={getOracleIcon(subSubCategory.Name)}
            iconBg={getOracleIconBg(subSubCategory.Name)}
            title={oracle.Name}
            description={oracle.Description || 'Roll to consult this oracle.'}
            onLinkClick={handleLinkClick}
          />

          {isMultiResultColumnOracle ? (
            // Display separate roll cards for each result column (like Name)
            <>
              {oracle.Display.Table['Result columns'].map((column, colIndex) => {
                const columnOracleId = column['Use content from'];
                const columnOracle = oracle.Oracles?.find(o => o['$id'] === columnOracleId);
                const columnTable = getOracleTable(columnOracle);
                const columnKey = `${oracleKey}-col-${colIndex}`;
                const columnResult = oracleRolls[columnKey];
                const columnLabel = column.Label.replace(/_/g, ' ');

                return (
                  <MenuGroup key={colIndex} title={columnLabel}>
                    {columnResult && (
                      <div style={{ padding: '16px', borderBottom: '0.5px solid #38383a' }}>
                        <div style={{ fontSize: '17px', fontWeight: '600', color: '#ffffff', marginBottom: '4px' }}>
                          {renderOracleResult(columnResult.result)}
                        </div>
                        <div style={{ fontSize: '13px', color: '#8e8e93' }}>
                          Rolled: {columnResult.roll}
                        </div>
                      </div>
                    )}
                    <MenuItem 
                      label={`Roll ${columnLabel}`}
                      onClick={() => rollOracle(columnKey, columnTable)}
                      isButton={true}
                    />
                  </MenuGroup>
                );
              })}
              <MenuGroup>
                <MenuItem 
                  icon="📋"
                  iconBg={getGenericIconBg('📋')}
                  label="View Oracle Table"
                  onClick={() => navigate(`oracle-detail-deep-table-${catIndex}-${subIndex}-${subSubIndex}-${oracleIndex}`)}
                />
              </MenuGroup>
            </>
          ) : isMultiRollColumnOracle ? (
            // Display separate roll cards for each roll column (like Basic Form)
            <>
              {oracle.Display.Table['Roll columns'].map((column, colIndex) => {
                const columnOracleId = column['Use content from'];
                const columnOracle = oracle.Oracles?.find(o => o['$id'] === columnOracleId);
                const columnTable = getOracleTable(columnOracle);
                const columnKey = `${oracleKey}-rollcol-${colIndex}`;
                const columnResult = oracleRolls[columnKey];
                const columnLabel = column.Label.replace(/_/g, ' ');

                return (
                  <MenuGroup key={colIndex} title={columnLabel}>
                    {columnResult && (
                      <div style={{ padding: '16px', borderBottom: '0.5px solid #38383a' }}>
                        <div style={{ fontSize: '17px', fontWeight: '600', color: '#ffffff', marginBottom: '4px' }}>
                          {renderOracleResult(columnResult.result)}
                        </div>
                        <div style={{ fontSize: '13px', color: '#8e8e93' }}>
                          Rolled: {columnResult.roll}
                        </div>
                      </div>
                    )}
                    <MenuItem 
                      label={`Roll ${columnLabel}`}
                      onClick={() => rollOracle(columnKey, columnTable)}
                      isButton={true}
                    />
                  </MenuGroup>
                );
              })}
              <MenuGroup>
                <MenuItem 
                  icon="📋"
                  iconBg={getGenericIconBg('📋')}
                  label="View Oracle Table"
                  onClick={() => navigate(`oracle-detail-deep-table-${catIndex}-${subIndex}-${subSubIndex}-${oracleIndex}`)}
                />
              </MenuGroup>
            </>
          ) : oracleTable ? (
            <>
              <MenuGroup>
                {rolledResult && (
                  <div style={{ padding: '16px', borderBottom: '0.5px solid #38383a' }}>
                    <div style={{ fontSize: '17px', fontWeight: '600', color: '#ffffff', marginBottom: '4px' }}>
                      {renderOracleResult(rolledResult.result)}
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
                  iconBg={getGenericIconBg('📋')}
                  label="View Oracle Table"
                  onClick={() => navigate(`oracle-detail-deep-table-${catIndex}-${subIndex}-${subSubIndex}-${oracleIndex}`)}
                />
              </MenuGroup>
            </>
          ) : oracle.Oracles && oracle.Oracles.length > 0 ? (
            // Handle oracles with nested sub-oracles (like Ask the Oracle)
            <>
              {oracle.Oracles.map((subOracle, subIdx) => {
                const subOracleTable = getOracleTable(subOracle);
                const subOracleKey = `${oracleKey}-sub-${subIdx}`;
                const subOracleResult = oracleRolls[subOracleKey];
                const yesEntry = subOracleTable?.find(row => row.Result === 'Yes');
                const percentage = yesEntry ? `${yesEntry.Ceiling}%` : '';

                return (
                  <MenuGroup key={subIdx} title={`${subOracle.Name}${percentage ? ` (${percentage})` : ''}`}>
                    {subOracleResult && (
                      <div style={{ padding: '16px', borderBottom: '0.5px solid #38383a' }}>
                        <div style={{ fontSize: '17px', fontWeight: '600', color: '#ffffff', marginBottom: '4px' }}>
                          {renderOracleResult(subOracleResult.result)}
                        </div>
                        <div style={{ fontSize: '13px', color: '#8e8e93' }}>
                          Rolled: {subOracleResult.roll}
                        </div>
                      </div>
                    )}
                    <MenuItem 
                      label={`Roll ${subOracle.Name}`}
                      onClick={() => rollOracle(subOracleKey, subOracleTable)}
                      isButton={true}
                    />
                  </MenuGroup>
                );
              })}
            </>
          ) : null}
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
  }

  return null;
};
