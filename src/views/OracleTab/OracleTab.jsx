import React from 'react';
import { parseOracleViewName, createOraclePathNavigator } from '../../utils/oracleHelpers';
import { createOracleResultRenderer } from './components/OracleResultLink';
import { 
  OracleHomeView, 
  OracleCategoryView, 
  OracleSubCategoryView, 
  OracleSubSubCategoryView,
  OracleDetailView, 
  OracleTableView 
} from './views';
import './OracleTab.css';

export const OracleTab = ({
  viewName,
  navigate,
  goBack,
  starforgedData,
  oracleRolls,
  getOracleTable,
  rollOracle,
  favoritedOracles = [],
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
  isOracleFavorited,
  scrollProps = {}
}) => {
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
          {...commonProps}
          catIndex={parsed.catIndex}
          subIndex={parsed.subIndex}
          subSubIndex={parsed.subSubIndex}
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

    default:
      return null;
  }
};
