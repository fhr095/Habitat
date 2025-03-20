// ModeSwitcher.jsx
import React, { useState, useCallback, memo } from 'react';
import { useVisualizationMode } from '../../../../context/VisualizationModeContext';
import './ModeSwitcher.scss';

const ModeSwitcher = () => {
  const { currentMode, switchMode } = useVisualizationMode();
  const [isExpanded, setIsExpanded] = useState(false);
  
  const handleModeChange = useCallback((mode) => {
    switchMode(mode);
    setIsExpanded(false);
  }, [switchMode]);
  
  const toggleExpanded = useCallback(() => {
    setIsExpanded(prev => !prev);
  }, []);
  
  return (
    <div className="mode-switcher">
      <button 
        className={`mode-toggle ${isExpanded ? 'expanded' : ''}`}
        onClick={toggleExpanded}
      >
        <span className="current-mode">
          {currentMode === 'normal' ? 'Normal Mode' : 'Sketch Mode'}
        </span>
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          width="16" 
          height="16" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2" 
          strokeLinecap="round" 
          strokeLinejoin="round"
          className={`chevron ${isExpanded ? 'up' : 'down'}`}
        >
          <polyline points="6 9 12 15 18 9"></polyline>
        </svg>
      </button>
      
      {isExpanded && (
        <div className="mode-options">
          <button 
            className={currentMode === 'normal' ? 'active' : ''}
            onClick={() => handleModeChange('normal')}
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              width="20" 
              height="20" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            >
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
            </svg>
            <span>Normal Mode</span>
          </button>
          
          <button 
            className={currentMode === 'sketch' ? 'active' : ''}
            onClick={() => handleModeChange('sketch')}
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              width="20" 
              height="20" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            >
              <path d="M12 19l7-7 3 3-7 7-3-3z"></path>
              <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"></path>
              <path d="M2 2l7.586 7.586"></path>
              <circle cx="11" cy="11" r="2"></circle>
            </svg>
            <span>Sketch Mode</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default memo(ModeSwitcher);