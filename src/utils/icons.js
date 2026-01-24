// Asset type icons
export function getAssetIcon(assetTypeName) {
  const iconMap = {
    'Command Vehicle': '🚀',
    'Module': '⚙️',
    'Support Vehicle': '🛸',
    'Path': '🛤️',
    'Companion': '🤝',
    'Deed': '🏆'
  };
  return iconMap[assetTypeName] || '📋';
}

// Move category icons
export function getMoveIcon(categoryName) {
  const iconMap = {
    'Session': '🎮',
    'Adventure': '🗺️',
    'Quest': '🎯',
    'Connection': '🤝',
    'Exploration': '🔍',
    'Combat': '⚔️',
    'Suffer': '💔',
    'Recover': '💚',
    'Threshold': '🚪',
    'Legacy': '👑',
    'Fate': '🎲',
    'Scene Challenge': '🎬'
  };
  return iconMap[categoryName] || '📖';
}

// Oracle category icons
export function getOracleIcon(categoryName) {
  const iconMap = {
    'Character Creation': '👤',
    'Characters': '👥',
    'Core': '⭐',
    'Creatures': '👾',
    'Derelicts': '🛰️',
    'Factions': '🏛️',
    'Location Themes': '🌍',
    'Misc': '🎲',
    'Moves': '📖',
    'Planets': '🪐',
    'Settlements': '🏙️',
    'Space': '🌌',
    'Starships': '🚀',
    'Vaults': '🔐'
  };
  return iconMap[categoryName] || '🔮';
}

// Count oracles in a category
export function countOracles(category) {
  if (category.Oracles) {
    return category.Oracles.length;
  }
  if (category.Categories) {
    return category.Categories.length;
  }
  return 0;
}

// Region icons for sectors
export function getRegionIcon(region) {
  const icons = {
    terminus: '🌟',
    outlands: '🌀',
    expanse: '🌌',
    void: '🕳️'
  };
  return icons[region] || '🌟';
}

// Region labels for display
export function getRegionLabel(region) {
  const labels = {
    terminus: 'Terminus',
    outlands: 'Outlands',
    expanse: 'Expanse',
    void: 'Void'
  };
  return labels[region] || region;
}
