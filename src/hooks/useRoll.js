import { useState } from 'react';

export const useRoll = (character, updateCondition) => {
  const [rollStat, setRollStat] = useState('edge');
  const [rollAdds, setRollAdds] = useState(0);
  const [lastRoll, setLastRoll] = useState(null);

  const makeActionRoll = () => {
    const actionDie = Math.floor(Math.random() * 6) + 1;
    const statValue = character.stats[rollStat];
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

    setLastRoll({
      actionDie,
      stat: rollStat,
      statValue,
      adds,
      actionScore,
      challenge1,
      challenge2,
      outcome,
      isMatch
    });
  };

  const burnMomentum = () => {
    if (!lastRoll || character.conditions.momentum <= character.conditions.momentumReset) return;

    const newActionScore = character.conditions.momentum;
    let outcome = '';
    if (newActionScore > lastRoll.challenge1 && newActionScore > lastRoll.challenge2) {
      outcome = 'strong';
    } else if (newActionScore > lastRoll.challenge1 || newActionScore > lastRoll.challenge2) {
      outcome = 'weak';
    } else {
      outcome = 'miss';
    }

    setLastRoll({
      ...lastRoll,
      actionScore: newActionScore,
      outcome,
      burned: true
    });

    updateCondition('momentum', character.conditions.momentumReset);
  };

  // Helper to check if burning momentum would improve the outcome
  const canBurnMomentum = lastRoll && !lastRoll.burned && lastRoll.outcome !== 'strong' && 
    character.conditions.momentum > character.conditions.momentumReset;

  const getBurnOutcome = () => {
    if (!canBurnMomentum) return null;
    const momentum = character.conditions.momentum;
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
