import { useState } from 'react';

const initialNavigationStacks = {
  explore: ['home'],
  character: ['character-home'],
  moves: ['moves-home'],
  oracle: ['oracle-home'],
  roll: ['roll-home']
};

export const useNavigation = () => {
  const [activeTab, setActiveTab] = useState('explore');
  const [navigationStacks, setNavigationStacks] = useState(initialNavigationStacks);
  const [direction, setDirection] = useState(null);
  const [previousView, setPreviousView] = useState(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [scrollPositions, setScrollPositions] = useState({});

  const currentView = navigationStacks[activeTab][navigationStacks[activeTab].length - 1];

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
      setIsTransitioning(false);
      setPreviousView(null);
      setDirection(null);
    } else {
      const homeView = navigationStacks[tabId][0];
      const currentViewInTab = navigationStacks[tabId][navigationStacks[tabId].length - 1];

      if (currentViewInTab !== homeView && !isTransitioning) {
        setDirection('back');
        setPreviousView(currentViewInTab);
        setIsTransitioning(true);

        setNavigationStacks({
          ...navigationStacks,
          [tabId]: [homeView]
        });

        setTimeout(() => {
          setIsTransitioning(false);
          setPreviousView(null);
          setDirection(null);
        }, 350);
      }
    }
  };

  const resetToHome = () => {
    setNavigationStacks({
      ...navigationStacks,
      [activeTab]: [navigationStacks[activeTab][0]]
    });
  };

  const getScrollKey = (tab, view) => `${tab}-${view}`;

  const updateScrollPosition = (scrollTop) => {
    const key = getScrollKey(activeTab, currentView);
    setScrollPositions(prev => ({ ...prev, [key]: scrollTop }));
  };

  const getScrollPosition = (view) => {
    const key = getScrollKey(activeTab, view);
    return scrollPositions[key] || 0;
  };

  return {
    activeTab,
    setActiveTab,
    navigationStacks,
    setNavigationStacks,
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
  };
};
