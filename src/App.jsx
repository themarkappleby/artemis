import { useState, useEffect } from 'react';
import { NavigationView } from './components/NavigationView';
import { MenuGroup } from './components/MenuGroup';
import { MenuItem } from './components/MenuItem';
import { DetailCard } from './components/DetailCard';
import { StatBar } from './components/StatBar';
import { MeterBar } from './components/MeterBar';
import { ProgressTrack, RANK_TICKS, RANK_LABELS } from './components/ProgressTrack';
import { TabBar } from './components/TabBar';
import { useStarforged } from './hooks/useStarforged';
import './App.css';

function App() {
  const [activeTab, setActiveTab] = useState('explore');
  const [navigationStacks, setNavigationStacks] = useState({
    explore: ['home'],
    character: ['character-home'],
    moves: ['moves-home'],
    oracle: ['oracle-home']
  });
  const [direction, setDirection] = useState(null);
  const [previousView, setPreviousView] = useState(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [oracleRolls, setOracleRolls] = useState({});
  
  // Character state
  const [character, setCharacter] = useState({
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
      { typeIndex: 0, assetIndex: 0, enabledAbilities: [0] } // Starship Command Vehicle
    ],
    vows: [], // Array of { id, name, rank, ticks }
    expeditions: [],
    combatTracks: []
  });

  // Progress track state for new track creation
  const [newTrackName, setNewTrackName] = useState('');
  const [newTrackRank, setNewTrackRank] = useState('dangerous');
  
  const { data: starforgedData, loading } = useStarforged();
  
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

  const addAsset = (typeIndex, assetIndex) => {
    // Check if asset already exists
    const exists = character.assets.some(
      a => a.typeIndex === typeIndex && a.assetIndex === assetIndex
    );
    if (!exists) {
      setCharacter({
        ...character,
        assets: [...character.assets, { typeIndex, assetIndex, enabledAbilities: [0] }]
      });
    }
    // Navigate back to character home
    setNavigationStacks({
      ...navigationStacks,
      [activeTab]: ['character-home']
    });
  };

  const removeAsset = (typeIndex, assetIndex) => {
    setCharacter({
      ...character,
      assets: character.assets.filter(
        a => !(a.typeIndex === typeIndex && a.assetIndex === assetIndex)
      )
    });
    goBack();
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

  // Progress track functions
  const addProgressTrack = (trackType) => {
    if (!newTrackName.trim()) return;
    
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
    
    // Navigate to the newly created track's detail page
    const trackTypeMap = {
      vows: 'vow',
      expeditions: 'expedition',
      combatTracks: 'combat'
    };
    const viewPrefix = trackTypeMap[trackType];
    
    // Replace the current view stack to go from list -> detail
    setNavigationStacks({
      ...navigationStacks,
      [activeTab]: [
        ...navigationStacks[activeTab].slice(0, -1), // Remove the 'add-X' view
        `${viewPrefix}-${newTrack.id}` // Add the detail view
      ]
    });
  };

  const removeProgressTrack = (trackType, trackId) => {
    setCharacter({
      ...character,
      [trackType]: character[trackType].filter(t => t.id !== trackId)
    });
    goBack();
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

  const navigate = (view) => {
    if (isTransitioning) return;
    
    setDirection('forward');
    setPreviousView(navigationStacks[activeTab][navigationStacks[activeTab].length - 1]);
    setIsTransitioning(true);
    
    setNavigationStacks({
      ...navigationStacks,
      [activeTab]: [...navigationStacks[activeTab], view]
    });
    
    setTimeout(() => {
      setIsTransitioning(false);
      setPreviousView(null);
      setDirection(null);
    }, 350);
  };

  const goBack = () => {
    const currentStack = navigationStacks[activeTab];
    if (currentStack.length > 1 && !isTransitioning) {
      setDirection('back');
      setPreviousView(currentStack[currentStack.length - 1]);
      setIsTransitioning(true);
      
      setNavigationStacks({
        ...navigationStacks,
        [activeTab]: currentStack.slice(0, -1)
      });
      
      setTimeout(() => {
        setIsTransitioning(false);
        setPreviousView(null);
        setDirection(null);
      }, 350);
    }
  };

  const handleTabChange = (tabId) => {
    if (tabId !== activeTab) {
      // Switching to a different tab
      setActiveTab(tabId);
      setIsTransitioning(false);
      setPreviousView(null);
      setDirection(null);
    } else {
      // Clicking the active tab - go to home view if not already there
      const homeView = navigationStacks[tabId][0];
      const currentView = navigationStacks[tabId][navigationStacks[tabId].length - 1];
      
      if (currentView !== homeView && !isTransitioning) {
        setDirection('back');
        setPreviousView(currentView);
        setIsTransitioning(true);
        
        setNavigationStacks({
          ...navigationStacks,
          [tabId]: [homeView]
        });
        
        setTimeout(() => {
          setIsTransitioning(false);
          setPreviousView(null);
          setDirection(null);
        }, 350);
      }
    }
  };

  // Helper to get oracle table data (handles different data structures)
  const getOracleTable = (oracle) => {
    if (!oracle) return null;
    // Check for direct Table property
    if (oracle.Table && oracle.Table.length > 0) return oracle.Table;
    // Check for Tables object (some oracles have multiple named tables)
    if (oracle.Tables) {
      const tableKeys = Object.keys(oracle.Tables);
      if (tableKeys.length > 0) {
        // Return the first available table
        return oracle.Tables[tableKeys[0]]?.Table || null;
      }
    }
    return null;
  };

  // Helper to find an oracle by its path (e.g., "Starforged/Oracles/Derelicts")
  const findOracleByPath = (path) => {
    if (!starforgedData || !path) return null;
    
    // Parse the path - format is typically "Starforged/Oracles/Category/Subcategory/Oracle"
    const parts = path.split('/');
    
    // Search through oracle categories
    for (const category of starforgedData.oracleCategories) {
      // Check if category name matches any part of the path
      if (path.toLowerCase().includes(category.Name?.toLowerCase())) {
        // Check direct oracles in category
        if (category.Oracles) {
          for (const oracle of category.Oracles) {
            if (path.includes(oracle['$id']) || path.toLowerCase().includes(oracle.Name?.toLowerCase().replace(/\s+/g, '_'))) {
              return oracle;
            }
          }
        }
        // Check sub-categories
        if (category.Categories) {
          for (const subCat of category.Categories) {
            if (path.toLowerCase().includes(subCat.Name?.toLowerCase().replace(/\s+/g, '_'))) {
              if (subCat.Oracles) {
                for (const oracle of subCat.Oracles) {
                  if (path.includes(oracle['$id']) || path.toLowerCase().includes(oracle.Name?.toLowerCase().replace(/\s+/g, '_'))) {
                    return oracle;
                  }
                }
                // If no specific oracle matched, return the first oracle in the subcategory
                if (subCat.Oracles.length > 0) {
                  return subCat.Oracles[0];
                }
              }
              // Check sub-sub-categories
              if (subCat.Categories) {
                for (const subSubCat of subCat.Categories) {
                  if (subSubCat.Oracles) {
                    for (const oracle of subSubCat.Oracles) {
                      if (path.includes(oracle['$id']) || path.toLowerCase().includes(oracle.Name?.toLowerCase().replace(/\s+/g, '_'))) {
                        return oracle;
                      }
                    }
                  }
                }
              }
            }
          }
        }
        // If category matched but no specific oracle, return first oracle
        if (category.Oracles && category.Oracles.length > 0) {
          return category.Oracles[0];
        }
      }
    }
    return null;
  };

  // Helper to check if a result contains an oracle reference and extract it
  const parseOracleReference = (resultText) => {
    if (!resultText) return null;
    // Match patterns like [▶Name](Path) or [>Name](Path)
    const refMatch = resultText.match(/\[(?:▶|>)?\s*([^\]]+)\]\(([^)]+)\)/);
    if (refMatch) {
      return {
        displayName: refMatch[1].trim(),
        path: refMatch[2].trim()
      };
    }
    return null;
  };

  // Roll on a single table and return the result
  const rollOnTable = (table) => {
    if (!table || table.length === 0) return null;
    const roll = Math.floor(Math.random() * 100) + 1;
    const result = table.find(row => {
      const floor = row.Floor || row.Chance || 1;
      const ceiling = row.Ceiling || row.Chance || 100;
      return roll >= floor && roll <= ceiling;
    });
    return { roll, result: result?.Result || 'No result found' };
  };

  // Recursively resolve oracle references (max depth to prevent infinite loops)
  const resolveOracleResult = (resultText, maxDepth = 5) => {
    if (maxDepth <= 0) return resultText;
    
    const ref = parseOracleReference(resultText);
    if (!ref) return resultText;
    
    // Find the referenced oracle
    const referencedOracle = findOracleByPath(ref.path);
    if (!referencedOracle) return resultText;
    
    // Get the table and roll on it
    const table = getOracleTable(referencedOracle);
    if (!table) return resultText;
    
    const rollResult = rollOnTable(table);
    if (!rollResult) return resultText;
    
    // Check if this result also contains a reference
    const resolvedResult = resolveOracleResult(rollResult.result, maxDepth - 1);
    
    // Return the resolved result (optionally with context)
    return resolvedResult;
  };

  const rollOracle = (oracleKey, oracleTable) => {
    if (!oracleTable || oracleTable.length === 0) return;
    
    // Roll d100 (1-100)
    const roll = Math.floor(Math.random() * 100) + 1;
    
    // Find the matching result
    const result = oracleTable.find(row => {
      const floor = row.Floor || row.Chance || 1;
      const ceiling = row.Ceiling || row.Chance || 100;
      return roll >= floor && roll <= ceiling;
    });
    
    const rawResult = result?.Result || 'No result found';
    
    // Check if result contains a reference and resolve it
    const finalResult = resolveOracleResult(rawResult);
    
    setOracleRolls({
      ...oracleRolls,
      [oracleKey]: {
        roll,
        result: finalResult
      }
    });
  };

  const currentView = navigationStacks[activeTab][navigationStacks[activeTab].length - 1];

  // Register service worker
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then(registration => console.log('SW registered:', registration))
        .catch(error => console.log('SW registration failed:', error));
    }
  }, []);

  const renderViewContent = (viewName) => {
    if (loading) {
      return (
        <NavigationView title="Loading...">
          <MenuGroup>
            <MenuItem icon="⏳" label="Loading Starforged data..." showChevron={false} />
          </MenuGroup>
        </NavigationView>
      );
    }

    // THE FORGE TAB
    if (viewName === 'home') {
      return (
        <NavigationView title="The Forge">
          <MenuGroup title="Regions">
            <MenuItem 
              icon="🌟" 
              label="Terminus" 
              onClick={() => navigate('region-terminus')}
            />
            <MenuItem 
              icon="🌀" 
              label="Outlands" 
              onClick={() => navigate('region-outlands')}
            />
            <MenuItem 
              icon="🌌" 
              label="Expanse" 
              onClick={() => navigate('region-expanse')}
            />
            <MenuItem 
              icon="🕳️" 
              label="Void" 
              onClick={() => navigate('region-void')}
            />
          </MenuGroup>

          <MenuGroup title="Truths">
            {starforgedData?.settingTruths.map((truth, index) => (
              <MenuItem 
                key={truth['$id'] || index}
                icon="🌌" 
                label={truth.Name || `Truth ${index + 1}`}
                onClick={() => navigate(`setting-truth-${index}`)}
              />
            ))}
          </MenuGroup>
        </NavigationView>
      );
    }

    // CHARACTER TAB
    if (viewName === 'character-home') {
      return (
        <NavigationView title="Character">
          <div style={{ padding: '0 16px' }}>
            <input
              type="text"
              className="character-name-input"
              value={character.name}
              onChange={(e) => setCharacter({ ...character, name: e.target.value })}
              placeholder="Character Name"
            />
          </div>

          <MenuGroup title="Condition Meters">
            <div style={{ padding: '12px 0' }}>
              <MeterBar 
                label="Health" 
                value={character.conditions.health} 
                maxValue={5}
                color="#ff3b30"
                onChange={(val) => updateCondition('health', val)}
              />
              <MeterBar 
                label="Spirit" 
                value={character.conditions.spirit} 
                maxValue={5}
                color="#007AFF"
                onChange={(val) => updateCondition('spirit', val)}
              />
              <MeterBar 
                label="Supply" 
                value={character.conditions.supply} 
                maxValue={5}
                color="#34c759"
                onChange={(val) => updateCondition('supply', val)}
              />
            </div>
          </MenuGroup>

          <MenuGroup>
            <div style={{ paddingTop: '12px' }}>
              <MeterBar 
                label="Momentum" 
                value={character.conditions.momentum} 
                maxValue={character.conditions.momentumMax}
                color="#ff9500"
                onChange={(val) => updateCondition('momentum', val)}
                style={{ marginBottom: 0 }}
              />
            </div>
            <StatBar 
              label="Max" 
              value={character.conditions.momentumMax}
              minValue={0}
              maxValue={10}
              onChange={(val) => updateCondition('momentumMax', val)}
            />
            <StatBar 
              label="Reset" 
              value={character.conditions.momentumReset}
              minValue={0}
              maxValue={10}
              onChange={(val) => updateCondition('momentumReset', val)}
            />
            <button 
              className="burn-momentum-button"
              onClick={() => updateCondition('momentum', character.conditions.momentumReset)}
            >
              Burn Momentum
            </button>
          </MenuGroup>

          <MenuGroup title="Stats">
            <StatBar 
              label="Edge" 
              value={character.stats.edge}
              maxValue={5}
              onChange={(val) => updateStat('edge', val)}
            />
            <StatBar 
              label="Heart" 
              value={character.stats.heart}
              maxValue={5}
              onChange={(val) => updateStat('heart', val)}
            />
            <StatBar 
              label="Iron" 
              value={character.stats.iron}
              maxValue={5}
              onChange={(val) => updateStat('iron', val)}
            />
            <StatBar 
              label="Shadow" 
              value={character.stats.shadow}
              maxValue={5}
              onChange={(val) => updateStat('shadow', val)}
            />
            <StatBar 
              label="Wits" 
              value={character.stats.wits}
              maxValue={5}
              onChange={(val) => updateStat('wits', val)}
            />
          </MenuGroup>

          <MenuGroup title="Assets">
            {character.assets.length === 0 ? (
              <MenuItem 
                icon="📋" 
                label="No assets yet" 
                showChevron={false}
              />
            ) : (
              character.assets.map((ownedAsset, index) => {
                const assetType = starforgedData?.assetTypes[ownedAsset.typeIndex];
                const asset = assetType?.Assets?.[ownedAsset.assetIndex];
                if (!asset) return null;
                return (
                  <MenuItem 
                    key={`owned-${ownedAsset.typeIndex}-${ownedAsset.assetIndex}`}
                    icon={getAssetIcon(assetType.Name)}
                    label={asset.Name}
                    value={assetType.Name}
                    onClick={() => navigate(`owned-asset-${ownedAsset.typeIndex}-${ownedAsset.assetIndex}`)}
                  />
                );
              })
            )}
            <MenuItem 
              label="Add Asset"
              onClick={() => navigate('add-asset')}
              isButton={true}
            />
          </MenuGroup>

          <MenuGroup title="Progress">
            <MenuItem 
              icon="🎯" 
              label="Vows" 
              value={character.vows.length.toString()}
              onClick={() => navigate('vows')}
            />
            <MenuItem 
              icon="🗺️" 
              label="Expeditions" 
              value={character.expeditions.length.toString()}
              onClick={() => navigate('expeditions')}
            />
            <MenuItem 
              icon="⚔️" 
              label="Combat Tracks" 
              value={character.combatTracks.length.toString()}
              onClick={() => navigate('combat-tracks')}
            />
          </MenuGroup>
        </NavigationView>
      );
    }

    // Add Asset - Browse Asset Types
    if (viewName === 'add-asset' && starforgedData) {
      return (
        <NavigationView title="Add Asset" onBack={goBack}>
          <MenuGroup title="Asset Types">
            {starforgedData.assetTypes.map((assetType, index) => (
              <MenuItem 
                key={assetType['$id'] || index}
                icon={getAssetIcon(assetType.Name)}
                label={assetType.Name}
                value={`${assetType.Assets?.length || 0} assets`}
                onClick={() => navigate(`add-asset-type-${index}`)}
              />
            ))}
          </MenuGroup>
        </NavigationView>
      );
    }

    // Add Asset - Browse Assets in Type
    if (viewName.startsWith('add-asset-type-') && starforgedData) {
      const index = parseInt(viewName.split('-')[3]);
      const assetType = starforgedData.assetTypes[index];
      
      if (assetType) {
        return (
          <NavigationView title={assetType.Name} onBack={goBack}>
            <MenuGroup>
              {assetType.Assets?.map((asset, assetIndex) => {
                const isOwned = character.assets.some(
                  a => a.typeIndex === index && a.assetIndex === assetIndex
                );
                return (
                  <MenuItem 
                    key={asset['$id'] || assetIndex}
                    icon={getAssetIcon(assetType.Name)}
                    label={asset.Name}
                    value={isOwned ? 'Owned' : ''}
                    onClick={() => navigate(`add-asset-${index}-${assetIndex}`)}
                  />
                );
              }) || <MenuItem icon="📄" label="No assets available" showChevron={false} />}
            </MenuGroup>
          </NavigationView>
        );
      }
    }

    // Add Asset - Asset Details with Add Button
    if (viewName.startsWith('add-asset-') && viewName.split('-').length === 4 && starforgedData) {
      const parts = viewName.split('-');
      const typeIndex = parseInt(parts[2]);
      const assetIndex = parseInt(parts[3]);
      const assetType = starforgedData.assetTypes[typeIndex];
      const asset = assetType?.Assets?.[assetIndex];
      const isOwned = character.assets.some(
        a => a.typeIndex === typeIndex && a.assetIndex === assetIndex
      );
      
      if (asset) {
        return (
          <NavigationView title={asset.Name} onBack={goBack}>
            {asset.Requirement && (
              <DetailCard
                icon={getAssetIcon(assetType.Name)}
                title="Requirement"
                description={asset.Requirement}
              />
            )}
            
            {asset.Abilities && asset.Abilities.length > 0 && (
              <MenuGroup title="Abilities">
                {asset.Abilities.map((ability, abilityIndex) => (
                  <MenuItem 
                    key={abilityIndex}
                    icon="⭕"
                    label={ability.Name || `Ability ${abilityIndex + 1}`}
                    subtitle={ability.Text || ''}
                    showChevron={false}
                  />
                ))}
              </MenuGroup>
            )}
            
            <MenuGroup>
              {isOwned ? (
                <MenuItem 
                  label="Already Owned"
                  showChevron={false}
                />
              ) : (
                <MenuItem 
                  label="Add to Character"
                  onClick={() => addAsset(typeIndex, assetIndex)}
                  isButton={true}
                />
              )}
            </MenuGroup>
          </NavigationView>
        );
      }
    }

    // Owned Asset Details
    if (viewName.startsWith('owned-asset-') && starforgedData) {
      const parts = viewName.split('-');
      const typeIndex = parseInt(parts[2]);
      const assetIndex = parseInt(parts[3]);
      const assetType = starforgedData.assetTypes[typeIndex];
      const asset = assetType?.Assets?.[assetIndex];
      const ownedAsset = character.assets.find(
        a => a.typeIndex === typeIndex && a.assetIndex === assetIndex
      );
      
      if (asset && ownedAsset) {
        return (
          <NavigationView title={asset.Name} onBack={goBack}>
            {asset.Requirement && (
              <DetailCard
                icon={getAssetIcon(assetType.Name)}
                title="Requirement"
                description={asset.Requirement}
              />
            )}
            
            {asset.Abilities && asset.Abilities.length > 0 && (
              <MenuGroup title="Abilities">
                {asset.Abilities.map((ability, abilityIndex) => {
                  const isEnabled = ownedAsset.enabledAbilities.includes(abilityIndex);
                  return (
                    <MenuItem 
                      key={abilityIndex}
                      icon={isEnabled ? "✅" : "⭕"}
                      label={ability.Name || `Ability ${abilityIndex + 1}`}
                      subtitle={ability.Text || ''}
                      onClick={() => toggleAssetAbility(typeIndex, assetIndex, abilityIndex)}
                      showChevron={false}
                    />
                  );
                })}
              </MenuGroup>
            )}
            
            {asset.Inputs && asset.Inputs.length > 0 && (
              <MenuGroup title="Inputs">
                {asset.Inputs.map((input, inputIndex) => (
                  <MenuItem 
                    key={inputIndex}
                    icon="✏️"
                    label={input.Name || `Input ${inputIndex + 1}`}
                    showChevron={false}
                  />
                ))}
              </MenuGroup>
            )}
            
            <MenuGroup>
              <MenuItem 
                label="Remove Asset"
                onClick={() => removeAsset(typeIndex, assetIndex)}
                isButton={true}
                destructive={true}
              />
            </MenuGroup>
          </NavigationView>
        );
      }
    }

    // MOVES TAB
    if (viewName === 'moves-home') {
      return (
        <NavigationView title="Moves">
          <MenuGroup title="Move Categories">
            {starforgedData?.moveCategories.map((category, index) => (
              <MenuItem 
                key={category['$id'] || index}
                icon={getMoveIcon(category.Name)}
                label={category.Name}
                value={`${category.Moves?.length || 0} moves`}
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
          <NavigationView title={category.Name} onBack={goBack}>
            <MenuGroup>
              {category.Moves?.map((move, moveIndex) => (
                <MenuItem 
                  key={move['$id'] || moveIndex}
                  icon={getMoveIcon(category.Name)}
                  label={move.Name}
                  subtitle={move.Trigger?.Text || ''}
                  onClick={() => navigate(`move-${index}-${moveIndex}`)}
                />
              )) || <MenuItem icon="📄" label="No moves available" showChevron={false} />}
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
        
        return (
          <NavigationView title={move.Name} onBack={goBack}>
            <DetailCard
              icon={getMoveIcon(category.Name)}
              title={move.Name}
              description={moveText}
            />
            
            {move['Progress Move'] && (
              <MenuGroup>
                <MenuItem 
                  icon="📊" 
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
                    label="Strong Hit" 
                    onClick={() => navigate(`move-outcome-${catIndex}-${moveIndex}-strong`)}
                  />
                )}
                {move.Outcomes['Weak Hit'] && (
                  <MenuItem 
                    icon="👍" 
                    label="Weak Hit" 
                    onClick={() => navigate(`move-outcome-${catIndex}-${moveIndex}-weak`)}
                  />
                )}
                {move.Outcomes.Miss && (
                  <MenuItem 
                    icon="❌" 
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
      const outcomeType = parts[4]; // 'strong', 'weak', or 'miss'
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
          <NavigationView title={`${move.Name} - ${outcomeTitle}`} onBack={goBack}>
            <DetailCard
              icon={getMoveIcon(category.Name)}
              title={outcomeTitle}
              description={outcomeText}
            />
          </NavigationView>
        );
      }
    }

    // ORACLE TAB
    if (viewName === 'oracle-home') {
      return (
        <NavigationView title="Oracle">
          <MenuGroup title="Oracle Categories">
            {starforgedData?.oracleCategories.map((category, index) => (
              <MenuItem 
                key={category['$id'] || index}
                icon={getOracleIcon(category.Name)}
                label={category.Name}
                onClick={() => navigate(`oracle-category-${index}`)}
              />
            ))}
          </MenuGroup>
        </NavigationView>
      );
    }

    // Oracle Category Details
    if (viewName.startsWith('oracle-category-') && starforgedData) {
      const index = parseInt(viewName.split('-')[2]);
      const category = starforgedData.oracleCategories[index];
      
      if (category) {
        return (
          <NavigationView title={category.Name} onBack={goBack}>
            <MenuGroup>
              {category.Oracles?.map((oracle, oracleIndex) => (
                <MenuItem 
                  key={oracle['$id'] || oracleIndex}
                  icon={getOracleIcon(category.Name)}
                  label={oracle.Name}
                  onClick={() => navigate(`oracle-${index}-${oracleIndex}`)}
                />
              )) || category.Categories?.map((subCategory, subIndex) => (
                <MenuItem 
                  key={subCategory['$id'] || subIndex}
                  icon={getOracleIcon(subCategory.Name)}
                  label={subCategory.Name}
                  onClick={() => navigate(`oracle-sub-${index}-${subIndex}`)}
                />
              )) || <MenuItem icon="📄" label="No oracles available" showChevron={false} />}
            </MenuGroup>
          </NavigationView>
        );
      }
    }

    // Oracle Sub-Category Details
    if (viewName.startsWith('oracle-sub-') && !viewName.startsWith('oracle-sub-sub-') && starforgedData) {
      const parts = viewName.split('-');
      const catIndex = parseInt(parts[2]);
      const subIndex = parseInt(parts[3]);
      const subCategory = starforgedData.oracleCategories[catIndex]?.Categories?.[subIndex];
      
      if (subCategory) {
        return (
          <NavigationView title={subCategory.Name} onBack={goBack}>
            <MenuGroup>
              {subCategory.Oracles?.map((oracle, oracleIndex) => (
                <MenuItem 
                  key={oracle['$id'] || oracleIndex}
                  icon={getOracleIcon(subCategory.Name)}
                  label={oracle.Name}
                  onClick={() => navigate(`oracle-detail-${catIndex}-${subIndex}-${oracleIndex}`)}
                />
              )) || subCategory.Categories?.map((subSubCategory, subSubIndex) => (
                <MenuItem 
                  key={subSubCategory['$id'] || subSubIndex}
                  icon={getOracleIcon(subSubCategory.Name)}
                  label={subSubCategory.Name}
                  onClick={() => navigate(`oracle-sub-sub-${catIndex}-${subIndex}-${subSubIndex}`)}
                />
              )) || <MenuItem icon="📄" label="No oracles available" showChevron={false} />}
            </MenuGroup>
          </NavigationView>
        );
      }
    }

    // Oracle Sub-Sub-Category Details (deeper nesting)
    if (viewName.startsWith('oracle-sub-sub-') && starforgedData) {
      const parts = viewName.split('-');
      const catIndex = parseInt(parts[3]);
      const subIndex = parseInt(parts[4]);
      const subSubIndex = parseInt(parts[5]);
      const subSubCategory = starforgedData.oracleCategories[catIndex]?.Categories?.[subIndex]?.Categories?.[subSubIndex];
      
      if (subSubCategory) {
        return (
          <NavigationView title={subSubCategory.Name} onBack={goBack}>
            <MenuGroup>
              {subSubCategory.Oracles?.map((oracle, oracleIndex) => (
                <MenuItem 
                  key={oracle['$id'] || oracleIndex}
                  icon={getOracleIcon(subSubCategory.Name)}
                  label={oracle.Name}
                  onClick={() => navigate(`oracle-detail-deep-${catIndex}-${subIndex}-${subSubIndex}-${oracleIndex}`)}
                />
              )) || <MenuItem icon="📄" label="No oracles available" showChevron={false} />}
            </MenuGroup>
          </NavigationView>
        );
      }
    }

    // Oracle Details (direct from category)
    if (viewName.startsWith('oracle-') && viewName.split('-').length === 3 && !viewName.includes('sub') && !viewName.includes('detail') && !viewName.includes('table') && starforgedData) {
      const [, catIndex, oracleIndex] = viewName.split('-').map(Number);
      const category = starforgedData.oracleCategories[catIndex];
      const oracle = category?.Oracles?.[oracleIndex];
      const oracleKey = `oracle-${catIndex}-${oracleIndex}`;
      const rolledResult = oracleRolls[oracleKey];
      const oracleTable = getOracleTable(oracle);
      
      if (oracle) {
        return (
          <NavigationView title={oracle.Name} onBack={goBack}>
            <DetailCard
              icon={getOracleIcon(category.Name)}
              title={oracle.Name}
              description={oracle.Description || 'Roll to consult this oracle.'}
            />
            
            {oracleTable && (
              <>
                <MenuGroup>
                  {rolledResult && (
                    <div style={{ padding: '16px', borderBottom: '0.5px solid #38383a' }}>
                      <div style={{ fontSize: '17px', fontWeight: '600', color: '#ffffff', marginBottom: '4px' }}>
                        {rolledResult.result}
                      </div>
                      <div style={{ fontSize: '13px', color: '#8e8e93' }}>
                        Rolled: {rolledResult.roll}
                      </div>
                    </div>
                  )}
                  <MenuItem 
                    label="Roll Oracle"
                    onClick={() => rollOracle(oracleKey, oracleTable)}
                    isButton={true}
                  />
                </MenuGroup>
                
                <MenuGroup>
                  <MenuItem 
                    icon="📋"
                    label="View Oracle Table"
                    onClick={() => navigate(`oracle-table-${catIndex}-${oracleIndex}`)}
                  />
                </MenuGroup>
              </>
            )}
          </NavigationView>
        );
      }
    }

    // Oracle Details (from sub-category) - exclude deep and table URLs
    if (viewName.startsWith('oracle-detail-') && !viewName.startsWith('oracle-detail-deep-') && !viewName.startsWith('oracle-detail-table-') && starforgedData) {
      const parts = viewName.split('-');
      const catIndex = parseInt(parts[2]);
      const subIndex = parseInt(parts[3]);
      const oracleIndex = parseInt(parts[4]);
      const subCategory = starforgedData.oracleCategories[catIndex]?.Categories?.[subIndex];
      const oracle = subCategory?.Oracles?.[oracleIndex];
      const oracleKey = `oracle-detail-${catIndex}-${subIndex}-${oracleIndex}`;
      const rolledResult = oracleRolls[oracleKey];
      const oracleTable = getOracleTable(oracle);
      
      if (oracle) {
        return (
          <NavigationView title={oracle.Name} onBack={goBack}>
            <DetailCard
              icon={getOracleIcon(subCategory.Name)}
              title={oracle.Name}
              description={oracle.Description || 'Roll to consult this oracle.'}
            />
            
            {oracleTable && (
              <>
                <MenuGroup>
                  {rolledResult && (
                    <div style={{ padding: '16px', borderBottom: '0.5px solid #38383a' }}>
                      <div style={{ fontSize: '17px', fontWeight: '600', color: '#ffffff', marginBottom: '4px' }}>
                        {rolledResult.result}
                      </div>
                      <div style={{ fontSize: '13px', color: '#8e8e93' }}>
                        Rolled: {rolledResult.roll}
                      </div>
                    </div>
                  )}
                  <MenuItem 
                    label="Roll Oracle"
                    onClick={() => rollOracle(oracleKey, oracleTable)}
                    isButton={true}
                  />
                </MenuGroup>
                
                <MenuGroup>
                  <MenuItem 
                    icon="📋"
                    label="View Oracle Table"
                    onClick={() => navigate(`oracle-detail-table-${catIndex}-${subIndex}-${oracleIndex}`)}
                  />
                </MenuGroup>
              </>
            )}
          </NavigationView>
        );
      }
    }

    // Oracle Details (deeply nested - from sub-sub-category) - exclude table URLs
    if (viewName.startsWith('oracle-detail-deep-') && !viewName.startsWith('oracle-detail-deep-table-') && starforgedData) {
      const parts = viewName.split('-');
      const catIndex = parseInt(parts[3]);
      const subIndex = parseInt(parts[4]);
      const subSubIndex = parseInt(parts[5]);
      const oracleIndex = parseInt(parts[6]);
      const subSubCategory = starforgedData.oracleCategories[catIndex]?.Categories?.[subIndex]?.Categories?.[subSubIndex];
      const oracle = subSubCategory?.Oracles?.[oracleIndex];
      const oracleKey = `oracle-detail-deep-${catIndex}-${subIndex}-${subSubIndex}-${oracleIndex}`;
      const rolledResult = oracleRolls[oracleKey];
      const oracleTable = getOracleTable(oracle);
      
      if (oracle) {
        return (
          <NavigationView title={oracle.Name} onBack={goBack}>
            <DetailCard
              icon={getOracleIcon(subSubCategory.Name)}
              title={oracle.Name}
              description={oracle.Description || 'Roll to consult this oracle.'}
            />
            
            {oracleTable && (
              <>
                <MenuGroup>
                  {rolledResult && (
                    <div style={{ padding: '16px', borderBottom: '0.5px solid #38383a' }}>
                      <div style={{ fontSize: '17px', fontWeight: '600', color: '#ffffff', marginBottom: '4px' }}>
                        {rolledResult.result}
                      </div>
                      <div style={{ fontSize: '13px', color: '#8e8e93' }}>
                        Rolled: {rolledResult.roll}
                      </div>
                    </div>
                  )}
                  <MenuItem 
                    label="Roll Oracle"
                    onClick={() => rollOracle(oracleKey, oracleTable)}
                    isButton={true}
                  />
                </MenuGroup>
                
                <MenuGroup>
                  <MenuItem 
                    icon="📋"
                    label="View Oracle Table"
                    onClick={() => navigate(`oracle-detail-deep-table-${catIndex}-${subIndex}-${subSubIndex}-${oracleIndex}`)}
                  />
                </MenuGroup>
              </>
            )}
          </NavigationView>
        );
      }
    }

    // Oracle Table (direct from category)
    if (viewName.startsWith('oracle-table-') && viewName.split('-').length === 4 && starforgedData) {
      const parts = viewName.split('-');
      const catIndex = parseInt(parts[2]);
      const oracleIndex = parseInt(parts[3]);
      const category = starforgedData.oracleCategories[catIndex];
      const oracle = category?.Oracles?.[oracleIndex];
      const oracleTable = getOracleTable(oracle);
      
      if (oracleTable) {
        return (
          <NavigationView title={`${oracle.Name} - Table`} onBack={goBack}>
            <MenuGroup title="Oracle Table">
              {oracleTable.map((row, rowIndex) => (
                <MenuItem 
                  key={rowIndex}
                  icon="🎲"
                  label={row.Result}
                  value={`${row.Floor || row.Chance}-${row.Ceiling || ''}`}
                  showChevron={false}
                />
              ))}
            </MenuGroup>
          </NavigationView>
        );
      }
    }

    // Oracle Table (from sub-category) - exclude deep URLs
    if (viewName.startsWith('oracle-detail-table-') && !viewName.startsWith('oracle-detail-deep-table-') && starforgedData) {
      const parts = viewName.split('-');
      const catIndex = parseInt(parts[3]);
      const subIndex = parseInt(parts[4]);
      const oracleIndex = parseInt(parts[5]);
      const subCategory = starforgedData.oracleCategories[catIndex]?.Categories?.[subIndex];
      const oracle = subCategory?.Oracles?.[oracleIndex];
      const oracleTable = getOracleTable(oracle);
      
      if (oracleTable) {
        return (
          <NavigationView title={`${oracle.Name} - Table`} onBack={goBack}>
            <MenuGroup title="Oracle Table">
              {oracleTable.map((row, rowIndex) => (
                <MenuItem 
                  key={rowIndex}
                  icon="🎲"
                  label={row.Result}
                  value={`${row.Floor || row.Chance}-${row.Ceiling || ''}`}
                  showChevron={false}
                />
              ))}
            </MenuGroup>
          </NavigationView>
        );
      }
    }

    // Oracle Table (deeply nested - from sub-sub-category)
    if (viewName.startsWith('oracle-detail-deep-table-') && starforgedData) {
      const parts = viewName.split('-');
      const catIndex = parseInt(parts[4]);
      const subIndex = parseInt(parts[5]);
      const subSubIndex = parseInt(parts[6]);
      const oracleIndex = parseInt(parts[7]);
      const subSubCategory = starforgedData.oracleCategories[catIndex]?.Categories?.[subIndex]?.Categories?.[subSubIndex];
      const oracle = subSubCategory?.Oracles?.[oracleIndex];
      const oracleTable = getOracleTable(oracle);
      
      if (oracleTable) {
        return (
          <NavigationView title={`${oracle.Name} - Table`} onBack={goBack}>
            <MenuGroup title="Oracle Table">
              {oracleTable.map((row, rowIndex) => (
                <MenuItem 
                  key={rowIndex}
                  icon="🎲"
                  label={row.Result}
                  value={`${row.Floor || row.Chance}-${row.Ceiling || ''}`}
                  showChevron={false}
                />
              ))}
            </MenuGroup>
          </NavigationView>
        );
      }
    }

    // PROGRESS TRACK VIEWS
    
    // Vows List
    if (viewName === 'vows') {
      return (
        <NavigationView title="Vows" onBack={goBack}>
          {character.vows.length === 0 ? (
            <MenuGroup>
              <MenuItem 
                icon="📋" 
                label="No vows yet" 
                showChevron={false}
              />
            </MenuGroup>
          ) : (
            <MenuGroup>
              {character.vows.map(vow => (
                <MenuItem 
                  key={vow.id}
                  icon="🎯"
                  label={vow.name}
                  value={`${RANK_LABELS[vow.rank]} • ${Math.floor(vow.ticks / 4)}/10`}
                  onClick={() => navigate(`vow-${vow.id}`)}
                />
              ))}
            </MenuGroup>
          )}
          <MenuGroup>
            <MenuItem 
              label="Swear an Iron Vow"
              onClick={() => navigate('add-vow')}
              isButton={true}
            />
          </MenuGroup>
        </NavigationView>
      );
    }

    // Add Vow
    if (viewName === 'add-vow') {
      return (
        <NavigationView title="Swear an Iron Vow" onBack={goBack}>
          <MenuGroup title="Vow Details">
            <div style={{ padding: '12px 16px' }}>
              <input
                type="text"
                className="character-name-input"
                style={{ marginBottom: '12px' }}
                value={newTrackName}
                onChange={(e) => setNewTrackName(e.target.value)}
                placeholder="What do you vow to do?"
              />
              <select
                className="rank-select"
                value={newTrackRank}
                onChange={(e) => setNewTrackRank(e.target.value)}
              >
                {Object.entries(RANK_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>
          </MenuGroup>
          <MenuGroup>
            <MenuItem 
              label="Swear this Vow"
              onClick={() => addProgressTrack('vows')}
              isButton={true}
            />
          </MenuGroup>
        </NavigationView>
      );
    }

    // Individual Vow
    if (viewName.startsWith('vow-')) {
      const vowId = parseInt(viewName.split('-')[1]);
      const vow = character.vows.find(v => v.id === vowId);
      
      if (vow) {
        return (
          <NavigationView title={vow.name} onBack={goBack}>
            <MenuGroup>
              <div style={{ padding: '12px 16px' }}>
                <ProgressTrack
                  name={vow.name}
                  rank={vow.rank}
                  ticks={vow.ticks}
                  onMarkProgress={() => markProgress('vows', vow.id)}
                  onClearProgress={() => clearProgress('vows', vow.id)}
                />
              </div>
            </MenuGroup>
            <MenuGroup>
              <MenuItem 
                label="Fulfill Your Vow"
                onClick={() => navigate(`fulfill-vow-${vow.id}`)}
                isButton={true}
              />
              <MenuItem 
                label="Forsake Your Vow"
                onClick={() => removeProgressTrack('vows', vow.id)}
                isButton={true}
                destructive={true}
              />
            </MenuGroup>
          </NavigationView>
        );
      }
    }

    // Fulfill Vow (progress roll info)
    if (viewName.startsWith('fulfill-vow-')) {
      const vowId = parseInt(viewName.split('-')[2]);
      const vow = character.vows.find(v => v.id === vowId);
      
      if (vow) {
        const progressScore = Math.floor(vow.ticks / 4);
        return (
          <NavigationView title="Fulfill Your Vow" onBack={goBack}>
            <DetailCard
              icon="🎯"
              title={vow.name}
              description={`Progress Score: ${progressScore}\n\nRoll your challenge dice and compare to your progress score of ${progressScore}.\n\n• Strong Hit: Beat both dice\n• Weak Hit: Beat one die\n• Miss: Beat neither die`}
            />
            <MenuGroup>
              <MenuItem 
                label="Vow Complete - Remove"
                onClick={() => removeProgressTrack('vows', vow.id)}
                isButton={true}
              />
            </MenuGroup>
          </NavigationView>
        );
      }
    }

    // Expeditions List
    if (viewName === 'expeditions') {
      return (
        <NavigationView title="Expeditions" onBack={goBack}>
          {character.expeditions.length === 0 ? (
            <MenuGroup>
              <MenuItem 
                icon="📋" 
                label="No expeditions yet" 
                showChevron={false}
              />
            </MenuGroup>
          ) : (
            <MenuGroup>
              {character.expeditions.map(exp => (
                <MenuItem 
                  key={exp.id}
                  icon="🗺️"
                  label={exp.name}
                  value={`${RANK_LABELS[exp.rank]} • ${Math.floor(exp.ticks / 4)}/10`}
                  onClick={() => navigate(`expedition-${exp.id}`)}
                />
              ))}
            </MenuGroup>
          )}
          <MenuGroup>
            <MenuItem 
              label="Undertake an Expedition"
              onClick={() => navigate('add-expedition')}
              isButton={true}
            />
          </MenuGroup>
        </NavigationView>
      );
    }

    // Add Expedition
    if (viewName === 'add-expedition') {
      return (
        <NavigationView title="Undertake an Expedition" onBack={goBack}>
          <MenuGroup title="Expedition Details">
            <div style={{ padding: '12px 16px' }}>
              <input
                type="text"
                className="character-name-input"
                style={{ marginBottom: '12px' }}
                value={newTrackName}
                onChange={(e) => setNewTrackName(e.target.value)}
                placeholder="Where are you going?"
              />
              <select
                className="rank-select"
                value={newTrackRank}
                onChange={(e) => setNewTrackRank(e.target.value)}
              >
                {Object.entries(RANK_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>
          </MenuGroup>
          <MenuGroup>
            <MenuItem 
              label="Begin Expedition"
              onClick={() => addProgressTrack('expeditions')}
              isButton={true}
            />
          </MenuGroup>
        </NavigationView>
      );
    }

    // Individual Expedition
    if (viewName.startsWith('expedition-')) {
      const expId = parseInt(viewName.split('-')[1]);
      const expedition = character.expeditions.find(e => e.id === expId);
      
      if (expedition) {
        return (
          <NavigationView title={expedition.name} onBack={goBack}>
            <MenuGroup>
              <div style={{ padding: '12px 16px' }}>
                <ProgressTrack
                  name={expedition.name}
                  rank={expedition.rank}
                  ticks={expedition.ticks}
                  onMarkProgress={() => markProgress('expeditions', expedition.id)}
                  onClearProgress={() => clearProgress('expeditions', expedition.id)}
                />
              </div>
            </MenuGroup>
            <MenuGroup>
              <MenuItem 
                label="Finish an Expedition"
                onClick={() => navigate(`finish-expedition-${expedition.id}`)}
                isButton={true}
              />
              <MenuItem 
                label="Abandon Expedition"
                onClick={() => removeProgressTrack('expeditions', expedition.id)}
                isButton={true}
                destructive={true}
              />
            </MenuGroup>
          </NavigationView>
        );
      }
    }

    // Finish Expedition
    if (viewName.startsWith('finish-expedition-')) {
      const expId = parseInt(viewName.split('-')[2]);
      const expedition = character.expeditions.find(e => e.id === expId);
      
      if (expedition) {
        const progressScore = Math.floor(expedition.ticks / 4);
        return (
          <NavigationView title="Finish an Expedition" onBack={goBack}>
            <DetailCard
              icon="🗺️"
              title={expedition.name}
              description={`Progress Score: ${progressScore}\n\nRoll your challenge dice and compare to your progress score of ${progressScore}.\n\n• Strong Hit: Beat both dice\n• Weak Hit: Beat one die\n• Miss: Beat neither die`}
            />
            <MenuGroup>
              <MenuItem 
                label="Expedition Complete - Remove"
                onClick={() => removeProgressTrack('expeditions', expedition.id)}
                isButton={true}
              />
            </MenuGroup>
          </NavigationView>
        );
      }
    }

    // Combat Tracks List
    if (viewName === 'combat-tracks') {
      return (
        <NavigationView title="Combat Tracks" onBack={goBack}>
          {character.combatTracks.length === 0 ? (
            <MenuGroup>
              <MenuItem 
                icon="📋" 
                label="No active combat" 
                showChevron={false}
              />
            </MenuGroup>
          ) : (
            <MenuGroup>
              {character.combatTracks.map(combat => (
                <MenuItem 
                  key={combat.id}
                  icon="⚔️"
                  label={combat.name}
                  value={`${RANK_LABELS[combat.rank]} • ${Math.floor(combat.ticks / 4)}/10`}
                  onClick={() => navigate(`combat-${combat.id}`)}
                />
              ))}
            </MenuGroup>
          )}
          <MenuGroup>
            <MenuItem 
              label="Enter the Fray"
              onClick={() => navigate('add-combat')}
              isButton={true}
            />
          </MenuGroup>
        </NavigationView>
      );
    }

    // Add Combat Track
    if (viewName === 'add-combat') {
      return (
        <NavigationView title="Enter the Fray" onBack={goBack}>
          <MenuGroup title="Combat Details">
            <div style={{ padding: '12px 16px' }}>
              <input
                type="text"
                className="character-name-input"
                style={{ marginBottom: '12px' }}
                value={newTrackName}
                onChange={(e) => setNewTrackName(e.target.value)}
                placeholder="What is your objective?"
              />
              <select
                className="rank-select"
                value={newTrackRank}
                onChange={(e) => setNewTrackRank(e.target.value)}
              >
                {Object.entries(RANK_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>
          </MenuGroup>
          <MenuGroup>
            <MenuItem 
              label="Begin Combat"
              onClick={() => addProgressTrack('combatTracks')}
              isButton={true}
            />
          </MenuGroup>
        </NavigationView>
      );
    }

    // Individual Combat Track
    if (viewName.startsWith('combat-')) {
      const combatId = parseInt(viewName.split('-')[1]);
      const combat = character.combatTracks.find(c => c.id === combatId);
      
      if (combat) {
        return (
          <NavigationView title={combat.name} onBack={goBack}>
            <MenuGroup>
              <div style={{ padding: '12px 16px' }}>
                <ProgressTrack
                  name={combat.name}
                  rank={combat.rank}
                  ticks={combat.ticks}
                  onMarkProgress={() => markProgress('combatTracks', combat.id)}
                  onClearProgress={() => clearProgress('combatTracks', combat.id)}
                />
              </div>
            </MenuGroup>
            <MenuGroup>
              <MenuItem 
                label="Take Decisive Action"
                onClick={() => navigate(`decisive-action-${combat.id}`)}
                isButton={true}
              />
              <MenuItem 
                label="End Combat"
                onClick={() => removeProgressTrack('combatTracks', combat.id)}
                isButton={true}
                destructive={true}
              />
            </MenuGroup>
          </NavigationView>
        );
      }
    }

    // Take Decisive Action
    if (viewName.startsWith('decisive-action-')) {
      const combatId = parseInt(viewName.split('-')[2]);
      const combat = character.combatTracks.find(c => c.id === combatId);
      
      if (combat) {
        const progressScore = Math.floor(combat.ticks / 4);
        return (
          <NavigationView title="Take Decisive Action" onBack={goBack}>
            <DetailCard
              icon="⚔️"
              title={combat.name}
              description={`Progress Score: ${progressScore}\n\nRoll your challenge dice and compare to your progress score of ${progressScore}.\n\n• Strong Hit: Beat both dice\n• Weak Hit: Beat one die\n• Miss: Beat neither die`}
            />
            <MenuGroup>
              <MenuItem 
                label="Victory - Remove Combat"
                onClick={() => removeProgressTrack('combatTracks', combat.id)}
                isButton={true}
              />
            </MenuGroup>
          </NavigationView>
        );
      }
    }

    // All other views show a simple placeholder
    return (
      <NavigationView title={viewName.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} onBack={goBack}>
        <MenuGroup>
          <MenuItem 
            icon="📄" 
            label="Content coming soon"
            showChevron={false}
          />
        </MenuGroup>
      </NavigationView>
    );
  };

  return (
    <div className="app">
      <div className="app-content">
        {isTransitioning && previousView && (
          <div 
            className={`view-container ${direction === 'forward' ? 'slide-out-left' : 'slide-out-right'}`}
            key={`prev-${previousView}`}
          >
            {renderViewContent(previousView)}
          </div>
        )}
        
        <div 
          className={`view-container ${isTransitioning ? (direction === 'forward' ? 'slide-in-right' : 'slide-in-left') : ''}`}
          key={currentView}
        >
          {renderViewContent(currentView)}
        </div>
      </div>
      
      <TabBar activeTab={activeTab} onTabChange={handleTabChange} />
    </div>
  );
}

// Helper functions for icons
function getAssetIcon(assetTypeName) {
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

function getMoveIcon(categoryName) {
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

function getOracleIcon(categoryName) {
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

export default App;
