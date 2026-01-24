import React from 'react';
import { NavigationView } from '../../components/NavigationView';
import { MenuGroup } from '../../components/MenuGroup';
import { MenuItem } from '../../components/MenuItem';
import { DetailCard } from '../../components/DetailCard';
import { getMoveIcon, getMoveIconBg, getGenericIconBg } from '../../utils/icons';
import './MovesTab.css';

export const MovesTab = ({
  viewName,
  navigate,
  goBack,
  starforgedData,
  favoritedMoves,
  editingFavorites,
  tempFavoriteOrder,
  draggedIndex,
  toggleFavoriteMove,
  startEditingFavorites,
  saveFavoriteOrder,
  cancelEditingFavorites,
  handleDragStart,
  handleDragOver,
  handleDragEnd,
  isFavorited,
  scrollProps = {}
}) => {
  // Moves Home
  if (viewName === 'moves-home') {
    const movesToDisplay = editingFavorites ? tempFavoriteOrder : favoritedMoves;
    const favoriteMovesList = movesToDisplay.map(moveId => {
      const [catIndex, moveIndex] = moveId.split('-').map(Number);
      const category = starforgedData?.moveCategories[catIndex];
      const move = category?.Moves?.[moveIndex];
      return move ? { move, category, catIndex, moveIndex, moveId } : null;
    }).filter(Boolean);

    return (
      <NavigationView title="Moves" {...scrollProps}>
        {favoriteMovesList.length > 0 && (
          <MenuGroup title="Favorites">
            {editingFavorites ? (
              <>
                {favoriteMovesList.map(({ move, category, catIndex, moveIndex, moveId }, index) => (
                  <div
                    key={moveId}
                    draggable
                    onDragStart={() => handleDragStart(index)}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDragEnd={handleDragEnd}
                    style={{ 
                      display: 'flex', 
                      alignItems: 'center',
                      opacity: draggedIndex === index ? 0.5 : 1,
                      transition: 'opacity 0.2s'
                    }}
                  >
                    <div className="favorite-drag-handle">
                      ☰
                    </div>
                    <MenuItem 
                      icon={getMoveIcon(category.Name)}
                      iconBg={getMoveIconBg(category.Name)}
                      label={move.Name}
                      subtitle={move.Trigger?.Text || ''}
                      showChevron={false}
                    />
                  </div>
                ))}
                <div className="track-actions">
                  <MenuItem
                    label="Cancel"
                    onClick={cancelEditingFavorites}
                    isButton={true}
                  />
                  <MenuItem
                    label="Save"
                    onClick={saveFavoriteOrder}
                    isButton={true}
                  />
                </div>
              </>
            ) : (
              <>
                {favoriteMovesList.map(({ move, category, catIndex, moveIndex }) => (
                  <MenuItem 
                    key={`${catIndex}-${moveIndex}`}
                    icon={getMoveIcon(category.Name)}
                    iconBg={getMoveIconBg(category.Name)}
                    label={move.Name}
                    subtitle={move.Trigger?.Text || ''}
                    onClick={() => navigate(`move-${catIndex}-${moveIndex}`)}
                  />
                ))}
                <MenuItem
                  label="Edit Order"
                  onClick={startEditingFavorites}
                  isButton={true}
                />
              </>
            )}
          </MenuGroup>
        )}
        <MenuGroup title="Move Categories">
          {starforgedData?.moveCategories.map((category, index) => (
            <MenuItem 
              key={category['$id'] || index}
              icon={getMoveIcon(category.Name)}
              iconBg={getMoveIconBg(category.Name)}
              label={category.Name}
              value={category.Moves?.length || 0}
              onClick={() => navigate(`move-category-${index}`)}
            />
          ))}
        </MenuGroup>
      </NavigationView>
    );
  }

  // Move Category Details
  if (viewName.startsWith('move-category-') && starforgedData) {
    const index = parseInt(viewName.split('-')[2]);
    const category = starforgedData.moveCategories[index];

    if (category) {
      return (
        <NavigationView title={category.Name} onBack={goBack} {...scrollProps}>
          {category.Description && (
            <DetailCard
              icon={getMoveIcon(category.Name)}
              iconBg={getMoveIconBg(category.Name)}
              title={category.Name}
              description={category.Description}
            />
          )}
          <MenuGroup>
            {category.Moves?.map((move, moveIndex) => (
              <MenuItem 
                key={move['$id'] || moveIndex}
                icon={getMoveIcon(category.Name)}
                iconBg={getMoveIconBg(category.Name)}
                label={move.Name}
                subtitle={move.Trigger?.Text || ''}
                onClick={() => navigate(`move-${index}-${moveIndex}`)}
              />
            )) || <MenuItem icon="📄" iconBg={getGenericIconBg('📄')} label="No moves available" showChevron={false} />}
          </MenuGroup>
        </NavigationView>
      );
    }
  }

  // Individual Move Details
  if (viewName.startsWith('move-') && viewName.split('-').length === 3 && starforgedData) {
    const [, catIndex, moveIndex] = viewName.split('-').map(Number);
    const move = starforgedData.moveCategories[catIndex]?.Moves?.[moveIndex];

    if (move) {
      const category = starforgedData.moveCategories[catIndex];
      const moveText = move.Text || 'No move text available.';
      const moveIsFavorited = isFavorited(catIndex, moveIndex);

      return (
        <NavigationView 
          title={move.Name} 
          onBack={goBack}
          actionIcon={moveIsFavorited}
          onAction={() => toggleFavoriteMove(catIndex, moveIndex)}
          {...scrollProps}
        >
          <DetailCard
            icon={getMoveIcon(category.Name)}
            iconBg={getMoveIconBg(category.Name)}
            title={move.Name}
            description={moveText}
          />

          {move['Progress Move'] && (
            <MenuGroup>
              <MenuItem 
                icon="📊" 
                iconBg={getGenericIconBg('📊')}
                label="Progress Move" 
                showChevron={false}
              />
            </MenuGroup>
          )}

          {move.Outcomes && (
            <MenuGroup title="Outcomes">
              {move.Outcomes['Strong Hit'] && (
                <MenuItem 
                  icon="💪" 
                  iconBg={getGenericIconBg('💪')}
                  label="Strong Hit" 
                  onClick={() => navigate(`move-outcome-${catIndex}-${moveIndex}-strong`)}
                />
              )}
              {move.Outcomes['Weak Hit'] && (
                <MenuItem 
                  icon="👍" 
                  iconBg={getGenericIconBg('👍')}
                  label="Weak Hit" 
                  onClick={() => navigate(`move-outcome-${catIndex}-${moveIndex}-weak`)}
                />
              )}
              {move.Outcomes.Miss && (
                <MenuItem 
                  icon="❌" 
                  iconBg={getGenericIconBg('❌')}
                  label="Miss" 
                  onClick={() => navigate(`move-outcome-${catIndex}-${moveIndex}-miss`)}
                />
              )}
            </MenuGroup>
          )}
        </NavigationView>
      );
    }
  }

  // Move Outcome Details
  if (viewName.startsWith('move-outcome-') && starforgedData) {
    const parts = viewName.split('-');
    const catIndex = parseInt(parts[2]);
    const moveIndex = parseInt(parts[3]);
    const outcomeType = parts[4];
    const move = starforgedData.moveCategories[catIndex]?.Moves?.[moveIndex];

    if (move?.Outcomes) {
      const category = starforgedData.moveCategories[catIndex];
      let outcomeText = '';
      let outcomeTitle = '';

      if (outcomeType === 'strong' && move.Outcomes['Strong Hit']) {
        outcomeText = move.Outcomes['Strong Hit'].Text || '';
        outcomeTitle = 'Strong Hit';
      } else if (outcomeType === 'weak' && move.Outcomes['Weak Hit']) {
        outcomeText = move.Outcomes['Weak Hit'].Text || '';
        outcomeTitle = 'Weak Hit';
      } else if (outcomeType === 'miss' && move.Outcomes.Miss) {
        outcomeText = move.Outcomes.Miss.Text || '';
        outcomeTitle = 'Miss';
      }

      return (
        <NavigationView title={`${move.Name} - ${outcomeTitle}`} onBack={goBack} {...scrollProps}>
          <DetailCard
            icon={getMoveIcon(category.Name)}
            iconBg={getMoveIconBg(category.Name)}
            title={outcomeTitle}
            description={outcomeText}
          />
        </NavigationView>
      );
    }
  }

  return null;
};
