import React, { useState } from 'react';
import { NavigationView } from '../../components/NavigationView';
import { MenuGroup } from '../../components/MenuGroup';
import { MenuItem } from '../../components/MenuItem';
import { DetailCard } from '../../components/DetailCard';
import { Modal, ModalField, ModalButton } from '../../components/Modal/Modal';
import { DiceInput } from '../../components/DiceInput/DiceInput';
import { getRegionIcon, getRegionIconBg, getRegionLabel, getGenericIconBg } from '../../utils/icons';
import './ExploreTab.css';

// Helper to find move indices from a Starforged link
const findMoveFromLink = (link, starforgedData) => {
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

// Helper to roll on an oracle table
const rollOnTable = (table) => {
  if (!table || table.length === 0) return null;
  const roll = Math.floor(Math.random() * 100) + 1;
  const result = table.find(row => {
    const floor = row.Floor || row.Chance || 1;
    const ceiling = row.Ceiling || row.Chance || 100;
    return roll >= floor && roll <= ceiling;
  });
  return result?.Result || null;
};

// Generate a random sector name from Starforged oracles
const generateSectorName = (starforgedData) => {
  if (!starforgedData?.oracleCategories) return null;
  
  const spaceCategory = starforgedData.oracleCategories.find(c => c.Name === 'Space');
  if (!spaceCategory) return null;
  
  const sectorNameOracle = spaceCategory.Oracles?.find(o => o.Name === 'Sector Name');
  if (!sectorNameOracle?.Oracles) return null;
  
  const prefixOracle = sectorNameOracle.Oracles.find(o => o.Name === 'Prefix');
  const suffixOracle = sectorNameOracle.Oracles.find(o => o.Name === 'Suffix');
  
  if (!prefixOracle?.Table || !suffixOracle?.Table) return null;
  
  const prefix = rollOnTable(prefixOracle.Table);
  const suffix = rollOnTable(suffixOracle.Table);
  
  if (prefix && suffix) {
    return `${prefix} ${suffix}`;
  }
  return null;
};

export const ExploreTab = ({ 
  viewName, 
  navigate, 
  goBack,
  starforgedData,
  sectors,
  factions,
  addSector,
  getSector,
  addFaction,
  getFaction,
  addLocation,
  scrollProps = {}
}) => {
  // Modal state (local, resets on navigation is fine)
  const [showSectorModal, setShowSectorModal] = useState(false);
  const [newSectorName, setNewSectorName] = useState('');
  const [newSectorRegion, setNewSectorRegion] = useState('terminus');
  const [showFactionModal, setShowFactionModal] = useState(false);
  const [newFactionName, setNewFactionName] = useState('');
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [newLocationName, setNewLocationName] = useState('');
  const [newLocationType, setNewLocationType] = useState('planet');
  const [currentSectorId, setCurrentSectorId] = useState(null);

  const createSector = () => {
    if (!newSectorName.trim()) return;
    addSector(newSectorName, newSectorRegion);
    setNewSectorName('');
    setNewSectorRegion('terminus');
    setShowSectorModal(false);
  };

  const createFaction = () => {
    if (!newFactionName.trim()) return;
    addFaction(newFactionName);
    setNewFactionName('');
    setShowFactionModal(false);
  };

  const createLocation = () => {
    if (!newLocationName.trim() || !currentSectorId) return;
    addLocation(currentSectorId, newLocationName, newLocationType);
    setNewLocationName('');
    setNewLocationType('planet');
    setShowLocationModal(false);
  };

  // Home view
  if (viewName === 'home') {
    return (
      <>
        <NavigationView title="The Forge" {...scrollProps}>
          <MenuGroup title="Sectors">
            {sectors.length === 0 ? (
              <MenuItem 
                label="No sectors yet" 
                showChevron={false}
                muted={true}
              />
            ) : (
              sectors.map(sector => (
                <MenuItem 
                  key={sector.id}
                  icon={getRegionIcon(sector.region)}
                  iconBg={getRegionIconBg(sector.region)}
                  label={sector.name}
                  value={getRegionLabel(sector.region)}
                  onClick={() => navigate(`sector-${sector.id}`)}
                />
              ))
            )}
            <MenuItem 
              label="Create Sector"
              onClick={() => setShowSectorModal(true)}
              isButton={true}
            />
          </MenuGroup>

          <MenuGroup title="Factions">
            {factions.length === 0 ? (
              <MenuItem 
                label="No factions yet" 
                showChevron={false}
                muted={true}
              />
            ) : (
              factions.map(faction => (
                <MenuItem 
                  key={faction.id}
                  icon="🏛️"
                  iconBg={getGenericIconBg('🏛️')}
                  label={faction.name}
                  onClick={() => navigate(`faction-${faction.id}`)}
                />
              ))
            )}
            <MenuItem 
              label="Create Faction"
              onClick={() => setShowFactionModal(true)}
              isButton={true}
            />
          </MenuGroup>

          <MenuGroup title="Truths">
            {starforgedData?.settingTruths.map((truth, index) => (
              <MenuItem 
                key={truth['$id'] || index}
                icon="🌌" 
                iconBg={getGenericIconBg('🌌')}
                label={truth.Name || `Truth ${index + 1}`}
                onClick={() => navigate(`setting-truth-${index}`)}
              />
            ))}
          </MenuGroup>
        </NavigationView>

        {/* Create Sector Modal */}
        {showSectorModal && (
          <Modal
            isOpen={showSectorModal}
            onClose={() => setShowSectorModal(false)}
            title="New Sector"
            footer={
              <>
                <ModalButton variant="cancel" onClick={() => setShowSectorModal(false)}>
                  Cancel
                </ModalButton>
                <ModalButton 
                  variant="create" 
                  onClick={createSector}
                  disabled={!newSectorName.trim()}
                >
                  Create
                </ModalButton>
              </>
            }
          >
            <ModalField label="Name">
              <DiceInput
                value={newSectorName}
                onChange={(e) => setNewSectorName(e.target.value)}
                onDiceClick={() => {
                  const name = generateSectorName(starforgedData);
                  if (name) {
                    setNewSectorName(name);
                  }
                }}
                placeholder="Enter sector name..."
                autoFocus
              />
            </ModalField>
            <ModalField label="Region">
              <select
                className="modal-select"
                value={newSectorRegion}
                onChange={(e) => setNewSectorRegion(e.target.value)}
              >
                <option value="terminus">🌟 Terminus</option>
                <option value="outlands">🌀 Outlands</option>
                <option value="expanse">🌌 Expanse</option>
                <option value="void">🕳️ Void</option>
              </select>
            </ModalField>
          </Modal>
        )}

        {/* Create Faction Modal */}
        {showFactionModal && (
          <Modal
            isOpen={showFactionModal}
            onClose={() => setShowFactionModal(false)}
            title="New Faction"
            footer={
              <>
                <ModalButton variant="cancel" onClick={() => setShowFactionModal(false)}>
                  Cancel
                </ModalButton>
                <ModalButton 
                  variant="create" 
                  onClick={createFaction}
                  disabled={!newFactionName.trim()}
                >
                  Create
                </ModalButton>
              </>
            }
          >
            <ModalField label="Name">
              <input
                type="text"
                className="modal-input"
                value={newFactionName}
                onChange={(e) => setNewFactionName(e.target.value)}
                placeholder="Enter faction name..."
                autoFocus
              />
            </ModalField>
          </Modal>
        )}
      </>
    );
  }

  // Sector Detail View
  if (viewName.startsWith('sector-')) {
    const sectorId = parseInt(viewName.split('-')[1]);
    const sector = getSector(sectorId);

    if (!sector) {
      return (
        <NavigationView title="Sector Not Found" onBack={goBack} {...scrollProps}>
          <MenuGroup>
            <MenuItem 
              label="This sector no longer exists"
              showChevron={false}
              muted={true}
            />
          </MenuGroup>
        </NavigationView>
      );
    }

    return (
      <>
        <NavigationView 
          title={sector.name} 
          onBack={goBack}
          rightIcon="plus"
          onAction={() => {
            setCurrentSectorId(sectorId);
            setShowLocationModal(true);
          }}
          {...scrollProps}
        >
          <MenuGroup title="Locations">
            {(!sector.locations || sector.locations.length === 0) ? (
              <MenuItem 
                label="No locations yet"
                showChevron={false}
                muted={true}
              />
            ) : (
              sector.locations.map(location => (
                <MenuItem 
                  key={location.id}
                  icon={location.type === 'planet' ? '🪐' : location.type === 'station' ? '🛰️' : '⭐'}
                  iconBg={getGenericIconBg(location.type === 'planet' ? '🪐' : location.type === 'station' ? '🛰️' : '⭐')}
                  label={location.name}
                  value={location.type.charAt(0).toUpperCase() + location.type.slice(1)}
                  onClick={() => navigate(`location-${sectorId}-${location.id}`)}
                />
              ))
            )}
          </MenuGroup>
          <MenuGroup title="Details">
            <MenuItem 
              label="Region"
              value={getRegionLabel(sector.region)}
              icon={getRegionIcon(sector.region)}
              iconBg={getRegionIconBg(sector.region)}
              showChevron={false}
            />
          </MenuGroup>
        </NavigationView>

        {/* Create Location Modal */}
        <Modal
          isOpen={showLocationModal}
          onClose={() => setShowLocationModal(false)}
          title="New Location"
          fullScreen={true}
          footer={
            <>
              <ModalButton 
                variant="create" 
                onClick={createLocation}
                disabled={!newLocationName.trim()}
              >
                Create
              </ModalButton>
            </>
          }
        >
          <ModalField label="Name">
            <input
              type="text"
              className="modal-input"
              value={newLocationName}
              onChange={(e) => setNewLocationName(e.target.value)}
              placeholder="Enter location name..."
              autoFocus
            />
          </ModalField>
          <ModalField label="Type">
            <select
              className="modal-select"
              value={newLocationType}
              onChange={(e) => setNewLocationType(e.target.value)}
            >
              <option value="planet">🪐 Planet</option>
              <option value="station">🛰️ Station</option>
              <option value="settlement">🏘️ Settlement</option>
              <option value="derelict">🚢 Derelict</option>
              <option value="vault">🏛️ Vault</option>
            </select>
          </ModalField>
        </Modal>
      </>
    );
  }

  // Faction Detail View
  if (viewName.startsWith('faction-')) {
    const factionId = parseInt(viewName.split('-')[1]);
    const faction = getFaction(factionId);

    if (faction) {
      return (
        <NavigationView title={faction.name} onBack={goBack} {...scrollProps}>
          <MenuGroup>
            <MenuItem 
              label="Faction details coming soon"
              showChevron={false}
              muted={true}
            />
          </MenuGroup>
        </NavigationView>
      );
    }
  }

  // Setting Truth Detail View
  if (viewName.startsWith('setting-truth-') && starforgedData) {
    const truthIndex = parseInt(viewName.split('-')[2]);
    const truth = starforgedData.settingTruths[truthIndex];

    if (truth) {
      const handleLinkClick = (href) => {
        const moveIndices = findMoveFromLink(href, starforgedData);
        if (moveIndices) {
          navigate(`move-${moveIndices.catIndex}-${moveIndices.moveIndex}`);
        }
      };

      return (
        <NavigationView title={truth.Name} onBack={goBack} {...scrollProps}>
          <DetailCard
            icon="🌌"
            iconBg={getGenericIconBg('🌌')}
            title={truth.Name}
            description={truth.Description || ''}
            onLinkClick={handleLinkClick}
          />
          {truth.Options && truth.Options.length > 0 && (
            <MenuGroup title="Options">
              {truth.Options.map((option, optionIndex) => (
                <MenuItem 
                  key={optionIndex}
                  label={option.Name || `Option ${optionIndex + 1}`}
                  subtitle={option.Description || ''}
                  showChevron={false}
                />
              ))}
            </MenuGroup>
          )}
        </NavigationView>
      );
    }
  }

  return null;
};
