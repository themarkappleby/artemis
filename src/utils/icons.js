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
    'Command Vehicle': '#007AFF',
    'Module': '#8e8e93',
    'Support Vehicle': '#5856d6',
    'Path': '#ff9500',
    'Companion': '#34c759',
    'Deed': '#ffcc00'
  };
  return colorMap[assetTypeName] || '#8e8e93';
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
    'Session': '#5856d6',
    'Adventure': '#007AFF',
    'Quest': '#ff3b30',
    'Connection': '#34c759',
    'Exploration': '#ff9500',
    'Combat': '#ff3b30',
    'Suffer': '#ff2d55',
    'Recover': '#34c759',
    'Threshold': '#8e8e93',
    'Legacy': '#ffcc00',
    'Fate': '#5856d6',
    'Scene Challenge': '#af52de'
  };
  return colorMap[categoryName] || '#007AFF';
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
    'Character Creation': '#007AFF',
    'Characters': '#5856d6',
    'Core': '#ffcc00',
    'Creatures': '#34c759',
    'Derelicts': '#8e8e93',
    'Factions': '#ff9500',
    'Location Themes': '#34c759',
    'Misc': '#5856d6',
    'Moves': '#007AFF',
    'Planets': '#ff9500',
    'Settlements': '#af52de',
    'Space': '#007AFF',
    'Starships': '#5856d6',
    'Vaults': '#ff3b30'
  };
  return colorMap[categoryName] || '#5856d6';
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
    terminus: '#ffcc00',
    outlands: '#5856d6',
    expanse: '#007AFF',
    void: '#1c1c1e'
  };
  return colorMap[region] || '#ffcc00';
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
    'edge': '#ffcc00',
    'heart': '#ff3b30',
    'iron': '#8e8e93',
    'shadow': '#5856d6',
    'wits': '#ff9500'
  };
  return colorMap[statName?.toLowerCase()] || '#8e8e93';
}

// Progress category icon background colors
export function getProgressIconBg(category) {
  const colorMap = {
    'legacy': '#ffcc00',
    'vows': '#ff3b30',
    'expeditions': '#007AFF',
    'combat': '#ff3b30',
    'connections': '#34c759'
  };
  return colorMap[category] || '#007AFF';
}

// Generic icon background colors for misc icons
export function getGenericIconBg(icon) {
  const colorMap = {
    '📋': '#8e8e93',
    '📄': '#8e8e93',
    '🎲': '#5856d6',
    '📊': '#007AFF',
    '💪': '#ff9500',
    '👍': '#34c759',
    '❌': '#ff3b30',
    '⏳': '#ff9500',
    '🌌': '#007AFF',
    '🏛️': '#ff9500'
  };
  return colorMap[icon] || '#8e8e93';
}
