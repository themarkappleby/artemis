import React from 'react';
import { NavigationView } from '../../components/NavigationView';
import { MenuGroup } from '../../components/MenuGroup';
import { MenuItem } from '../../components/MenuItem';
import './RollTab.css';

export const RollTab = ({
  viewName,
  character,
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
  if (viewName !== 'roll-home') return null;

  const burnOutcome = getBurnOutcome();

  return (
    <NavigationView title="Roll" {...scrollProps}>
      <div className="roll-config">
        <div className="roll-stat-grid">
          {['edge', 'heart', 'iron', 'shadow', 'wits'].map(stat => (
            <button
              key={stat}
              className={`roll-stat-button ${rollStat === stat ? 'active' : ''}`}
              onClick={() => setRollStat(stat)}
            >
              <span className="roll-stat-value">{character.stats[stat]}</span>
              <span className="roll-stat-name">{stat.charAt(0).toUpperCase() + stat.slice(1)}</span>
            </button>
          ))}
          <div className="roll-adds-container">
            <span className="roll-adds-label">+</span>
            <input
              type="number"
              className="roll-adds-input"
              value={rollAdds}
              onChange={(e) => setRollAdds(e.target.value)}
              min="0"
              max="10"
            />
          </div>
        </div>
      </div>
      <MenuGroup>
        <MenuItem
          label="Roll"
          onClick={makeActionRoll}
          isButton={true}
        />
      </MenuGroup>

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
            </div>
          </div>

          {wouldImprove() && (
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
                    { value: character.conditions.momentum, type: 'action' },
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
              </div>
              <MenuItem
                label="Burn Momentum"
                onClick={burnMomentum}
                isButton={true}
              />
            </MenuGroup>
          )}
        </>
      )}
    </NavigationView>
  );
};
