import { useEffect, useRef } from 'react';
import { NavigationView } from './components/NavigationView';
import { MenuGroup } from './components/MenuGroup';
import { MenuItem } from './components/MenuItem';
import { TabBar } from './components/TabBar';
import { StarforgedProvider, useStarforgedContext } from './contexts/StarforgedContext';
import { CharacterProvider, useCharacterContext } from './contexts/CharacterContext';
import { NavigationProvider, useNavigationContext } from './contexts/NavigationContext';
import { OracleProvider } from './contexts/OracleContext';
import { RollProvider } from './contexts/RollContext';
import { FavoritesProvider } from './contexts/FavoritesContext';
import { ExploreProvider, useExploreContext } from './contexts/ExploreContext';
import { ExploreTab } from './views/ExploreTab/ExploreTab';
import { CharacterTab } from './views/CharacterTab/CharacterTab';
import { TracksTab } from './views/TracksTab/TracksTab';
import { MovesTab } from './views/MovesTab/MovesTab';
import { OracleTab } from './views/OracleTab/OracleTab';
import { RollTab } from './views/RollTab/RollTab';
import { getGenericIconBg } from './utils/icons';
import { generateCharacterName, generateStarshipName } from './utils/oracleRollers';
import { REGIONS } from './constants';
import './App.css';
import './styles/animations.css';

// Inner component that uses contexts
function AppContent() {
  const { data: starforgedData, loading } = useStarforgedContext();
  const { character, updateName, updateAssetInput, addMultipleAssets } = useCharacterContext();
  const { activeTab, direction, previousView, isTransitioning, currentView, handleTabChange, updateScrollPosition, getScrollPosition } = useNavigationContext();
  const { sectors, createAndPopulateSector } = useExploreContext();

  // Generate random character name on initial load when data is available and name is empty
  useEffect(() => {
    if (starforgedData && !loading && !character.name) {
      const randomName = generateCharacterName(starforgedData);
      if (randomName) {
        updateName(randomName);
      }
    }
  }, [starforgedData, loading, character.name, updateName]);

  // Generate random starship name for default Command Vehicle asset on initial load
  const starshipInitialized = useRef(false);
  useEffect(() => {
    if (starforgedData && !loading && !starshipInitialized.current) {
      const defaultAsset = character.assets.find(a => a.typeIndex === 0 && a.assetIndex === 0);
      if (defaultAsset && !defaultAsset.inputs?.Name) {
        starshipInitialized.current = true;
        const starshipName = generateStarshipName(starforgedData);
        if (starshipName) {
          updateAssetInput(0, 0, 'Name', starshipName);
        }
      }
    }
  }, [starforgedData, loading, character.assets, updateAssetInput]);

  // Add two random Path assets on initial character creation
  const pathAssetsInitialized = useRef(false);
  useEffect(() => {
    if (starforgedData && !loading && !pathAssetsInitialized.current) {
      // Find the Path asset type index
      const pathTypeIndex = starforgedData.assetTypes.findIndex(
        type => type.Name === 'Path'
      );
      
      if (pathTypeIndex !== -1) {
        const pathAssetType = starforgedData.assetTypes[pathTypeIndex];
        const pathAssets = pathAssetType.Assets || [];
        
        // Check if character already has any Path assets
        const hasPathAssets = character.assets.some(a => a.typeIndex === pathTypeIndex);
        
        if (!hasPathAssets && pathAssets.length >= 2) {
          pathAssetsInitialized.current = true;
          
          // Pick two random unique Path assets
          const shuffled = [...Array(pathAssets.length).keys()]
            .sort(() => Math.random() - 0.5);
          const randomIndices = shuffled.slice(0, 2);
          
          addMultipleAssets(randomIndices.map(assetIndex => ({
            typeIndex: pathTypeIndex,
            assetIndex
          })));
        }
      }
    }
  }, [starforgedData, loading, character.assets, addMultipleAssets]);

  // Generate a starting sector in a random region (Terminus, Outlands, or Expanse) on initial game start
  const sectorInitialized = useRef(false);
  useEffect(() => {
    if (starforgedData && !loading && !sectorInitialized.current && sectors.length === 0) {
      sectorInitialized.current = true;
      // Randomly select from the three starting regions (never Void)
      const startingRegions = [REGIONS.TERMINUS, REGIONS.OUTLANDS, REGIONS.EXPANSE];
      const randomRegion = startingRegions[Math.floor(Math.random() * startingRegions.length)];
      createAndPopulateSector(starforgedData, randomRegion);
    }
  }, [starforgedData, loading, sectors.length, createAndPopulateSector]);

  const renderViewContent = (viewName, scrollProps) => {
    if (loading) {
      return (
        <NavigationView title="Loading..." {...scrollProps}>
          <MenuGroup>
            <MenuItem icon="⏳" iconBg={getGenericIconBg('⏳')} label="Loading Starforged data..." showChevron={false} />
          </MenuGroup>
        </NavigationView>
      );
    }

    // Tab views now use contexts internally
    if (activeTab === 'explore') {
      return <ExploreTab viewName={viewName} scrollProps={scrollProps} />;
    }

    if (activeTab === 'character') {
      return <CharacterTab viewName={viewName} scrollProps={scrollProps} />;
    }

    if (activeTab === 'tracks') {
      return <TracksTab viewName={viewName} scrollProps={scrollProps} />;
    }

    if (activeTab === 'moves') {
      return <MovesTab viewName={viewName} scrollProps={scrollProps} />;
    }

    if (activeTab === 'oracle') {
      return <OracleTab viewName={viewName} scrollProps={scrollProps} />;
    }

    if (activeTab === 'roll') {
      return <RollTab viewName={viewName} scrollProps={scrollProps} />;
    }

    // Fallback for unhandled views
    return (
      <NavigationView title={viewName.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} {...scrollProps}>
        <MenuGroup>
          <MenuItem 
            label="Content coming soon"
            showChevron={false}
            muted={true}
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
            {renderViewContent(previousView, {
              scrollPosition: getScrollPosition(previousView),
              viewKey: `${activeTab}-${previousView}`
            })}
          </div>
        )}
        
        <div 
          className={`view-container ${isTransitioning ? (direction === 'forward' ? 'slide-in-right' : 'slide-in-left') : ''}`}
          key={currentView}
        >
          {renderViewContent(currentView, {
            scrollPosition: getScrollPosition(currentView),
            onScrollChange: updateScrollPosition,
            viewKey: `${activeTab}-${currentView}`
          })}
        </div>
      </div>
      
      <TabBar activeTab={activeTab} onTabChange={handleTabChange} />
    </div>
  );
}

// Main App component with all providers
function App() {
  return (
    <StarforgedProvider>
      <CharacterProvider>
        <NavigationProvider>
          <OracleProvider>
            <RollProvider>
              <FavoritesProvider>
                <ExploreProvider>
                  <AppContent />
                </ExploreProvider>
              </FavoritesProvider>
            </RollProvider>
          </OracleProvider>
        </NavigationProvider>
      </CharacterProvider>
    </StarforgedProvider>
  );
}

export default App;
