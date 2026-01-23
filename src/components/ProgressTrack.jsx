import React from 'react';
import './ProgressTrack.css';

// Ticks per "mark progress" based on rank
const RANK_TICKS = {
  troublesome: 12, // 3 boxes
  dangerous: 8,    // 2 boxes
  formidable: 4,   // 1 box
  extreme: 2,      // 2 ticks
  epic: 1          // 1 tick
};

const RANK_LABELS = {
  troublesome: 'Troublesome',
  dangerous: 'Dangerous',
  formidable: 'Formidable',
  extreme: 'Extreme',
  epic: 'Epic'
};

export const ProgressTrack = ({ name, rank, ticks = 0, onMarkProgress, onClearProgress }) => {
  // Calculate boxes and remaining ticks
  // Total of 10 boxes, 4 ticks each = 40 max ticks
  const maxTicks = 40;
  const currentTicks = Math.min(ticks, maxTicks);
  
  // Progress score = number of fully filled boxes
  const progressScore = Math.floor(currentTicks / 4);
  
  const renderBox = (boxIndex) => {
    const boxStartTick = boxIndex * 4;
    const ticksInBox = Math.max(0, Math.min(4, currentTicks - boxStartTick));
    
    return (
      <div key={boxIndex} className="progress-box">
        <svg viewBox="0 0 40 40" className="progress-box-svg">
          {/* Box outline */}
          <rect x="1" y="1" width="38" height="38" fill="none" stroke="#3a3a3c" strokeWidth="2" />
          
          {/* Tick marks - drawn as lines forming an X pattern */}
          {ticksInBox >= 1 && (
            <line x1="8" y1="8" x2="32" y2="32" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />
          )}
          {ticksInBox >= 2 && (
            <line x1="32" y1="8" x2="8" y2="32" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />
          )}
          {ticksInBox >= 3 && (
            <line x1="20" y1="6" x2="20" y2="34" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />
          )}
          {ticksInBox >= 4 && (
            <line x1="6" y1="20" x2="34" y2="20" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />
          )}
        </svg>
      </div>
    );
  };

  return (
    <div className="progress-track">
      <div className="progress-track-header">
        <span className="progress-track-name">{name}</span>
        <span className="progress-track-rank">{RANK_LABELS[rank]}</span>
      </div>
      
      <div className="progress-track-row">
        <div className="progress-track-boxes">
          {[...Array(10)].map((_, i) => renderBox(i))}
        </div>
        <button 
          className="progress-track-button progress-track-button-control"
          onClick={onMarkProgress}
          disabled={currentTicks >= maxTicks}
        >
          +
        </button>
      </div>
    </div>
  );
};

export { RANK_TICKS, RANK_LABELS };
