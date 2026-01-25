import { useState } from 'react';

export const useRoll = (character, updateCondition, starforgedData = null) => {
  const [rollStat, setRollStat] = useState('edge');
  const [rollAdds, setRollAdds] = useState(0);
  const [lastRoll, setLastRoll] = useState(null);

  // Find and roll on Pay the Price oracle
  const rollPayThePrice = () => {
    if (!starforgedData) return null;
    
    // Find the Pay the Price oracle in the Moves category
    const movesCategory = starforgedData.oracleCategories?.find(
      cat => cat.Name === 'Moves' || cat['$id']?.includes('Moves')
    );
    
    if (!movesCategory) return null;
    
    const payThePriceOracle = movesCategory.Oracles?.find(
      oracle => oracle.Name === 'Pay the Price'
    );
    
    if (!payThePriceOracle?.Table) return null;
    
    // Roll on the table
    const roll = Math.floor(Math.random() * 100) + 1;
    const result = payThePriceOracle.Table.find(row => {
      const floor = row.Floor || 1;
      const ceiling = row.Ceiling || 100;
      return roll >= floor && roll <= ceiling;
    });
    
    return {
      roll,
      result: result?.Result || 'No result found'
    };
  };

  const makeActionRoll = (missOutcomeText = null) => {
    const actionDie = Math.floor(Math.random() * 6) + 1;
    const statValue = character?.stats?.[rollStat] || 0;
    const adds = parseInt(rollAdds) || 0;
    const actionScore = Math.min(10, actionDie + statValue + adds);

    const challenge1 = Math.floor(Math.random() * 10) + 1;
    const challenge2 = Math.floor(Math.random() * 10) + 1;

    let outcome = '';
    if (actionScore > challenge1 && actionScore > challenge2) {
      outcome = 'strong';
    } else if (actionScore > challenge1 || actionScore > challenge2) {
      outcome = 'weak';
    } else {
      outcome = 'miss';
    }

    const isMatch = challenge1 === challenge2;

    // Only roll Pay the Price if the outcome is a miss and the miss text mentions it
    let payThePriceRoll = null;
    if (outcome === 'miss' && missOutcomeText && missOutcomeText.includes('Pay the Price')) {
      payThePriceRoll = rollPayThePrice();
    }

    setLastRoll({
      actionDie,
      stat: rollStat,
      statValue,
      adds,
      actionScore,
      challenge1,
      challenge2,
      outcome,
      isMatch,
      payThePrice: payThePriceRoll
    });
  };

  const burnMomentum = (missOutcomeText = null) => {
    if (!lastRoll || !character?.conditions?.momentum || 
        character.conditions.momentum <= (character.conditions.momentumReset || 0)) return;

    const newActionScore = character.conditions.momentum;
    let outcome = '';
    if (newActionScore > lastRoll.challenge1 && newActionScore > lastRoll.challenge2) {
      outcome = 'strong';
    } else if (newActionScore > lastRoll.challenge1 || newActionScore > lastRoll.challenge2) {
      outcome = 'weak';
    } else {
      outcome = 'miss';
    }

    // Only roll Pay the Price if burning momentum results in a miss and miss text mentions it
    let payThePriceRoll = null;
    if (outcome === 'miss' && missOutcomeText && missOutcomeText.includes('Pay the Price')) {
      payThePriceRoll = rollPayThePrice();
    }

    setLastRoll({
      ...lastRoll,
      actionScore: newActionScore,
      outcome,
      burned: true,
      payThePrice: payThePriceRoll
    });

    updateCondition('momentum', character.conditions.momentumReset || 0);
  };

  // Helper to check if burning momentum would improve the outcome
  const canBurnMomentum = lastRoll && !lastRoll.burned && lastRoll.outcome !== 'strong' && 
    character?.conditions?.momentum > (character?.conditions?.momentumReset || 0);

  const getBurnOutcome = () => {
    if (!canBurnMomentum) return null;
    const momentum = character?.conditions?.momentum || 0;
    if (momentum > lastRoll.challenge1 && momentum > lastRoll.challenge2) return 'strong';
    if (momentum > lastRoll.challenge1 || momentum > lastRoll.challenge2) return 'weak';
    return 'miss';
  };

  const wouldImprove = () => {
    if (!canBurnMomentum) return false;
    const burnOutcome = getBurnOutcome();
    return (lastRoll.outcome === 'miss' && burnOutcome !== 'miss') ||
           (lastRoll.outcome === 'weak' && burnOutcome === 'strong');
  };

  return {
    rollStat,
    setRollStat,
    rollAdds,
    setRollAdds,
    lastRoll,
    makeActionRoll,
    burnMomentum,
    canBurnMomentum,
    getBurnOutcome,
    wouldImprove
  };
};
