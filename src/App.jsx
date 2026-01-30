import { useEffect, useRef } from 'react';
import { NavigationView } from './components/NavigationView';
import { MenuGroup } from './components/MenuGroup';
import { MenuItem } from './components/MenuItem';
import { TabBar } from './components/TabBar';
import { useStarforged } from './hooks/useStarforged';
import { useCharacter } from './hooks/useCharacter';
import { useNavigation } from './hooks/useNavigation';
import { useOracle } from './hooks/useOracle';
import { useRoll } from './hooks/useRoll';
import { useFavoriteMoves } from './hooks/useFavoriteMoves';
import { useFavoriteOracles } from './hooks/useFavoriteOracles';
import { useExplore } from './hooks/useExplore';
import { ExploreTab } from './views/ExploreTab/ExploreTab';
import { CharacterTab } from './views/CharacterTab/CharacterTab';
import { MovesTab } from './views/MovesTab/MovesTab';
import { OracleTab } from './views/OracleTab/OracleTab';
import { RollTab } from './views/RollTab/RollTab';
import { getGenericIconBg } from './utils/icons';
import './App.css';
import './styles/animations.css';

// Helper to get oracle category by name
const getOracleCategory = (starforgedData, categoryName) => {
  if (!starforgedData?.oracleCategories) return null;
  return starforgedData.oracleCategories.find(c => c.Name === categoryName);
};

// Helper to get oracle from category (with flexible matching)
const getOracleFromCategory = (category, oracleName) => {
  if (!category?.Oracles) return null;
  return category.Oracles.find(o => 
    o.Name === oracleName || 
    o.Name.toLowerCase().includes(oracleName.toLowerCase())
  );
};

// Helper to filter valid oracle rows
const filterValidRows = (table) => {
  if (!table) return null;
  return table.filter(row => {
    const hasFloorCeiling = row.Floor !== undefined && row.Floor !== null && 
                            row.Ceiling !== undefined && row.Ceiling !== null;
    const hasChance = row.Chance !== undefined && row.Chance !== null;
    return hasFloorCeiling || hasChance;
  });
};

// Helper to roll on an oracle table
const rollOnTable = (table) => {
  const validTable = filterValidRows(table);
  if (!validTable || validTable.length === 0) return null;
  const roll = Math.floor(Math.random() * 100) + 1;
  const result = validTable.find(row => {
    const floor = row.Floor || row.Chance || 1;
    const ceiling = row.Ceiling || row.Chance || 100;
    return roll >= floor && roll <= ceiling;
  });
  return result?.Result || null;
};

// Get character oracle (handles nested Name oracle structure)
const getCharacterOracle = (starforgedData, oracleName) => {
  const category = getOracleCategory(starforgedData, 'Characters');
  if (!category) return null;
  
  let oracle = getOracleFromCategory(category, oracleName);
  if (oracle) return oracle;
  
  // Check nested Name oracle
  const nameOracle = getOracleFromCategory(category, 'Name');
  if (nameOracle?.Oracles) {
    oracle = nameOracle.Oracles.find(o => 
      o.Name === oracleName || 
      o.Name.toLowerCase().includes(oracleName.toLowerCase())
    );
    if (oracle) return oracle;
  }
  
  return null;
};

// Roll on character oracle
const rollCharacterOracle = (starforgedData, oracleName) => {
  const oracle = getCharacterOracle(starforgedData, oracleName);
  if (!oracle?.Table) return null;
  return rollOnTable(oracle.Table);
};

// Helper to generate a random character name from oracle tables
const generateRandomCharacterName = (starforgedData) => {
  const givenName = rollCharacterOracle(starforgedData, 'Given Name');
  const familyName = rollCharacterOracle(starforgedData, 'Family Name');
  const callsign = rollCharacterOracle(starforgedData, 'Callsign');
  
  if (givenName && callsign && familyName) {
    return `${givenName} "${callsign}" ${familyName}`;
  } else if (givenName && familyName) {
    return `${givenName} ${familyName}`;
  }
  return givenName || familyName || callsign || null;
};

// Helper to generate a random starship name from oracle tables
const generateRandomStarshipName = (starforgedData) => {
  const category = getOracleCategory(starforgedData, 'Starships');
  if (!category) return null;
  
  const nameOracle = getOracleFromCategory(category, 'Name');
  if (!nameOracle?.Table) return null;
  
  return rollOnTable(nameOracle.Table);
};

function App() {
  const { data: starforgedData, loading } = useStarforged();
  
  const {
    character,
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
  } = useCharacter();

  const {
    activeTab,
    direction,
    previousView,
    isTransitioning,
    currentView,
    navigate,
    goBack,
    handleTabChange,
    resetToHome,
    updateScrollPosition,
    getScrollPosition
  } = useNavigation();

  const {
    oracleRolls,
    getOracleTable,
    rollOracle
  } = useOracle(starforgedData);

  const {
    rollStat,
    setRollStat,
    rollAdds,
    setRollAdds,
    lastRoll,
    makeActionRoll,
    burnMomentum,
    getBurnOutcome,
    wouldImprove
  } = useRoll(character, updateCondition, starforgedData);

  const {
    favoritedMoves,
    editingFavorites,
    tempFavoriteOrder,
    draggedIndex,
    toggleFavoriteMove,
    startEditingFavorites,
    saveFavoriteOrder,
    cancelEditingFavorites,
    handleDragStart,
    handleDragOver,
    handleDragEnd,
    isFavorited
  } = useFavoriteMoves();

  const {
    favoritedOracles,
    editingOracleFavorites,
    tempOracleFavoriteOrder,
    oracleDraggedIndex,
    toggleFavoriteOracle,
    startEditingOracleFavorites,
    saveOracleFavoriteOrder,
    cancelEditingOracleFavorites,
    handleOracleDragStart,
    handleOracleDragOver,
    handleOracleDragEnd,
    isOracleFavorited
  } = useFavoriteOracles();

  const {
    sectors,
    factions,
    addSector,
    removeSector,
    getSector,
    addFaction,
    removeFaction,
    getFaction,
    addLocation,
    getLocation,
    removeLocation,
    addSubLocation,
    getSubLocation,
    removeSubLocation,
    addNestedEntity,
    getNestedEntity,
    removeNestedEntity,
    addLocationNestedEntity,
    getLocationNestedEntity,
    removeLocationNestedEntity
  } = useExplore();

  // Generate random character name on initial load when data is available and name is empty
  useEffect(() => {
    if (starforgedData && !loading && !character.name) {
      const randomName = generateRandomCharacterName(starforgedData);
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
        const starshipName = generateRandomStarshipName(starforgedData);
        if (starshipName) {
          updateAssetInput(0, 0, 'Name', starshipName);
        }
      }
    }
  }, [starforgedData, loading, character.assets, updateAssetInput]);

  // Register service worker
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then(registration => console.log('SW registered:', registration))
        .catch(error => console.log('SW registration failed:', error));
    }
  }, []);

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

    // Explore Tab Views
    if (activeTab === 'explore') {
      const content = (
        <ExploreTab
          viewName={viewName}
          navigate={navigate}
          goBack={goBack}
          starforgedData={starforgedData}
          sectors={sectors}
          factions={factions}
          addSector={addSector}
          removeSector={removeSector}
          getSector={getSector}
          addFaction={addFaction}
          removeFaction={removeFaction}
          getFaction={getFaction}
          addLocation={addLocation}
          getLocation={getLocation}
          removeLocation={removeLocation}
          addSubLocation={addSubLocation}
          getSubLocation={getSubLocation}
          removeSubLocation={removeSubLocation}
          addNestedEntity={addNestedEntity}
          getNestedEntity={getNestedEntity}
          removeNestedEntity={removeNestedEntity}
          addLocationNestedEntity={addLocationNestedEntity}
          getLocationNestedEntity={getLocationNestedEntity}
          removeLocationNestedEntity={removeLocationNestedEntity}
          scrollProps={scrollProps}
        />
      );
      if (content) return content;
    }

    // Character Tab Views
    if (activeTab === 'character') {
      const content = (
        <CharacterTab
          viewName={viewName}
          navigate={navigate}
          goBack={goBack}
          resetToHome={resetToHome}
          starforgedData={starforgedData}
          character={character}
          updateStat={updateStat}
          updateCondition={updateCondition}
          updateName={updateName}
          addAsset={addAsset}
          removeAsset={removeAsset}
          toggleAssetAbility={toggleAssetAbility}
          updateAssetInput={updateAssetInput}
          newTrackName={newTrackName}
          setNewTrackName={setNewTrackName}
          newTrackRank={newTrackRank}
          setNewTrackRank={setNewTrackRank}
          addProgressTrack={addProgressTrack}
          removeProgressTrack={removeProgressTrack}
          markProgress={markProgress}
          clearProgress={clearProgress}
          markLegacy={markLegacy}
          scrollProps={scrollProps}
        />
      );
      if (content) return content;
    }

    // Moves Tab Views
    if (activeTab === 'moves') {
      const content = (
        <MovesTab
          viewName={viewName}
          navigate={navigate}
          goBack={goBack}
          starforgedData={starforgedData}
          character={character}
          favoritedMoves={favoritedMoves}
          editingFavorites={editingFavorites}
          tempFavoriteOrder={tempFavoriteOrder}
          draggedIndex={draggedIndex}
          toggleFavoriteMove={toggleFavoriteMove}
          startEditingFavorites={startEditingFavorites}
          saveFavoriteOrder={saveFavoriteOrder}
          cancelEditingFavorites={cancelEditingFavorites}
          handleDragStart={handleDragStart}
          handleDragOver={handleDragOver}
          handleDragEnd={handleDragEnd}
          isFavorited={isFavorited}
          rollStat={rollStat}
          setRollStat={setRollStat}
          rollAdds={rollAdds}
          setRollAdds={setRollAdds}
          lastRoll={lastRoll}
          makeActionRoll={makeActionRoll}
          burnMomentum={burnMomentum}
          wouldImprove={wouldImprove}
          getBurnOutcome={getBurnOutcome}
          scrollProps={scrollProps}
        />
      );
      if (content) return content;
    }

    // Oracle Tab Views
    if (activeTab === 'oracle') {
      const content = (
        <OracleTab
          viewName={viewName}
          navigate={navigate}
          goBack={goBack}
          starforgedData={starforgedData}
          oracleRolls={oracleRolls}
          getOracleTable={getOracleTable}
          rollOracle={rollOracle}
          favoritedOracles={favoritedOracles}
          editingOracleFavorites={editingOracleFavorites}
          tempOracleFavoriteOrder={tempOracleFavoriteOrder}
          oracleDraggedIndex={oracleDraggedIndex}
          toggleFavoriteOracle={toggleFavoriteOracle}
          startEditingOracleFavorites={startEditingOracleFavorites}
          saveOracleFavoriteOrder={saveOracleFavoriteOrder}
          cancelEditingOracleFavorites={cancelEditingOracleFavorites}
          handleOracleDragStart={handleOracleDragStart}
          handleOracleDragOver={handleOracleDragOver}
          handleOracleDragEnd={handleOracleDragEnd}
          isOracleFavorited={isOracleFavorited}
          scrollProps={scrollProps}
        />
      );
      if (content) return content;
    }

    // Roll Tab Views
    if (activeTab === 'roll') {
      const content = (
        <RollTab
          viewName={viewName}
          character={character}
          rollStat={rollStat}
          setRollStat={setRollStat}
          rollAdds={rollAdds}
          setRollAdds={setRollAdds}
          lastRoll={lastRoll}
          makeActionRoll={makeActionRoll}
          burnMomentum={burnMomentum}
          wouldImprove={wouldImprove}
          getBurnOutcome={getBurnOutcome}
          scrollProps={scrollProps}
        />
      );
      if (content) return content;
    }

    // Fallback for unhandled views
    return (
      <NavigationView title={viewName.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} onBack={goBack} {...scrollProps}>
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

export default App;
