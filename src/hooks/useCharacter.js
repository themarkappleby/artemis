import { useState } from 'react';
import { RANK_TICKS } from '../components/ProgressTrack';

const initialCharacter = {
  name: '',
  stats: {
    edge: 1,
    heart: 1,
    iron: 1,
    shadow: 1,
    wits: 1
  },
  conditions: {
    health: 5,
    spirit: 5,
    supply: 5,
    momentum: 2,
    momentumMax: 10,
    momentumReset: 2
  },
  assets: [
    { typeIndex: 0, assetIndex: 0, enabledAbilities: [0], inputs: {} } // Starship Command Vehicle
  ],
  legacy: {
    quests: 0,
    bonds: 0,
    discoveries: 0
  },
  vows: [],
  expeditions: [],
  combatTracks: [],
  connections: []
};

export const useCharacter = () => {
  const [character, setCharacter] = useState(initialCharacter);
  const [newTrackName, setNewTrackName] = useState('');
  const [newTrackRank, setNewTrackRank] = useState('dangerous');

  const updateStat = (statName, value) => {
    setCharacter({
      ...character,
      stats: {
        ...character.stats,
        [statName]: value
      }
    });
  };

  const updateCondition = (conditionName, value) => {
    setCharacter({
      ...character,
      conditions: {
        ...character.conditions,
        [conditionName]: value
      }
    });
  };

  const updateName = (name) => {
    setCharacter({ ...character, name });
  };

  const addAsset = (typeIndex, assetIndex) => {
    const exists = character.assets.some(
      a => a.typeIndex === typeIndex && a.assetIndex === assetIndex
    );
    if (!exists) {
      setCharacter({
        ...character,
        assets: [...character.assets, { typeIndex, assetIndex, enabledAbilities: [0], inputs: {} }]
      });
    }
    return !exists;
  };

  const removeAsset = (typeIndex, assetIndex) => {
    setCharacter({
      ...character,
      assets: character.assets.filter(
        a => !(a.typeIndex === typeIndex && a.assetIndex === assetIndex)
      )
    });
  };

  const toggleAssetAbility = (typeIndex, assetIndex, abilityIndex) => {
    setCharacter({
      ...character,
      assets: character.assets.map(a => {
        if (a.typeIndex === typeIndex && a.assetIndex === assetIndex) {
          const enabled = a.enabledAbilities.includes(abilityIndex);
          return {
            ...a,
            enabledAbilities: enabled
              ? a.enabledAbilities.filter(i => i !== abilityIndex)
              : [...a.enabledAbilities, abilityIndex]
          };
        }
        return a;
      })
    });
  };

  const updateAssetInput = (typeIndex, assetIndex, inputName, value) => {
    setCharacter({
      ...character,
      assets: character.assets.map(a => {
        if (a.typeIndex === typeIndex && a.assetIndex === assetIndex) {
          return {
            ...a,
            inputs: {
              ...a.inputs,
              [inputName]: value
            }
          };
        }
        return a;
      })
    });
  };

  const addProgressTrack = (trackType) => {
    if (!newTrackName.trim()) return false;

    const newTrack = {
      id: Date.now(),
      name: newTrackName.trim(),
      rank: newTrackRank,
      ticks: 0
    };

    setCharacter({
      ...character,
      [trackType]: [...character[trackType], newTrack]
    });

    setNewTrackName('');
    setNewTrackRank('dangerous');
    return true;
  };

  const removeProgressTrack = (trackType, trackId) => {
    setCharacter({
      ...character,
      [trackType]: character[trackType].filter(t => t.id !== trackId)
    });
  };

  const markProgress = (trackType, trackId) => {
    setCharacter({
      ...character,
      [trackType]: character[trackType].map(track => {
        if (track.id === trackId) {
          const ticksToAdd = RANK_TICKS[track.rank];
          return {
            ...track,
            ticks: Math.min(40, track.ticks + ticksToAdd)
          };
        }
        return track;
      })
    });
  };

  const clearProgress = (trackType, trackId) => {
    setCharacter({
      ...character,
      [trackType]: character[trackType].map(track => {
        if (track.id === trackId) {
          return {
            ...track,
            ticks: Math.max(0, track.ticks - 1)
          };
        }
        return track;
      })
    });
  };

  const markLegacy = (legacyType) => {
    setCharacter({
      ...character,
      legacy: {
        ...character.legacy,
        [legacyType]: Math.min(40, character.legacy[legacyType] + 8)
      }
    });
  };

  return {
    character,
    setCharacter,
    newTrackName,
    setNewTrackName,
    newTrackRank,
    setNewTrackRank,
    updateStat,
    updateCondition,
    updateName,
    addAsset,
    removeAsset,
    toggleAssetAbility,
    updateAssetInput,
    addProgressTrack,
    removeProgressTrack,
    markProgress,
    clearProgress,
    markLegacy
  };
};
