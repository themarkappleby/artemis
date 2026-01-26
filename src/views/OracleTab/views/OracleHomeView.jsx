import React from 'react';
import { NavigationView } from '../../../components/NavigationView';
import { MenuGroup } from '../../../components/MenuGroup';
import { MenuItem } from '../../../components/MenuItem';
import { getOracleIcon, getOracleIconBg, countOracles } from '../../../utils/icons';
import { getOracleFromId, getOracleViewName } from '../../../utils/oracleHelpers';

export const OracleHomeView = ({
  navigate,
  starforgedData,
  favoritedOracles = [],
  editingOracleFavorites,
  tempOracleFavoriteOrder,
  oracleDraggedIndex,
  startEditingOracleFavorites,
  saveOracleFavoriteOrder,
  cancelEditingOracleFavorites,
  handleOracleDragStart,
  handleOracleDragOver,
  handleOracleDragEnd,
  scrollProps = {}
}) => {
  const oraclesToDisplay = editingOracleFavorites ? tempOracleFavoriteOrder : favoritedOracles;
  const favoriteOraclesList = oraclesToDisplay.map(oracleId => {
    const oracleData = getOracleFromId(oracleId, starforgedData);
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
};
