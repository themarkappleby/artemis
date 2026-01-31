import React from 'react';
import { parseOracleViewName, createOraclePathNavigator } from '../../utils/oracleHelpers';
import { createOracleResultRenderer } from './components/OracleResultLink';
import { useStarforgedContext } from '../../contexts/StarforgedContext';
import { useNavigationContext } from '../../contexts/NavigationContext';
import { useOracleContext } from '../../contexts/OracleContext';
import { useFavoritesContext } from '../../contexts/FavoritesContext';
import { 
  OracleHomeView, 
  OracleCategoryView, 
  OracleSubCategoryView, 
  OracleSubSubCategoryView,
  OracleDetailView, 
  OracleTableView,
  OracleSampleNamesView,
  OracleSampleNamesTableView,
  ActionThemeView,
  DescriptorFocusView
} from './views';
import './OracleTab.css';

export const OracleTab = ({
  viewName,
  scrollProps = {}
}) => {
  const { data: starforgedData } = useStarforgedContext();
  const { navigate, goBack } = useNavigationContext();
  const { oracleRolls, getOracleTable, rollOracle } = useOracleContext();
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
  } = useFavoritesContext();

  // Create navigation helper for oracle paths
  const navigateToOracleByPath = createOraclePathNavigator(starforgedData, navigate);
  
  // Create result renderer with navigation support
  const renderResult = createOracleResultRenderer(navigateToOracleByPath);

  // Parse the view name to determine which view to render
  const parsed = parseOracleViewName(viewName);

  // Common props for all views
  const commonProps = {
    navigate,
    goBack,
    starforgedData,
    scrollProps
  };

  // Props for views that need oracle rolling
  const oracleProps = {
    ...commonProps,
    oracleRolls,
    getOracleTable,
    rollOracle,
    renderResult,
    navigateToOracleByPath
  };

  switch (parsed.type) {
    case 'home':
      return (
        <OracleHomeView
          {...commonProps}
          favoritedOracles={favoritedOracles}
          editingOracleFavorites={editingOracleFavorites}
          tempOracleFavoriteOrder={tempOracleFavoriteOrder}
          oracleDraggedIndex={oracleDraggedIndex}
          startEditingOracleFavorites={startEditingOracleFavorites}
          saveOracleFavoriteOrder={saveOracleFavoriteOrder}
          cancelEditingOracleFavorites={cancelEditingOracleFavorites}
          handleOracleDragStart={handleOracleDragStart}
          handleOracleDragOver={handleOracleDragOver}
          handleOracleDragEnd={handleOracleDragEnd}
        />
      );

    case 'category':
      return (
        <OracleCategoryView
          {...commonProps}
          catIndex={parsed.catIndex}
        />
      );

    case 'sub-category':
      return (
        <OracleSubCategoryView
          {...oracleProps}
          catIndex={parsed.catIndex}
          subIndex={parsed.subIndex}
        />
      );

    case 'sub-sub-category':
      return (
        <OracleSubSubCategoryView
          {...oracleProps}
          catIndex={parsed.catIndex}
          subIndex={parsed.subIndex}
          subSubIndex={parsed.subSubIndex}
        />
      );

    case 'action-theme':
      return (
        <ActionThemeView
          {...oracleProps}
          parsed={parsed}
        />
      );

    case 'descriptor-focus':
      return (
        <DescriptorFocusView
          {...oracleProps}
          parsed={parsed}
        />
      );

    case 'detail':
      return (
        <OracleDetailView
          {...oracleProps}
          parsed={parsed}
          toggleFavoriteOracle={toggleFavoriteOracle}
          isOracleFavorited={isOracleFavorited}
        />
      );

    case 'table':
      return (
        <OracleTableView
          {...oracleProps}
          parsed={parsed}
        />
      );

    case 'sample-names':
      return (
        <OracleSampleNamesView
          {...oracleProps}
          parsed={parsed}
        />
      );

    case 'sample-names-table':
      return (
        <OracleSampleNamesTableView
          {...commonProps}
          parsed={parsed}
        />
      );

    default:
      return null;
  }
};
