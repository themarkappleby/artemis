import React from 'react';
import { NavigationView } from '../../components/NavigationView';
import { MenuGroup } from '../../components/MenuGroup';
import { MenuItem } from '../../components/MenuItem';
import { DetailCard } from '../../components/DetailCard';
import { StatBar } from '../../components/StatBar';
import { MeterBar } from '../../components/MeterBar';
import { ProgressTrack, RANK_LABELS } from '../../components/ProgressTrack';
import { getAssetIcon } from '../../utils/icons';
import '../../styles/forms.css';
import './CharacterTab.css';

export const CharacterTab = ({
  viewName,
  navigate,
  goBack,
  resetToHome,
  starforgedData,
  character,
  updateStat,
  updateCondition,
  updateName,
  addAsset,
  removeAsset,
  toggleAssetAbility,
  updateAssetInput,
  newTrackName,
  setNewTrackName,
  newTrackRank,
  setNewTrackRank,
  addProgressTrack,
  removeProgressTrack,
  markProgress,
  clearProgress,
  markLegacy,
  scrollProps = {}
}) => {
  // Character Home
  if (viewName === 'character-home') {
    return (
      <NavigationView title="Character" {...scrollProps}>
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
              minValue={-6}
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
            minValue={-6}
            maxValue={10}
            onChange={(val) => updateCondition('momentumReset', val)}
          />
        </MenuGroup>

        <div style={{ padding: '0 16px' }}>
          <input
            type="text"
            className="character-name-input"
            value={character.name}
            onChange={(e) => updateName(e.target.value)}
            placeholder="Character Name"
          />
        </div>

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
              label="No assets yet" 
              showChevron={false}
              muted={true}
            />
          ) : (
            character.assets.map((ownedAsset, index) => {
              const assetType = starforgedData?.assetTypes[ownedAsset.typeIndex];
              const asset = assetType?.Assets?.[ownedAsset.assetIndex];
              if (!asset) return null;
              const enabledCount = ownedAsset.enabledAbilities?.length || 0;
              const totalCount = asset.Abilities?.length || 0;
              return (
                <MenuItem 
                  key={`owned-${ownedAsset.typeIndex}-${ownedAsset.assetIndex}`}
                  icon={getAssetIcon(assetType.Name)}
                  label={asset.Name}
                  value={`${enabledCount}/${totalCount}`}
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
            icon="👑" 
            label="Legacy" 
            value="3"
            onClick={() => navigate('legacy')}
          />
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
            label="Combat" 
            value={character.combatTracks.length.toString()}
            onClick={() => navigate('combat-tracks')}
          />
          <MenuItem 
            icon="🤝" 
            label="Connections" 
            value={character.connections.length.toString()}
            onClick={() => navigate('connections')}
          />
        </MenuGroup>
      </NavigationView>
    );
  }

  // Add Asset - Browse Asset Types
  if (viewName === 'add-asset' && starforgedData) {
    return (
      <NavigationView title="Add Asset" onBack={goBack} {...scrollProps}>
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
        <NavigationView title={assetType.Name} onBack={goBack} {...scrollProps}>
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
        <NavigationView title={asset.Name} onBack={goBack} {...scrollProps}>
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
                  icon={<input type="checkbox" className="ability-checkbox" checked={false} readOnly />}
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
                onClick={() => {
                  addAsset(typeIndex, assetIndex);
                  resetToHome();
                }}
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
        <NavigationView title={asset.Name} onBack={goBack} {...scrollProps}>
          {asset.Requirement && (
            <DetailCard
              icon={getAssetIcon(assetType.Name)}
              title="Requirement"
              description={asset.Requirement}
            />
          )}

          {asset.Inputs && asset.Inputs.length > 0 && (
            <MenuGroup title="Inputs">
              {asset.Inputs.map((input, inputIndex) => (
                <div key={inputIndex} style={{ padding: '12px 16px' }}>
                  <input
                    type="text"
                    className="asset-input"
                    value={ownedAsset.inputs?.[input.Name] || ''}
                    onChange={(e) => updateAssetInput(typeIndex, assetIndex, input.Name, e.target.value)}
                    placeholder={input.Name || `Input ${inputIndex + 1}`}
                  />
                </div>
              ))}
            </MenuGroup>
          )}

          {asset.Abilities && asset.Abilities.length > 0 && (
            <MenuGroup title="Abilities">
              {asset.Abilities.map((ability, abilityIndex) => {
                const isEnabled = ownedAsset.enabledAbilities.includes(abilityIndex);
                return (
                  <MenuItem 
                    key={abilityIndex}
                    icon={<input type="checkbox" className="ability-checkbox" checked={isEnabled} readOnly />}
                    label={ability.Name || `Ability ${abilityIndex + 1}`}
                    subtitle={ability.Text || ''}
                    onClick={() => toggleAssetAbility(typeIndex, assetIndex, abilityIndex)}
                    showChevron={false}
                  />
                );
              })}
            </MenuGroup>
          )}

          <MenuGroup>
            <MenuItem 
              label="Remove Asset"
              onClick={() => {
                removeAsset(typeIndex, assetIndex);
                goBack();
              }}
              isButton={true}
              destructive={true}
            />
          </MenuGroup>
        </NavigationView>
      );
    }
  }

  // Legacy View
  if (viewName === 'legacy') {
    return (
      <NavigationView title="Legacy" onBack={goBack} {...scrollProps}>
        <MenuGroup>
          <div style={{ padding: '12px 16px' }}>
            <ProgressTrack
              name="Quests"
              rank="dangerous"
              ticks={character.legacy.quests}
              onMarkProgress={() => markLegacy('quests')}
            />
          </div>
        </MenuGroup>
        <MenuGroup>
          <div style={{ padding: '12px 16px' }}>
            <ProgressTrack
              name="Bonds"
              rank="dangerous"
              ticks={character.legacy.bonds}
              onMarkProgress={() => markLegacy('bonds')}
            />
          </div>
        </MenuGroup>
        <MenuGroup>
          <div style={{ padding: '12px 16px' }}>
            <ProgressTrack
              name="Discoveries"
              rank="dangerous"
              ticks={character.legacy.discoveries}
              onMarkProgress={() => markLegacy('discoveries')}
            />
          </div>
        </MenuGroup>
      </NavigationView>
    );
  }

  // Vows List
  if (viewName === 'vows') {
    return (
      <NavigationView title="Vows" onBack={goBack} {...scrollProps}>
        {character.vows.length === 0 ? (
          <MenuGroup>
            <MenuItem 
              label="No vows yet" 
              showChevron={false}
              muted={true}
            />
          </MenuGroup>
        ) : (
          character.vows.map(vow => (
            <MenuGroup key={vow.id}>
              <div style={{ padding: '12px 16px' }}>
                <ProgressTrack
                  name={vow.name}
                  rank={vow.rank}
                  ticks={vow.ticks}
                  onMarkProgress={() => markProgress('vows', vow.id)}
                  onClearProgress={() => clearProgress('vows', vow.id)}
                />
              </div>
              <div className="track-actions">
                <MenuItem 
                  label="Forsake"
                  onClick={() => removeProgressTrack('vows', vow.id)}
                  isButton={true}
                  destructive={true}
                />
                <MenuItem 
                  label="Fulfill"
                  onClick={() => navigate(`fulfill-vow-${vow.id}`)}
                  isButton={true}
                />
              </div>
            </MenuGroup>
          ))
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
      <NavigationView title="Swear an Iron Vow" onBack={goBack} {...scrollProps}>
        <MenuGroup title="Vow Details">
          <div style={{ padding: '12px 16px' }}>
            <input
              type="text"
              className="asset-input"
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
            onClick={() => {
              if (addProgressTrack('vows')) {
                goBack();
              }
            }}
            isButton={true}
          />
        </MenuGroup>
      </NavigationView>
    );
  }

  // Fulfill Vow
  if (viewName.startsWith('fulfill-vow-')) {
    const vowId = parseInt(viewName.split('-')[2]);
    const vow = character.vows.find(v => v.id === vowId);

    if (vow) {
      const progressScore = Math.floor(vow.ticks / 4);
      return (
        <NavigationView title="Fulfill Your Vow" onBack={goBack} {...scrollProps}>
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
      <NavigationView title="Expeditions" onBack={goBack} {...scrollProps}>
        {character.expeditions.length === 0 ? (
          <MenuGroup>
            <MenuItem 
              label="No expeditions yet" 
              showChevron={false}
              muted={true}
            />
          </MenuGroup>
        ) : (
          character.expeditions.map(expedition => (
            <MenuGroup key={expedition.id}>
              <div style={{ padding: '12px 16px' }}>
                <ProgressTrack
                  name={expedition.name}
                  rank={expedition.rank}
                  ticks={expedition.ticks}
                  onMarkProgress={() => markProgress('expeditions', expedition.id)}
                  onClearProgress={() => clearProgress('expeditions', expedition.id)}
                />
              </div>
              <div className="track-actions">
                <MenuItem 
                  label="Abandon"
                  onClick={() => removeProgressTrack('expeditions', expedition.id)}
                  isButton={true}
                  destructive={true}
                />
                <MenuItem 
                  label="Finish"
                  onClick={() => navigate(`finish-expedition-${expedition.id}`)}
                  isButton={true}
                />
              </div>
            </MenuGroup>
          ))
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
      <NavigationView title="Undertake an Expedition" onBack={goBack} {...scrollProps}>
        <MenuGroup title="Expedition Details">
          <div style={{ padding: '12px 16px' }}>
            <input
              type="text"
              className="asset-input"
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
            onClick={() => {
              if (addProgressTrack('expeditions')) {
                goBack();
              }
            }}
            isButton={true}
          />
        </MenuGroup>
      </NavigationView>
    );
  }

  // Finish Expedition
  if (viewName.startsWith('finish-expedition-')) {
    const expId = parseInt(viewName.split('-')[2]);
    const expedition = character.expeditions.find(e => e.id === expId);

    if (expedition) {
      const progressScore = Math.floor(expedition.ticks / 4);
      return (
        <NavigationView title="Finish an Expedition" onBack={goBack} {...scrollProps}>
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
      <NavigationView title="Combat Tracks" onBack={goBack} {...scrollProps}>
        {character.combatTracks.length === 0 ? (
          <MenuGroup>
            <MenuItem 
              label="No active combat" 
              showChevron={false}
              muted={true}
            />
          </MenuGroup>
        ) : (
          character.combatTracks.map(combat => (
            <MenuGroup key={combat.id}>
              <div style={{ padding: '12px 16px' }}>
                <ProgressTrack
                  name={combat.name}
                  rank={combat.rank}
                  ticks={combat.ticks}
                  onMarkProgress={() => markProgress('combatTracks', combat.id)}
                  onClearProgress={() => clearProgress('combatTracks', combat.id)}
                />
              </div>
              <div className="track-actions">
                <MenuItem 
                  label="End"
                  onClick={() => removeProgressTrack('combatTracks', combat.id)}
                  isButton={true}
                  destructive={true}
                />
                <MenuItem 
                  label="Decisive"
                  onClick={() => navigate(`decisive-action-${combat.id}`)}
                  isButton={true}
                />
              </div>
            </MenuGroup>
          ))
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
      <NavigationView title="Enter the Fray" onBack={goBack} {...scrollProps}>
        <MenuGroup title="Combat Details">
          <div style={{ padding: '12px 16px' }}>
            <input
              type="text"
              className="asset-input"
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
            onClick={() => {
              if (addProgressTrack('combatTracks')) {
                goBack();
              }
            }}
            isButton={true}
          />
        </MenuGroup>
      </NavigationView>
    );
  }

  // Take Decisive Action
  if (viewName.startsWith('decisive-action-')) {
    const combatId = parseInt(viewName.split('-')[2]);
    const combat = character.combatTracks.find(c => c.id === combatId);

    if (combat) {
      const progressScore = Math.floor(combat.ticks / 4);
      return (
        <NavigationView title="Take Decisive Action" onBack={goBack} {...scrollProps}>
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

  // Connections List
  if (viewName === 'connections') {
    return (
      <NavigationView title="Connections" onBack={goBack} {...scrollProps}>
        {character.connections.length === 0 ? (
          <MenuGroup>
            <MenuItem 
              label="No connections yet" 
              showChevron={false}
              muted={true}
            />
          </MenuGroup>
        ) : (
          character.connections.map(connection => (
            <MenuGroup key={connection.id}>
              <div style={{ padding: '12px 16px' }}>
                <ProgressTrack
                  name={connection.name}
                  rank={connection.rank}
                  ticks={connection.ticks}
                  onMarkProgress={() => markProgress('connections', connection.id)}
                  onClearProgress={() => clearProgress('connections', connection.id)}
                />
              </div>
              <div className="track-actions">
                <MenuItem 
                  label="Abandon"
                  onClick={() => removeProgressTrack('connections', connection.id)}
                  isButton={true}
                  destructive={true}
                />
                <MenuItem 
                  label="Forge Bond"
                  onClick={() => navigate(`forge-bond-${connection.id}`)}
                  isButton={true}
                />
              </div>
            </MenuGroup>
          ))
        )}
        <MenuGroup>
          <MenuItem 
            label="Make a Connection"
            onClick={() => navigate('add-connection')}
            isButton={true}
          />
        </MenuGroup>
      </NavigationView>
    );
  }

  // Add Connection
  if (viewName === 'add-connection') {
    return (
      <NavigationView title="Make a Connection" onBack={goBack} {...scrollProps}>
        <MenuGroup title="Connection Details">
          <div style={{ padding: '12px 16px' }}>
            <input
              type="text"
              className="asset-input"
              style={{ marginBottom: '12px' }}
              value={newTrackName}
              onChange={(e) => setNewTrackName(e.target.value)}
              placeholder="Who is this connection?"
            />
            <select
              className="rank-select"
              value={newTrackRank}
              onChange={(e) => setNewTrackRank(e.target.value)}
            >
              <option value="troublesome">Troublesome</option>
              <option value="dangerous">Dangerous</option>
              <option value="formidable">Formidable</option>
              <option value="extreme">Extreme</option>
              <option value="epic">Epic</option>
            </select>
          </div>
        </MenuGroup>
        <MenuGroup>
          <MenuItem 
            label="Make a Connection"
            onClick={() => {
              if (addProgressTrack('connections')) {
                goBack();
              }
            }}
            isButton={true}
          />
        </MenuGroup>
      </NavigationView>
    );
  }

  // Forge Bond
  if (viewName.startsWith('forge-bond-')) {
    const connectionId = parseInt(viewName.split('-')[2]);
    const connection = character.connections.find(c => c.id === connectionId);

    if (connection) {
      const progressScore = Math.floor(connection.ticks / 4);
      return (
        <NavigationView title="Forge a Bond" onBack={goBack} {...scrollProps}>
          <DetailCard
            icon="🤝"
            title={connection.name}
            description={`Progress Score: ${progressScore}\n\nRoll your challenge dice and compare to your progress score of ${progressScore}.\n\n• Strong Hit: Beat both dice\n• Weak Hit: Beat one die\n• Miss: Beat neither die`}
          />
          <MenuGroup>
            <MenuItem 
              label="Bond Forged - Remove Connection"
              onClick={() => removeProgressTrack('connections', connection.id)}
              isButton={true}
            />
          </MenuGroup>
        </NavigationView>
      );
    }
  }

  return null;
};
