import React from 'react';
import { NavigationView } from '../../../components/NavigationView';
import { MenuGroup } from '../../../components/MenuGroup';
import { MenuItem } from '../../../components/MenuItem';
import { DetailCard } from '../../../components/DetailCard';
import { getOracleIcon, getOracleIconBg, getGenericIconBg } from '../../../utils/icons';
import { findMoveFromLink, resolveOracle } from '../../../utils/oracleHelpers';
import { OracleRollResult } from '../components/OracleRollResult';
import { OracleColumnRoller } from '../components/OracleColumnRoller';

export const OracleDetailView = ({
  parsed,
  navigate,
  goBack,
  starforgedData,
  oracleRolls,
  getOracleTable,
  rollOracle,
  toggleFavoriteOracle,
  isOracleFavorited,
  renderResult,
  scrollProps = {}
}) => {
  const resolved = resolveOracle(parsed, starforgedData);
  
  if (!resolved || !resolved.oracle) return null;

  const { oracle, category, oracleKey, tableViewName } = resolved;
  const rolledResult = oracleRolls[oracleKey];
  const oracleTable = getOracleTable(oracle);
  const oracleIsFavorited = isOracleFavorited(oracleKey);

  // Check if this is a multi-column oracle
  const hasMultiResultColumns = oracle?.Display?.Table?.['Result columns'];
  const isMultiResultColumnOracle = hasMultiResultColumns && hasMultiResultColumns.length > 1;
  
  // Check if this has multiple roll columns (like Basic Form with Space/Interior/Land/etc)
  const hasMultiRollColumns = oracle?.Display?.Table?.['Roll columns'];
  const isMultiRollColumnOracle = hasMultiRollColumns && hasMultiRollColumns.length > 1;

  const handleLinkClick = (href) => {
    const moveIndices = findMoveFromLink(href, starforgedData);
    if (moveIndices) {
      navigate(`move-${moveIndices.catIndex}-${moveIndices.moveIndex}`);
    }
  };

  return (
    <NavigationView 
      title={oracle.Name} 
      onBack={goBack}
      actionIcon={oracleIsFavorited}
      onAction={() => toggleFavoriteOracle(oracleKey)}
      {...scrollProps}
    >
      <DetailCard
        icon={getOracleIcon(category.Name)}
        iconBg={getOracleIconBg(category.Name)}
        title={oracle.Name}
        description={oracle.Description || 'Roll to consult this oracle.'}
        onLinkClick={handleLinkClick}
      />

      {isMultiResultColumnOracle ? (
        // Display separate roll cards for each result column (like Name)
        <>
          <OracleColumnRoller
            columnType="result"
            oracleKey={oracleKey}
            oracle={oracle}
            oracleRolls={oracleRolls}
            getOracleTable={getOracleTable}
            rollOracle={rollOracle}
            renderResult={renderResult}
          />
          <MenuGroup>
            <MenuItem 
              icon="📋"
              iconBg={getGenericIconBg('📋')}
              label="View Oracle Table"
              onClick={() => navigate(tableViewName)}
            />
          </MenuGroup>
        </>
      ) : isMultiRollColumnOracle ? (
        // Display separate roll cards for each roll column (like Basic Form)
        <>
          <OracleColumnRoller
            columnType="roll"
            oracleKey={oracleKey}
            oracle={oracle}
            oracleRolls={oracleRolls}
            getOracleTable={getOracleTable}
            rollOracle={rollOracle}
            renderResult={renderResult}
          />
          <MenuGroup>
            <MenuItem 
              icon="📋"
              iconBg={getGenericIconBg('📋')}
              label="View Oracle Table"
              onClick={() => navigate(tableViewName)}
            />
          </MenuGroup>
        </>
      ) : oracleTable ? (
        <>
          <MenuGroup>
            <OracleRollResult result={rolledResult} renderResult={renderResult} />
            <MenuItem 
              label="Roll Oracle"
              onClick={() => rollOracle(oracleKey, oracleTable)}
              isButton={true}
            />
          </MenuGroup>

          <MenuGroup>
            <MenuItem 
              icon="📋"
              iconBg={getGenericIconBg('📋')}
              label="View Oracle Table"
              onClick={() => navigate(tableViewName)}
            />
          </MenuGroup>
        </>
      ) : oracle.Oracles && oracle.Oracles.length > 0 ? (
        // Handle oracles with nested sub-oracles (like Ask the Oracle)
        <>
          {oracle.Oracles.map((subOracle, subIndex) => {
            const subOracleTable = getOracleTable(subOracle);
            const subOracleKey = `${oracleKey}-sub-${subIndex}`;
            const subOracleResult = oracleRolls[subOracleKey];
            // Extract percentage from table for display (e.g., "Almost Certain" shows "90%")
            const yesEntry = subOracleTable?.find(row => row.Result === 'Yes');
            const percentage = yesEntry ? `${yesEntry.Ceiling}%` : '';

            return (
              <MenuGroup key={subIndex} title={`${subOracle.Name}${percentage ? ` (${percentage})` : ''}`}>
                <OracleRollResult result={subOracleResult} renderResult={renderResult} />
                <MenuItem 
                  label={`Roll ${subOracle.Name}`}
                  onClick={() => rollOracle(subOracleKey, subOracleTable)}
                  isButton={true}
                />
              </MenuGroup>
            );
          })}
        </>
      ) : null}
    </NavigationView>
  );
};
