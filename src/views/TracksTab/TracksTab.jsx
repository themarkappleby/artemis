import React from 'react';
import { NavigationView } from '../../components/NavigationView';
import { MenuGroup } from '../../components/MenuGroup';
import { MenuItem } from '../../components/MenuItem';
import { DetailCard } from '../../components/DetailCard';
import { ProgressTrack, RANK_LABELS } from '../../components/ProgressTrack';
import { getProgressIconBg } from '../../utils/icons';
import { useCharacterContext } from '../../contexts/CharacterContext';
import { useNavigationContext } from '../../contexts/NavigationContext';
import '../../styles/forms.css';
import './TracksTab.css';

export const TracksTab = ({
  viewName,
  scrollProps = {}
}) => {
  const { 
    character,
    newTrackName,
    setNewTrackName,
    newTrackRank,
    setNewTrackRank,
    addProgressTrack,
    removeProgressTrack,
    markProgress,
    clearProgress,
    markLegacy
  } = useCharacterContext();
  const { navigate, goBack } = useNavigationContext();

  // Tracks Home
  if (viewName === 'tracks-home') {
    return (
      <NavigationView title="Progress Tracks" {...scrollProps}>
        <MenuGroup title="Progress">
          <MenuItem 
            icon="👑" 
            iconBg={getProgressIconBg('legacy')}
            label="Legacy" 
            value="3"
            onClick={() => navigate('legacy')}
          />
          <MenuItem 
            icon="🎯" 
            iconBg={getProgressIconBg('vows')}
            label="Vows" 
            value={(character.vows?.length || 0).toString()}
            onClick={() => navigate('vows')}
          />
          <MenuItem 
            icon="🗺️" 
            iconBg={getProgressIconBg('expeditions')}
            label="Expeditions" 
            value={(character.expeditions?.length || 0).toString()}
            onClick={() => navigate('expeditions')}
          />
          <MenuItem 
            icon="⚔️" 
            iconBg={getProgressIconBg('combat')}
            label="Combat" 
            value={(character.combatTracks?.length || 0).toString()}
            onClick={() => navigate('combat-tracks')}
          />
          <MenuItem 
            icon="🤝" 
            iconBg={getProgressIconBg('connections')}
            label="Connections" 
            value={(character.connections?.length || 0).toString()}
            onClick={() => navigate('connections')}
          />
        </MenuGroup>
      </NavigationView>
    );
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
        {(character.vows?.length || 0) === 0 ? (
          <MenuGroup>
            <MenuItem 
              label="No vows yet" 
              showChevron={false}
              muted={true}
            />
          </MenuGroup>
        ) : (
          character.vows?.map(vow => (
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
    const vow = character.vows?.find(v => v.id === vowId);

    if (vow) {
      const progressScore = Math.floor(vow.ticks / 4);
      return (
        <NavigationView title="Fulfill Your Vow" onBack={goBack} {...scrollProps}>
          <DetailCard
            icon="🎯"
            iconBg={getProgressIconBg('vows')}
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
        {(character.expeditions?.length || 0) === 0 ? (
          <MenuGroup>
            <MenuItem 
              label="No expeditions yet" 
              showChevron={false}
              muted={true}
            />
          </MenuGroup>
        ) : (
          character.expeditions?.map(expedition => (
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
    const expedition = character.expeditions?.find(e => e.id === expId);

    if (expedition) {
      const progressScore = Math.floor(expedition.ticks / 4);
      return (
        <NavigationView title="Finish an Expedition" onBack={goBack} {...scrollProps}>
          <DetailCard
            icon="🗺️"
            iconBg={getProgressIconBg('expeditions')}
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
        {(character.combatTracks?.length || 0) === 0 ? (
          <MenuGroup>
            <MenuItem 
              label="No active combat" 
              showChevron={false}
              muted={true}
            />
          </MenuGroup>
        ) : (
          character.combatTracks?.map(combat => (
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
    const combat = character.combatTracks?.find(c => c.id === combatId);

    if (combat) {
      const progressScore = Math.floor(combat.ticks / 4);
      return (
        <NavigationView title="Take Decisive Action" onBack={goBack} {...scrollProps}>
          <DetailCard
            icon="⚔️"
            iconBg={getProgressIconBg('combat')}
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
        {(character.connections?.length || 0) === 0 ? (
          <MenuGroup>
            <MenuItem 
              label="No connections yet" 
              showChevron={false}
              muted={true}
            />
          </MenuGroup>
        ) : (
          character.connections?.map(connection => (
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
    const connection = character.connections?.find(c => c.id === connectionId);

    if (connection) {
      const progressScore = Math.floor(connection.ticks / 4);
      return (
        <NavigationView title="Forge a Bond" onBack={goBack} {...scrollProps}>
          <DetailCard
            icon="🤝"
            iconBg={getProgressIconBg('connections')}
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
