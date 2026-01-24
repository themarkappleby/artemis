import React, { useState } from 'react';
import { NavigationView } from '../../components/NavigationView';
import { MenuGroup } from '../../components/MenuGroup';
import { MenuItem } from '../../components/MenuItem';
import { DetailCard } from '../../components/DetailCard';
import { Modal, ModalField, ModalButton } from '../../components/Modal/Modal';
import { getRegionIcon, getRegionIconBg, getRegionLabel, getGenericIconBg } from '../../utils/icons';
import './ExploreTab.css';

export const ExploreTab = ({ 
  viewName, 
  navigate, 
  goBack,
  starforgedData,
  scrollProps = {}
}) => {
  // Sectors state
  const [sectors, setSectors] = useState([]);
  const [showSectorModal, setShowSectorModal] = useState(false);
  const [newSectorName, setNewSectorName] = useState('');
  const [newSectorRegion, setNewSectorRegion] = useState('terminus');

  // Factions state
  const [factions, setFactions] = useState([]);
  const [showFactionModal, setShowFactionModal] = useState(false);
  const [newFactionName, setNewFactionName] = useState('');

  const createSector = () => {
    if (!newSectorName.trim()) return;

    const newSector = {
      id: Date.now(),
      name: newSectorName.trim(),
      region: newSectorRegion
    };

    setSectors([...sectors, newSector]);
    setNewSectorName('');
    setNewSectorRegion('terminus');
    setShowSectorModal(false);
  };

  const createFaction = () => {
    if (!newFactionName.trim()) return;

    const newFaction = {
      id: Date.now(),
      name: newFactionName.trim()
    };

    setFactions([...factions, newFaction]);
    setNewFactionName('');
    setShowFactionModal(false);
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
              <input
                type="text"
                className="modal-input"
                value={newSectorName}
                onChange={(e) => setNewSectorName(e.target.value)}
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
    const sector = sectors.find(s => s.id === sectorId);

    if (sector) {
      return (
        <NavigationView title={sector.name} onBack={goBack} {...scrollProps}>
          <MenuGroup>
            <MenuItem 
              label={`Region: ${getRegionLabel(sector.region)}`}
              icon={getRegionIcon(sector.region)}
              iconBg={getRegionIconBg(sector.region)}
              showChevron={false}
            />
          </MenuGroup>
        </NavigationView>
      );
    }
  }

  // Faction Detail View
  if (viewName.startsWith('faction-')) {
    const factionId = parseInt(viewName.split('-')[1]);
    const faction = factions.find(f => f.id === factionId);

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
      return (
        <NavigationView title={truth.Name} onBack={goBack} {...scrollProps}>
          <DetailCard
            icon="🌌"
            iconBg={getGenericIconBg('🌌')}
            title={truth.Name}
            description={truth.Description || ''}
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
