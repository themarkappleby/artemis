import { useState, useEffect } from 'react';
import { NavigationView } from './components/NavigationView';
import { MenuGroup } from './components/MenuGroup';
import { MenuItem } from './components/MenuItem';
import { TabBar } from './components/TabBar';
import './App.css';

function App() {
  const [activeTab, setActiveTab] = useState('explore');
  const [navigationStacks, setNavigationStacks] = useState({
    explore: ['home'],
    character: ['character-home'],
    moves: ['moves-home'],
    oracle: ['oracle-home']
  });
  const [direction, setDirection] = useState(null);
  const [previousView, setPreviousView] = useState(null);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const navigate = (view) => {
    if (isTransitioning) return;
    
    setDirection('forward');
    setPreviousView(navigationStacks[activeTab][navigationStacks[activeTab].length - 1]);
    setIsTransitioning(true);
    
    setNavigationStacks({
      ...navigationStacks,
      [activeTab]: [...navigationStacks[activeTab], view]
    });
    
    setTimeout(() => {
      setIsTransitioning(false);
      setPreviousView(null);
      setDirection(null);
    }, 350);
  };

  const goBack = () => {
    const currentStack = navigationStacks[activeTab];
    if (currentStack.length > 1 && !isTransitioning) {
      setDirection('back');
      setPreviousView(currentStack[currentStack.length - 1]);
      setIsTransitioning(true);
      
      setNavigationStacks({
        ...navigationStacks,
        [activeTab]: currentStack.slice(0, -1)
      });
      
      setTimeout(() => {
        setIsTransitioning(false);
        setPreviousView(null);
        setDirection(null);
      }, 350);
    }
  };

  const handleTabChange = (tabId) => {
    if (tabId !== activeTab) {
      setActiveTab(tabId);
      // Reset transition state when switching tabs
      setIsTransitioning(false);
      setPreviousView(null);
      setDirection(null);
    }
  };

  const currentView = navigationStacks[activeTab][navigationStacks[activeTab].length - 1];

  // Register service worker
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then(registration => console.log('SW registered:', registration))
        .catch(error => console.log('SW registration failed:', error));
    }
  }, []);

  const renderViewContent = (viewName) => {
    // Tab-specific home views
    if (viewName === 'home') {
      return (
        <NavigationView title="The Forge">
          <MenuGroup>
            <MenuItem 
              icon="👤" 
              label="Profile" 
              value="John Doe"
              onClick={() => navigate('profile')}
            />
          </MenuGroup>

          <MenuGroup title="General">
            <MenuItem 
              icon="📱" 
              label="Appearance" 
              onClick={() => navigate('appearance')}
            />
            <MenuItem 
              icon="🔔" 
              label="Notifications" 
              onClick={() => navigate('notifications')}
            />
            <MenuItem 
              icon="🔒" 
              label="Privacy & Security" 
              onClick={() => navigate('privacy')}
            />
          </MenuGroup>

          <MenuGroup title="Content">
            <MenuItem 
              icon="📚" 
              label="Library" 
              onClick={() => navigate('library')}
            />
            <MenuItem 
              icon="⭐" 
              label="Favorites" 
              value="12 items"
              onClick={() => navigate('favorites')}
            />
            <MenuItem 
              icon="📥" 
              label="Downloads" 
              onClick={() => navigate('downloads')}
            />
          </MenuGroup>

          <MenuGroup title="Support">
            <MenuItem 
              icon="❓" 
              label="Help & Feedback" 
              onClick={() => navigate('help')}
            />
            <MenuItem 
              icon="ℹ️" 
              label="About" 
              onClick={() => navigate('about')}
            />
          </MenuGroup>
        </NavigationView>
      );
    }

    if (viewName === 'character-home') {
      return (
        <NavigationView title="Character">
          <MenuGroup>
            <MenuItem 
              icon="⚔️" 
              label="Character Stats" 
              onClick={() => navigate('stats')}
            />
            <MenuItem 
              icon="🎒" 
              label="Inventory" 
              onClick={() => navigate('inventory')}
            />
            <MenuItem 
              icon="📜" 
              label="Background" 
              onClick={() => navigate('background')}
            />
          </MenuGroup>
          <MenuGroup title="Progress">
            <MenuItem 
              icon="📈" 
              label="Experience" 
              value="Level 5"
              showChevron={false}
            />
            <MenuItem 
              icon="🏆" 
              label="Achievements" 
              onClick={() => navigate('achievements')}
            />
          </MenuGroup>
        </NavigationView>
      );
    }

    if (viewName === 'moves-home') {
      return (
        <NavigationView title="Moves">
          <MenuGroup title="Combat">
            <MenuItem 
              icon="⚔️" 
              label="Strike" 
              onClick={() => navigate('strike')}
            />
            <MenuItem 
              icon="🛡️" 
              label="Defend" 
              onClick={() => navigate('defend')}
            />
            <MenuItem 
              icon="🏹" 
              label="Ranged Attack" 
              onClick={() => navigate('ranged')}
            />
          </MenuGroup>
          <MenuGroup title="Skills">
            <MenuItem 
              icon="🔍" 
              label="Investigate" 
              onClick={() => navigate('investigate')}
            />
            <MenuItem 
              icon="💬" 
              label="Persuade" 
              onClick={() => navigate('persuade')}
            />
            <MenuItem 
              icon="🏃" 
              label="Evade" 
              onClick={() => navigate('evade')}
            />
          </MenuGroup>
        </NavigationView>
      );
    }

    if (viewName === 'oracle-home') {
      return (
        <NavigationView title="Oracle">
          <MenuGroup>
            <MenuItem 
              icon="🎲" 
              label="Ask the Oracle" 
              onClick={() => navigate('ask-oracle')}
            />
            <MenuItem 
              icon="📖" 
              label="Oracle Tables" 
              onClick={() => navigate('oracle-tables')}
            />
          </MenuGroup>
          <MenuGroup title="History">
            <MenuItem 
              icon="📜" 
              label="Recent Rolls" 
              onClick={() => navigate('recent-rolls')}
            />
            <MenuItem 
              icon="💾" 
              label="Saved Results" 
              onClick={() => navigate('saved-results')}
            />
          </MenuGroup>
        </NavigationView>
      );
    }

    // Shared sub-views
    switch (viewName) {
      case 'profile':
        return (
          <NavigationView title="Profile" onBack={goBack}>
            <MenuGroup>
              <MenuItem icon="👤" label="Name" value="John Doe" showChevron={false} />
              <MenuItem icon="📧" label="Email" value="john@example.com" showChevron={false} />
              <MenuItem icon="📞" label="Phone" value="+1 234 567 8900" showChevron={false} />
            </MenuGroup>
            <MenuGroup title="Account">
              <MenuItem 
                icon="🔑" 
                label="Change Password" 
                onClick={() => navigate('change-password')}
              />
              <MenuItem 
                icon="🔐" 
                label="Two-Factor Auth" 
                onClick={() => navigate('2fa')}
              />
            </MenuGroup>
          </NavigationView>
        );

      case 'appearance':
        return (
          <NavigationView title="Appearance" onBack={goBack}>
            <MenuGroup title="Theme">
              <MenuItem icon="🌙" label="Dark Mode" value="On" showChevron={false} />
              <MenuItem icon="🎨" label="Accent Color" value="Blue" onClick={() => navigate('accent-color')} />
            </MenuGroup>
            <MenuGroup title="Display">
              <MenuItem icon="🔤" label="Text Size" value="Medium" onClick={() => navigate('text-size')} />
              <MenuItem icon="✨" label="Animations" value="On" showChevron={false} />
            </MenuGroup>
          </NavigationView>
        );

      case 'notifications':
        return (
          <NavigationView title="Notifications" onBack={goBack}>
            <MenuGroup>
              <MenuItem icon="🔔" label="Allow Notifications" value="On" showChevron={false} />
              <MenuItem icon="🔊" label="Sound" value="Default" onClick={() => navigate('sound')} />
              <MenuItem icon="📳" label="Vibration" value="On" showChevron={false} />
            </MenuGroup>
            <MenuGroup title="Types">
              <MenuItem icon="💬" label="Messages" value="On" showChevron={false} />
              <MenuItem icon="📬" label="Updates" value="On" showChevron={false} />
              <MenuItem icon="⚠️" label="Alerts" value="On" showChevron={false} />
            </MenuGroup>
          </NavigationView>
        );

      case 'privacy':
        return (
          <NavigationView title="Privacy & Security" onBack={goBack}>
            <MenuGroup title="Data">
              <MenuItem icon="📊" label="Data Collection" onClick={() => navigate('data-collection')} />
              <MenuItem icon="🍪" label="Cookies" onClick={() => navigate('cookies')} />
              <MenuItem icon="📍" label="Location Services" value="While Using" showChevron={false} />
            </MenuGroup>
            <MenuGroup title="Security">
              <MenuItem icon="🔒" label="App Lock" value="Off" onClick={() => navigate('app-lock')} />
              <MenuItem icon="📱" label="Device Access" onClick={() => navigate('device-access')} />
            </MenuGroup>
          </NavigationView>
        );

      case 'library':
        return (
          <NavigationView title="Library" onBack={goBack}>
            <MenuGroup title="Collections">
              <MenuItem icon="📖" label="Books" value="45" onClick={() => navigate('books')} />
              <MenuItem icon="🎵" label="Music" value="234" onClick={() => navigate('music')} />
              <MenuItem icon="🎬" label="Videos" value="12" onClick={() => navigate('videos')} />
              <MenuItem icon="🖼️" label="Photos" value="1,234" onClick={() => navigate('photos')} />
            </MenuGroup>
            <MenuGroup title="Management">
              <MenuItem icon="☁️" label="Cloud Sync" value="On" showChevron={false} />
              <MenuItem icon="💾" label="Storage" value="2.4 GB used" onClick={() => navigate('storage')} />
            </MenuGroup>
          </NavigationView>
        );

      case 'favorites':
        return (
          <NavigationView title="Favorites" onBack={goBack}>
            <MenuGroup>
              <MenuItem icon="⭐" label="Favorite Item 1" onClick={() => navigate('item-1')} />
              <MenuItem icon="⭐" label="Favorite Item 2" onClick={() => navigate('item-2')} />
              <MenuItem icon="⭐" label="Favorite Item 3" onClick={() => navigate('item-3')} />
            </MenuGroup>
          </NavigationView>
        );

      case 'downloads':
        return (
          <NavigationView title="Downloads" onBack={goBack}>
            <MenuGroup title="Settings">
              <MenuItem icon="📥" label="Download Location" value="Device" onClick={() => navigate('download-location')} />
              <MenuItem icon="📶" label="Download Over Cellular" value="Off" showChevron={false} />
              <MenuItem icon="🔋" label="Download While Charging Only" value="On" showChevron={false} />
            </MenuGroup>
            <MenuGroup title="Recent">
              <MenuItem icon="📄" label="Document.pdf" value="2.4 MB" showChevron={false} />
              <MenuItem icon="🖼️" label="Image.jpg" value="1.2 MB" showChevron={false} />
            </MenuGroup>
          </NavigationView>
        );

      case 'help':
        return (
          <NavigationView title="Help & Feedback" onBack={goBack}>
            <MenuGroup>
              <MenuItem icon="📖" label="Documentation" onClick={() => navigate('documentation')} />
              <MenuItem icon="❓" label="FAQ" onClick={() => navigate('faq')} />
              <MenuItem icon="💬" label="Contact Support" onClick={() => navigate('contact')} />
              <MenuItem icon="🐛" label="Report a Bug" onClick={() => navigate('bug-report')} />
            </MenuGroup>
            <MenuGroup title="Community">
              <MenuItem icon="👥" label="Forums" onClick={() => navigate('forums')} />
              <MenuItem icon="💡" label="Feature Requests" onClick={() => navigate('feature-requests')} />
            </MenuGroup>
          </NavigationView>
        );

      case 'about':
        return (
          <NavigationView title="About" onBack={goBack}>
            <MenuGroup>
              <MenuItem icon="ℹ️" label="Version" value="1.0.0" showChevron={false} />
              <MenuItem icon="🏢" label="Developer" value="Artemis Team" showChevron={false} />
              <MenuItem icon="📅" label="Release Date" value="Jan 2026" showChevron={false} />
            </MenuGroup>
            <MenuGroup title="Legal">
              <MenuItem icon="📄" label="Terms of Service" onClick={() => navigate('terms')} />
              <MenuItem icon="🔒" label="Privacy Policy" onClick={() => navigate('privacy-policy')} />
              <MenuItem icon="⚖️" label="Licenses" onClick={() => navigate('licenses')} />
            </MenuGroup>
          </NavigationView>
        );

      // All other views show a simple placeholder
      default:
        return (
          <NavigationView title={viewName.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())} onBack={goBack}>
            <MenuGroup>
              <MenuItem 
                icon="📄" 
                label={`${viewName} content goes here`} 
                showChevron={false}
              />
            </MenuGroup>
          </NavigationView>
        );
    }
  };

  return (
    <div className="app">
      <div className="app-content">
        {/* Previous view - slides out */}
        {isTransitioning && previousView && (
          <div 
            className={`view-container ${direction === 'forward' ? 'slide-out-left' : 'slide-out-right'}`}
            key={`prev-${previousView}`}
          >
            {renderViewContent(previousView)}
          </div>
        )}
        
        {/* Current view - slides in */}
        <div 
          className={`view-container ${isTransitioning ? (direction === 'forward' ? 'slide-in-right' : 'slide-in-left') : ''}`}
          key={currentView}
        >
          {renderViewContent(currentView)}
        </div>
      </div>
      
      <TabBar activeTab={activeTab} onTabChange={handleTabChange} />
    </div>
  );
}

export default App;
