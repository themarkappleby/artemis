import { useEffect } from 'react';
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
import { ExploreTab } from './views/ExploreTab/ExploreTab';
import { CharacterTab } from './views/CharacterTab/CharacterTab';
import { MovesTab } from './views/MovesTab/MovesTab';
import { OracleTab } from './views/OracleTab/OracleTab';
import { RollTab } from './views/RollTab/RollTab';
import './App.css';
import './styles/animations.css';

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
  } = useRoll(character, updateCondition);

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
            <MenuItem icon="⏳" label="Loading Starforged data..." showChevron={false} />
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
