import { useState, useEffect } from 'react';

export const useStarforged = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    import('dataforged').then((module) => {
      const starforgedData = module.starforged.default;
      setData({
        moveCategories: starforgedData['Move Categories'] || [],
        oracleCategories: starforgedData['Oracle Categories'] || [],
        assetTypes: starforgedData['Asset Types'] || [],
        encounters: starforgedData['Encounters'] || [],
        settingTruths: starforgedData['Setting Truths'] || []
      });
      setLoading(false);
    }).catch(error => {
      console.error('Error loading Starforged data:', error);
      setLoading(false);
    });
  }, []);

  return { data, loading };
};
