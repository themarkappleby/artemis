import { useState, useEffect } from 'react';
import { NavigationView } from './components/NavigationView';
import { MenuGroup } from './components/MenuGroup';
import { MenuItem } from './components/MenuItem';
import { DetailCard } from './components/DetailCard';
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
  
  const { data: starforgedData, loading } = useStarforged();

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
    
    setOracleRolls({
      ...oracleRolls,
      [oracleKey]: {
        roll,
        result: result?.Result || 'No result found'
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

          <MenuGroup title="Game Setup">
            <MenuItem 
              icon="🌌" 
              label="Setting Truths" 
              onClick={() => navigate('setting-truths')}
            />
            <MenuItem 
              icon="🎯" 
              label="Character Creation" 
              onClick={() => navigate('character-creation')}
            />
          </MenuGroup>

          <MenuGroup title="Encounters">
            <MenuItem 
              icon="👾" 
              label="Creatures" 
              onClick={() => navigate('encounters-creatures')}
            />
            <MenuItem 
              icon="🚀" 
              label="Starships" 
              onClick={() => navigate('encounters-starships')}
            />
          </MenuGroup>

          <MenuGroup title="Tools">
            <MenuItem 
              icon="⚙️" 
              label="Dice Roller" 
              onClick={() => navigate('dice-roller')}
            />
            <MenuItem 
              icon="📊" 
              label="Progress Tracks" 
              onClick={() => navigate('progress-tracks')}
            />
          </MenuGroup>
        </NavigationView>
      );
    }

    // Setting Truths
    if (viewName === 'setting-truths' && starforgedData) {
      return (
        <NavigationView title="Setting Truths" onBack={goBack}>
          <MenuGroup>
            {starforgedData.settingTruths.map((truth, index) => (
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
          <MenuGroup>
            <MenuItem 
              icon="👤" 
              label="Character Sheet" 
              onClick={() => navigate('character-sheet')}
            />
            <MenuItem 
              icon="💪" 
              label="Stats & Conditions" 
              onClick={() => navigate('stats-conditions')}
            />
          </MenuGroup>

          <MenuGroup title="Assets">
            {starforgedData?.assetTypes.map((assetType, index) => (
              <MenuItem 
                key={assetType['$id'] || index}
                icon={getAssetIcon(assetType.Name)}
                label={assetType.Name}
                onClick={() => navigate(`asset-type-${index}`)}
              />
            ))}
          </MenuGroup>

          <MenuGroup title="Progress">
            <MenuItem 
              icon="🎯" 
              label="Vows" 
              onClick={() => navigate('vows')}
            />
            <MenuItem 
              icon="🗺️" 
              label="Expeditions" 
              onClick={() => navigate('expeditions')}
            />
            <MenuItem 
              icon="⚔️" 
              label="Combat Tracks" 
              onClick={() => navigate('combat-tracks')}
            />
          </MenuGroup>
        </NavigationView>
      );
    }

    // Asset Type Details
    if (viewName.startsWith('asset-type-') && starforgedData) {
      const index = parseInt(viewName.split('-')[2]);
      const assetType = starforgedData.assetTypes[index];
      
      if (assetType) {
        return (
          <NavigationView title={assetType.Name} onBack={goBack}>
            <MenuGroup>
              {assetType.Assets?.map((asset, assetIndex) => (
                <MenuItem 
                  key={asset['$id'] || assetIndex}
                  icon={getAssetIcon(assetType.Name)}
                  label={asset.Name}
                  onClick={() => navigate(`asset-${index}-${assetIndex}`)}
                />
              )) || <MenuItem icon="📄" label="No assets available" showChevron={false} />}
            </MenuGroup>
          </NavigationView>
        );
      }
    }

    // Individual Asset Details
    if (viewName.startsWith('asset-') && viewName.split('-').length === 3 && starforgedData) {
      const [, typeIndex, assetIndex] = viewName.split('-').map(Number);
      const assetType = starforgedData.assetTypes[typeIndex];
      const asset = assetType?.Assets?.[assetIndex];
      
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
                    icon={ability.Enabled ? "✅" : "⭕"}
                    label={ability.Name || `Ability ${abilityIndex + 1}`}
                    onClick={() => navigate(`asset-ability-${typeIndex}-${assetIndex}-${abilityIndex}`)}
                  />
                ))}
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
          </NavigationView>
        );
      }
    }

    // Asset Ability Details
    if (viewName.startsWith('asset-ability-') && starforgedData) {
      const parts = viewName.split('-');
      const typeIndex = parseInt(parts[2]);
      const assetIndex = parseInt(parts[3]);
      const abilityIndex = parseInt(parts[4]);
      const assetType = starforgedData.assetTypes[typeIndex];
      const asset = assetType?.Assets?.[assetIndex];
      const ability = asset?.Abilities?.[abilityIndex];
      
      if (ability) {
        return (
          <NavigationView title={ability.Name || 'Ability'} onBack={goBack}>
            <DetailCard
              icon={getAssetIcon(assetType.Name)}
              title={ability.Name || 'Ability'}
              description={ability.Text || 'No description available.'}
            />
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
      
      if (oracle) {
        return (
          <NavigationView title={oracle.Name} onBack={goBack}>
            <DetailCard
              icon={getOracleIcon(category.Name)}
              title={oracle.Name}
              description={oracle.Description || 'Roll to consult this oracle.'}
            />
            
            {oracle.Table && oracle.Table.length > 0 && (
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
                    onClick={() => rollOracle(oracleKey, oracle.Table)}
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

    // Oracle Details (from sub-category)
    if (viewName.startsWith('oracle-detail-') && !viewName.includes('table') && starforgedData) {
      const parts = viewName.split('-');
      const catIndex = parseInt(parts[2]);
      const subIndex = parseInt(parts[3]);
      const oracleIndex = parseInt(parts[4]);
      const subCategory = starforgedData.oracleCategories[catIndex]?.Categories?.[subIndex];
      const oracle = subCategory?.Oracles?.[oracleIndex];
      const oracleKey = `oracle-detail-${catIndex}-${subIndex}-${oracleIndex}`;
      const rolledResult = oracleRolls[oracleKey];
      
      if (oracle) {
        return (
          <NavigationView title={oracle.Name} onBack={goBack}>
            <DetailCard
              icon={getOracleIcon(subCategory.Name)}
              title={oracle.Name}
              description={oracle.Description || 'Roll to consult this oracle.'}
            />
            
            {oracle.Table && oracle.Table.length > 0 && (
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
                    onClick={() => rollOracle(oracleKey, oracle.Table)}
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

    // Oracle Details (deeply nested - from sub-sub-category)
    if (viewName.startsWith('oracle-detail-deep-') && !viewName.includes('table') && starforgedData) {
      const parts = viewName.split('-');
      const catIndex = parseInt(parts[3]);
      const subIndex = parseInt(parts[4]);
      const subSubIndex = parseInt(parts[5]);
      const oracleIndex = parseInt(parts[6]);
      const subSubCategory = starforgedData.oracleCategories[catIndex]?.Categories?.[subIndex]?.Categories?.[subSubIndex];
      const oracle = subSubCategory?.Oracles?.[oracleIndex];
      const oracleKey = `oracle-detail-deep-${catIndex}-${subIndex}-${subSubIndex}-${oracleIndex}`;
      const rolledResult = oracleRolls[oracleKey];
      
      if (oracle) {
        return (
          <NavigationView title={oracle.Name} onBack={goBack}>
            <DetailCard
              icon={getOracleIcon(subSubCategory.Name)}
              title={oracle.Name}
              description={oracle.Description || 'Roll to consult this oracle.'}
            />
            
            {oracle.Table && oracle.Table.length > 0 && (
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
                    onClick={() => rollOracle(oracleKey, oracle.Table)}
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
      
      if (oracle?.Table) {
        return (
          <NavigationView title={`${oracle.Name} - Table`} onBack={goBack}>
            <MenuGroup title="Oracle Table">
              {oracle.Table.map((row, rowIndex) => (
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

    // Oracle Table (from sub-category)
    if (viewName.startsWith('oracle-detail-table-') && starforgedData) {
      const parts = viewName.split('-');
      const catIndex = parseInt(parts[3]);
      const subIndex = parseInt(parts[4]);
      const oracleIndex = parseInt(parts[5]);
      const subCategory = starforgedData.oracleCategories[catIndex]?.Categories?.[subIndex];
      const oracle = subCategory?.Oracles?.[oracleIndex];
      
      if (oracle?.Table) {
        return (
          <NavigationView title={`${oracle.Name} - Table`} onBack={goBack}>
            <MenuGroup title="Oracle Table">
              {oracle.Table.map((row, rowIndex) => (
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
      
      if (oracle?.Table) {
        return (
          <NavigationView title={`${oracle.Name} - Table`} onBack={goBack}>
            <MenuGroup title="Oracle Table">
              {oracle.Table.map((row, rowIndex) => (
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
