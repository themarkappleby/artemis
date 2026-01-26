// Helper to find move indices from a Starforged link
export const findMoveFromLink = (link, starforgedData) => {
  if (!link || !link.startsWith('Starforged/Moves/') || !starforgedData) {
    return null;
  }

  const parts = link.split('/');
  if (parts.length < 4) return null;

  const categoryName = parts[2];
  const moveName = parts[3].replace(/_/g, ' ');

  const catIndex = starforgedData.moveCategories?.findIndex(
    cat => cat.Name === categoryName
  );

  if (catIndex === -1 || catIndex === undefined) return null;

  const category = starforgedData.moveCategories[catIndex];
  const moveIndex = category.Moves?.findIndex(
    move => move.Name === moveName || move.Name.replace(/\s/g, '_') === parts[3]
  );

  if (moveIndex === -1 || moveIndex === undefined) return null;

  return { catIndex, moveIndex };
};

// Helper to resolve oracle data from favoriteId
export const getOracleFromId = (oracleId, starforgedData) => {
  if (!starforgedData) return null;
  
  // Direct from category: oracle-{catIndex}-{oracleIndex}
  if (oracleId.startsWith('oracle-') && !oracleId.includes('detail')) {
    const parts = oracleId.split('-');
    const catIndex = parseInt(parts[1]);
    const oracleIndex = parseInt(parts[2]);
    const category = starforgedData.oracleCategories[catIndex];
    const oracle = category?.Oracles?.[oracleIndex];
    return oracle ? { oracle, category, oracleId, catIndex, oracleIndex, type: 'direct' } : null;
  }
  
  // From sub-category: oracle-detail-{catIndex}-{subIndex}-{oracleIndex}
  if (oracleId.startsWith('oracle-detail-') && !oracleId.includes('deep')) {
    const parts = oracleId.split('-');
    const catIndex = parseInt(parts[2]);
    const subIndex = parseInt(parts[3]);
    const oracleIndex = parseInt(parts[4]);
    const subCategory = starforgedData.oracleCategories[catIndex]?.Categories?.[subIndex];
    const oracle = subCategory?.Oracles?.[oracleIndex];
    return oracle ? { oracle, category: subCategory, oracleId, catIndex, subIndex, oracleIndex, type: 'sub' } : null;
  }
  
  // Deeply nested: oracle-detail-deep-{catIndex}-{subIndex}-{subSubIndex}-{oracleIndex}
  if (oracleId.startsWith('oracle-detail-deep-')) {
    const parts = oracleId.split('-');
    const catIndex = parseInt(parts[3]);
    const subIndex = parseInt(parts[4]);
    const subSubIndex = parseInt(parts[5]);
    const oracleIndex = parseInt(parts[6]);
    const subSubCategory = starforgedData.oracleCategories[catIndex]?.Categories?.[subIndex]?.Categories?.[subSubIndex];
    const oracle = subSubCategory?.Oracles?.[oracleIndex];
    return oracle ? { oracle, category: subSubCategory, oracleId, catIndex, subIndex, subSubIndex, oracleIndex, type: 'deep' } : null;
  }
  
  return null;
};

// Helper to get navigation view name from oracleId
export const getOracleViewName = (oracleId, type) => {
  // All types just return the oracleId directly
  return oracleId;
};

// Parse view name to determine view type and extract indices
export const parseOracleViewName = (viewName) => {
  if (viewName === 'oracle-home') {
    return { type: 'home' };
  }

  if (viewName.startsWith('oracle-category-')) {
    const index = parseInt(viewName.split('-')[2]);
    return { type: 'category', catIndex: index };
  }

  if (viewName.startsWith('oracle-sub-sub-')) {
    const parts = viewName.split('-');
    return { 
      type: 'sub-sub-category', 
      catIndex: parseInt(parts[3]),
      subIndex: parseInt(parts[4]),
      subSubIndex: parseInt(parts[5])
    };
  }

  if (viewName.startsWith('oracle-sub-') && !viewName.startsWith('oracle-sub-sub-')) {
    const parts = viewName.split('-');
    return { 
      type: 'sub-category', 
      catIndex: parseInt(parts[2]),
      subIndex: parseInt(parts[3])
    };
  }

  // Oracle detail views
  if (viewName.startsWith('oracle-detail-deep-table-')) {
    const parts = viewName.split('-');
    return {
      type: 'table',
      depth: 'deep',
      catIndex: parseInt(parts[4]),
      subIndex: parseInt(parts[5]),
      subSubIndex: parseInt(parts[6]),
      oracleIndex: parseInt(parts[7])
    };
  }

  if (viewName.startsWith('oracle-detail-deep-')) {
    const parts = viewName.split('-');
    return {
      type: 'detail',
      depth: 'deep',
      catIndex: parseInt(parts[3]),
      subIndex: parseInt(parts[4]),
      subSubIndex: parseInt(parts[5]),
      oracleIndex: parseInt(parts[6])
    };
  }

  if (viewName.startsWith('oracle-detail-table-')) {
    const parts = viewName.split('-');
    return {
      type: 'table',
      depth: 'sub',
      catIndex: parseInt(parts[3]),
      subIndex: parseInt(parts[4]),
      oracleIndex: parseInt(parts[5])
    };
  }

  if (viewName.startsWith('oracle-detail-')) {
    const parts = viewName.split('-');
    return {
      type: 'detail',
      depth: 'sub',
      catIndex: parseInt(parts[2]),
      subIndex: parseInt(parts[3]),
      oracleIndex: parseInt(parts[4])
    };
  }

  if (viewName.startsWith('oracle-table-') && viewName.split('-').length === 4) {
    const parts = viewName.split('-');
    return {
      type: 'table',
      depth: 'direct',
      catIndex: parseInt(parts[2]),
      oracleIndex: parseInt(parts[3])
    };
  }

  // Direct oracle: oracle-{catIndex}-{oracleIndex}
  if (viewName.startsWith('oracle-') && viewName.split('-').length === 3 && 
      !viewName.includes('sub') && !viewName.includes('detail') && !viewName.includes('table')) {
    const parts = viewName.split('-');
    return {
      type: 'detail',
      depth: 'direct',
      catIndex: parseInt(parts[1]),
      oracleIndex: parseInt(parts[2])
    };
  }

  return { type: 'unknown' };
};

// Resolve oracle and category from parsed view info
export const resolveOracle = (parsed, starforgedData) => {
  if (!starforgedData) return null;

  const { depth, catIndex, subIndex, subSubIndex, oracleIndex } = parsed;

  if (depth === 'direct') {
    const category = starforgedData.oracleCategories[catIndex];
    const oracle = category?.Oracles?.[oracleIndex];
    const oracleKey = `oracle-${catIndex}-${oracleIndex}`;
    const tableViewName = `oracle-table-${catIndex}-${oracleIndex}`;
    return { oracle, category, oracleKey, tableViewName };
  }

  if (depth === 'sub') {
    const category = starforgedData.oracleCategories[catIndex]?.Categories?.[subIndex];
    const oracle = category?.Oracles?.[oracleIndex];
    const oracleKey = `oracle-detail-${catIndex}-${subIndex}-${oracleIndex}`;
    const tableViewName = `oracle-detail-table-${catIndex}-${subIndex}-${oracleIndex}`;
    return { oracle, category, oracleKey, tableViewName };
  }

  if (depth === 'deep') {
    const category = starforgedData.oracleCategories[catIndex]?.Categories?.[subIndex]?.Categories?.[subSubIndex];
    const oracle = category?.Oracles?.[oracleIndex];
    const oracleKey = `oracle-detail-deep-${catIndex}-${subIndex}-${subSubIndex}-${oracleIndex}`;
    const tableViewName = `oracle-detail-deep-table-${catIndex}-${subIndex}-${subSubIndex}-${oracleIndex}`;
    return { oracle, category, oracleKey, tableViewName };
  }

  return null;
};

// Navigate to an oracle or move from a Starforged path
export const createOraclePathNavigator = (starforgedData, navigate) => (path) => {
  if (!starforgedData || !path) return;

  // Check if it's a move link
  if (path.startsWith('Starforged/Moves/')) {
    const moveIndices = findMoveFromLink(path, starforgedData);
    if (moveIndices) {
      navigate(`move-${moveIndices.catIndex}-${moveIndices.moveIndex}`);
      return;
    }
  }

  // Find the oracle or category in the data structure
  for (let catIndex = 0; catIndex < starforgedData.oracleCategories.length; catIndex++) {
    const category = starforgedData.oracleCategories[catIndex];
    
    // Check if this top-level category matches
    if (category['$id'] === path) {
      navigate(`oracle-category-${catIndex}`);
      return;
    }
    
    // Check direct oracles in category
    if (category.Oracles) {
      for (let oracleIndex = 0; oracleIndex < category.Oracles.length; oracleIndex++) {
        const oracle = category.Oracles[oracleIndex];
        if (oracle['$id'] === path) {
          navigate(`oracle-${catIndex}-${oracleIndex}`);
          return;
        }
      }
    }
    
    // Check sub-categories
    if (category.Categories) {
      for (let subIndex = 0; subIndex < category.Categories.length; subIndex++) {
        const subCat = category.Categories[subIndex];
        
        // Check if this sub-category matches
        if (subCat['$id'] === path) {
          navigate(`oracle-sub-${catIndex}-${subIndex}`);
          return;
        }
        
        if (subCat.Oracles) {
          for (let oracleIndex = 0; oracleIndex < subCat.Oracles.length; oracleIndex++) {
            const oracle = subCat.Oracles[oracleIndex];
            if (oracle['$id'] === path) {
              navigate(`oracle-detail-${catIndex}-${subIndex}-${oracleIndex}`);
              return;
            }
          }
        }
        
        // Check deeply nested categories
        if (subCat.Categories) {
          for (let subSubIndex = 0; subSubIndex < subCat.Categories.length; subSubIndex++) {
            const subSubCat = subCat.Categories[subSubIndex];
            
            // Check if this sub-sub-category matches
            if (subSubCat['$id'] === path) {
              navigate(`oracle-sub-sub-${catIndex}-${subIndex}-${subSubIndex}`);
              return;
            }
            
            if (subSubCat.Oracles) {
              for (let oracleIndex = 0; oracleIndex < subSubCat.Oracles.length; oracleIndex++) {
                const oracle = subSubCat.Oracles[oracleIndex];
                if (oracle['$id'] === path) {
                  navigate(`oracle-detail-deep-${catIndex}-${subIndex}-${subSubIndex}-${oracleIndex}`);
                  return;
                }
              }
            }
          }
        }
      }
    }
  }
};
