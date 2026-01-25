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

// Asset type icon background colors
export function getAssetIconBg(assetTypeName) {
  const colorMap = {
    'Command Vehicle': 'rgba(0, 122, 255, 0.3)',
    'Module': 'rgba(142, 142, 147, 0.3)',
    'Support Vehicle': 'rgba(88, 86, 214, 0.3)',
    'Path': 'rgba(255, 149, 0, 0.3)',
    'Companion': 'rgba(52, 199, 89, 0.3)',
    'Deed': 'rgba(255, 204, 0, 0.3)'
  };
  return colorMap[assetTypeName] || 'rgba(142, 142, 147, 0.3)';
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

// Move category icon background colors
export function getMoveIconBg(categoryName) {
  const colorMap = {
    'Session': 'rgba(88, 86, 214, 0.3)',
    'Adventure': 'rgba(0, 122, 255, 0.3)',
    'Quest': 'rgba(255, 59, 48, 0.3)',
    'Connection': 'rgba(52, 199, 89, 0.3)',
    'Exploration': 'rgba(255, 149, 0, 0.3)',
    'Combat': 'rgba(255, 59, 48, 0.3)',
    'Suffer': 'rgba(255, 45, 85, 0.3)',
    'Recover': 'rgba(52, 199, 89, 0.3)',
    'Threshold': 'rgba(142, 142, 147, 0.3)',
    'Legacy': 'rgba(255, 204, 0, 0.3)',
    'Fate': 'rgba(88, 86, 214, 0.3)',
    'Scene Challenge': 'rgba(175, 82, 222, 0.3)'
  };
  return colorMap[categoryName] || 'rgba(0, 122, 255, 0.3)';
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

// Oracle category icon background colors
export function getOracleIconBg(categoryName) {
  const colorMap = {
    'Character Creation': 'rgba(0, 122, 255, 0.3)',
    'Characters': 'rgba(88, 86, 214, 0.3)',
    'Core': 'rgba(255, 204, 0, 0.3)',
    'Creatures': 'rgba(52, 199, 89, 0.3)',
    'Derelicts': 'rgba(142, 142, 147, 0.3)',
    'Factions': 'rgba(255, 149, 0, 0.3)',
    'Location Themes': 'rgba(52, 199, 89, 0.3)',
    'Misc': 'rgba(88, 86, 214, 0.3)',
    'Moves': 'rgba(0, 122, 255, 0.3)',
    'Planets': 'rgba(255, 149, 0, 0.3)',
    'Settlements': 'rgba(175, 82, 222, 0.3)',
    'Space': 'rgba(0, 122, 255, 0.3)',
    'Starships': 'rgba(88, 86, 214, 0.3)',
    'Vaults': 'rgba(255, 59, 48, 0.3)'
  };
  return colorMap[categoryName] || 'rgba(88, 86, 214, 0.3)';
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

// Region icon background colors
export function getRegionIconBg(region) {
  const colorMap = {
    terminus: 'rgba(255, 204, 0, 0.3)',
    outlands: 'rgba(88, 86, 214, 0.3)',
    expanse: 'rgba(0, 122, 255, 0.3)',
    void: 'rgba(28, 28, 30, 0.3)'
  };
  return colorMap[region] || 'rgba(255, 204, 0, 0.3)';
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

// Stat icons
export function getStatIcon(statName) {
  const iconMap = {
    'edge': '⚡',
    'heart': '❤️',
    'iron': '🛡️',
    'shadow': '🌙',
    'wits': '💡'
  };
  return iconMap[statName?.toLowerCase()] || '📊';
}

// Stat icon background colors
export function getStatIconBg(statName) {
  const colorMap = {
    'edge': 'rgba(255, 204, 0, 0.3)',
    'heart': 'rgba(255, 59, 48, 0.3)',
    'iron': 'rgba(142, 142, 147, 0.3)',
    'shadow': 'rgba(88, 86, 214, 0.3)',
    'wits': 'rgba(255, 149, 0, 0.3)'
  };
  return colorMap[statName?.toLowerCase()] || 'rgba(142, 142, 147, 0.3)';
}

// Progress category icon background colors
export function getProgressIconBg(category) {
  const colorMap = {
    'legacy': 'rgba(255, 204, 0, 0.3)',
    'vows': 'rgba(255, 59, 48, 0.3)',
    'expeditions': 'rgba(0, 122, 255, 0.3)',
    'combat': 'rgba(255, 59, 48, 0.3)',
    'connections': 'rgba(52, 199, 89, 0.3)'
  };
  return colorMap[category] || 'rgba(0, 122, 255, 0.3)';
}

// Generic icon background colors for misc icons
export function getGenericIconBg(icon) {
  const colorMap = {
    '📋': 'rgba(142, 142, 147, 0.3)',
    '📄': 'rgba(142, 142, 147, 0.3)',
    '🎲': 'rgba(88, 86, 214, 0.3)',
    '📊': 'rgba(0, 122, 255, 0.3)',
    '💪': 'rgba(255, 149, 0, 0.3)',
    '👍': 'rgba(52, 199, 89, 0.3)',
    '❌': 'rgba(255, 59, 48, 0.3)',
    '⏳': 'rgba(255, 149, 0, 0.3)',
    '🌌': 'rgba(0, 122, 255, 0.3)',
    '🏛️': 'rgba(255, 149, 0, 0.3)'
  };
  return colorMap[icon] || 'rgba(142, 142, 147, 0.3)';
}
