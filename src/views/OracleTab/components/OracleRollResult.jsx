import React from 'react';
import { OracleResultLink } from './OracleResultLink';

export const OracleRollResult = ({ result, renderResult }) => {
  if (!result) return null;
  
  return (
    <div style={{ padding: '16px', borderBottom: '0.5px solid #38383a' }}>
      <div style={{ fontSize: '17px', fontWeight: '600', color: '#ffffff', marginBottom: '4px' }}>
        {renderResult(result.result)}
      </div>
      <div style={{ fontSize: '13px', color: '#8e8e93' }}>
        Rolled: {result.roll}
      </div>
    </div>
  );
};
