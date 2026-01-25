import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { NavigationView } from '../../components/NavigationView';
import { MenuGroup } from '../../components/MenuGroup';
import { MenuItem } from '../../components/MenuItem';
import { DetailCard } from '../../components/DetailCard';
import { getMoveIcon, getMoveIconBg, getGenericIconBg, getStatIcon, getStatIconBg } from '../../utils/icons';
import './MovesTab.css';
import '../RollTab/RollTab.css';

// Helper to get the appropriate move text based on whether it has rollable options
const getMoveDisplayText = (move) => {
  const hasRollableOptions = move.Trigger?.Options?.length > 0;
  if (hasRollableOptions) {
    return move.Trigger?.Text || '';
  }
  return move.Text || '';
};

export const MovesTab = ({
  viewName,
  navigate,
  goBack,
  starforgedData,
  character,
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
  rollStat,
  setRollStat,
  rollAdds,
  setRollAdds,
  lastRoll,
  makeActionRoll,
  burnMomentum,
  wouldImprove,
  getBurnOutcome,
  scrollProps = {}
}) => {
  // No auto-rolling needed - rolls are generated in onClick handlers before navigation

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
      const moveIsFavorited = isFavorited(catIndex, moveIndex);
      const triggerText = getMoveDisplayText(move);
      const triggerOptions = move.Trigger?.Options || [];
      const hasRollableOptions = triggerOptions.length > 0 && triggerOptions[0].Using;

      return (
        <NavigationView 
          title={move.Name} 
          onBack={goBack}
          actionIcon={moveIsFavorited}
          onAction={() => toggleFavoriteMove(catIndex, moveIndex)}
          {...scrollProps}
        >
          {/* Trigger Section */}
          <DetailCard
            icon={getMoveIcon(category.Name)}
            iconBg={getMoveIconBg(category.Name)}
            title={move.Name}
            description={triggerText}
          />

          {move['Progress Move'] && (
            <MenuGroup>
              <MenuItem 
                icon="📊" 
                iconBg={getGenericIconBg('📊')}
                label="Progress Move" 
                subtitle="Roll your progress score against the challenge dice"
                showChevron={false}
              />
            </MenuGroup>
          )}

          {/* Rollable Trigger Options */}
          {hasRollableOptions && (
            <MenuGroup title="Roll Options">
              {triggerOptions.map((option, optIndex) => {
                const stat = option.Using?.[0];
                if (!stat) return null;
                const statLower = stat.toLowerCase();
                const statValue = character?.stats?.[statLower] || 0;
                const statCapitalized = stat.charAt(0).toUpperCase() + stat.slice(1).toLowerCase();
                return (
                  <MenuItem 
                    key={optIndex}
                    icon={getStatIcon(statLower)}
                    iconBg={getStatIconBg(statLower)}
                    label={option.Text}
                    value={`+${statValue} (${statCapitalized})`}
                    onClick={() => {
                      // Set stat and generate roll before navigation
                      setRollStat(statLower);
                      const outcomeText = move?.Outcomes?.Miss?.Text || '';
                      // Use setTimeout to ensure state updates before navigation
                      setTimeout(() => {
                        makeActionRoll(outcomeText);
                        navigate(`move-roll-${catIndex}-${moveIndex}-${statLower}-${Date.now()}`);
                      }, 0);
                    }}
                  />
                );
              })}
            </MenuGroup>
          )}

          {/* Outcomes Reference Section */}
          {move.Outcomes && (
            <MenuGroup title="Outcomes Reference">
              {move.Outcomes['Strong Hit'] && (
                <MenuItem 
                  label="Strong Hit" 
                  subtitle={move.Outcomes['Strong Hit'].Text}
                  onClick={() => navigate(`move-outcome-${catIndex}-${moveIndex}-strong`)}
                />
              )}
              {move.Outcomes['Weak Hit'] && (
                <MenuItem 
                  label="Weak Hit" 
                  subtitle={move.Outcomes['Weak Hit'].Text}
                  onClick={() => navigate(`move-outcome-${catIndex}-${moveIndex}-weak`)}
                />
              )}
              {move.Outcomes.Miss && (
                <MenuItem 
                  label="Miss" 
                  subtitle={move.Outcomes.Miss.Text}
                  onClick={() => navigate(`move-outcome-${catIndex}-${moveIndex}-miss`)}
                />
              )}
            </MenuGroup>
          )}
        </NavigationView>
      );
    }
  }

  // Move Roll Results View
  if (viewName.startsWith('move-roll-') && starforgedData) {
    const parts = viewName.split('-');
    const catIndex = parseInt(parts[2]);
    const moveIndex = parseInt(parts[3]);
    const stat = parts[4];
    const move = starforgedData.moveCategories[catIndex]?.Moves?.[moveIndex];

    if (move) {
      const category = starforgedData.moveCategories[catIndex];
      const burnOutcome = getBurnOutcome?.();

      return (
        <NavigationView 
          title={move.Name} 
          onBack={goBack}
          {...scrollProps}
        >
          {/* Roll Results */}
          {lastRoll && (
            <>
              <div className="roll-results">
                <div className="roll-dice-display">
                  <div className={`roll-outcome-banner roll-outcome-${lastRoll.outcome}`}>
                    <span className="roll-outcome-text">
                      {lastRoll.outcome === 'strong' && 'Strong Hit'}
                      {lastRoll.outcome === 'weak' && 'Weak Hit'}
                      {lastRoll.outcome === 'miss' && 'Miss'}
                    </span>
                    {lastRoll.isMatch && <span className="roll-match-badge">Match</span>}
                    {lastRoll.burned && <span className="roll-burned-badge">Burned</span>}
                  </div>
                  <div className="roll-dice-row">
                    {[
                      { value: lastRoll.actionScore, type: 'action' },
                      { value: lastRoll.challenge1, type: 'challenge' },
                      { value: lastRoll.challenge2, type: 'challenge' }
                    ]
                      .sort((a, b) => {
                        if (a.value !== b.value) return a.value - b.value;
                        if (a.type === 'challenge' && b.type !== 'challenge') return 1;
                        if (b.type === 'challenge' && a.type !== 'challenge') return -1;
                        return 0;
                      })
                      .map((die, i) => (
                        <div
                          key={i}
                          className={
                            die.type === 'action' ? `roll-action-score-display roll-action-${lastRoll.outcome}` :
                            'roll-challenge-die'
                          }
                        >
                          {die.value}
                        </div>
                      ))
                    }
                  </div>

                  {/* Show corresponding outcome text */}
                  {move.Outcomes && (
                    <div className="roll-outcome-text-display">
                      {lastRoll.outcome === 'strong' && move.Outcomes['Strong Hit'] && (
                        <>
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {move.Outcomes['Strong Hit'].Text}
                          </ReactMarkdown>
                          {lastRoll.payThePrice && (
                            <div className="pay-the-price-result">
                              <div className="pay-the-price-label">Pay the Price ({lastRoll.payThePrice.roll})</div>
                              <div className="pay-the-price-text">{lastRoll.payThePrice.result}</div>
                            </div>
                          )}
                        </>
                      )}
                      {lastRoll.outcome === 'weak' && move.Outcomes['Weak Hit'] && (
                        <>
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {move.Outcomes['Weak Hit'].Text}
                          </ReactMarkdown>
                          {lastRoll.payThePrice && (
                            <div className="pay-the-price-result">
                              <div className="pay-the-price-label">Pay the Price ({lastRoll.payThePrice.roll})</div>
                              <div className="pay-the-price-text">{lastRoll.payThePrice.result}</div>
                            </div>
                          )}
                        </>
                      )}
                      {lastRoll.outcome === 'miss' && move.Outcomes.Miss && (
                        <>
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {move.Outcomes.Miss.Text}
                          </ReactMarkdown>
                          {lastRoll.payThePrice && (
                            <div className="pay-the-price-result">
                              <div className="pay-the-price-label">Pay the Price ({lastRoll.payThePrice.roll})</div>
                              <div className="pay-the-price-text">{lastRoll.payThePrice.result}</div>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Burn Momentum Option */}
              {wouldImprove?.() && character?.conditions?.momentum !== undefined && (
                <MenuGroup title="Momentum">
                  <div className="momentum-preview-content">
                    <div className="momentum-outcome-row">
                      <span className={`momentum-outcome-banner momentum-outcome-${burnOutcome}`}>
                        {burnOutcome === 'strong' && 'Strong Hit'}
                        {burnOutcome === 'weak' && 'Weak Hit'}
                      </span>
                      {lastRoll.isMatch && <span className="momentum-match-badge">Match</span>}
                    </div>
                    <div className="momentum-dice-row">
                      {[
                        { value: character?.conditions?.momentum || 0, type: 'action' },
                        { value: lastRoll.challenge1, type: 'challenge' },
                        { value: lastRoll.challenge2, type: 'challenge' }
                      ]
                        .sort((a, b) => {
                          if (a.value !== b.value) return a.value - b.value;
                          if (a.type === 'challenge' && b.type !== 'challenge') return 1;
                          if (b.type === 'challenge' && a.type !== 'challenge') return -1;
                          return 0;
                        })
                        .map((die, i) => (
                          <div
                            key={i}
                            className={
                              die.type === 'action' ? `momentum-action-display momentum-action-${burnOutcome}` :
                              'momentum-challenge-die'
                            }
                          >
                            {die.value}
                          </div>
                        ))
                      }
                    </div>

                    {/* Show outcome text for momentum burn */}
                    {move.Outcomes && (
                      <div className="momentum-outcome-text-display">
                        {burnOutcome === 'strong' && move.Outcomes['Strong Hit'] && (
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {move.Outcomes['Strong Hit'].Text}
                          </ReactMarkdown>
                        )}
                        {burnOutcome === 'weak' && move.Outcomes['Weak Hit'] && (
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {move.Outcomes['Weak Hit'].Text}
                          </ReactMarkdown>
                        )}
                        {burnOutcome === 'miss' && move.Outcomes.Miss && (
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {move.Outcomes.Miss.Text}
                          </ReactMarkdown>
                        )}
                      </div>
                    )}
                  </div>
                  <MenuItem
                    label={`Burn Momentum (${character?.conditions?.momentum || 0})`}
                    onClick={() => {
                      const missOutcomeText = move.Outcomes?.Miss?.Text || '';
                      burnMomentum(missOutcomeText);
                    }}
                    isButton={true}
                  />
                </MenuGroup>
              )}
            </>
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
