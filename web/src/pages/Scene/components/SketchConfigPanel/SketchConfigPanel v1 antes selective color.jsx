// SketchConfigPanel.jsx
import React, { useCallback, memo } from 'react';
import { useVisualizationMode } from '../../../../context/VisualizationModeContext';
import './SketchConfigPanel.scss';

const SketchConfigPanel = () => {
  const { 
    sketchConfig, 
    updateSketchConfig, 
    setColorTheme, 
    randomizeColors 
  } = useVisualizationMode();

  const handleColorChange = useCallback((key, e) => {
    updateSketchConfig(key, e.target.value);
  }, [updateSketchConfig]);

  const handleSliderChange = useCallback((key, e) => {
    const value = parseFloat(e.target.value);
    updateSketchConfig(key, value);
  }, [updateSketchConfig]);

  const handleCheckboxChange = useCallback((key) => {
    updateSketchConfig(key, !sketchConfig[key]);
  }, [updateSketchConfig, sketchConfig]);

  const handleSelectChange = useCallback((key, e) => {
    updateSketchConfig(key, e.target.value);
  }, [updateSketchConfig]);

  return (
    <div className="sketch-config-panel">
      <h3>Sketch Mode Settings</h3>
      
      <div className="config-section">
        <h4>Color Theme</h4>
        <div className="button-group">
          <button 
            className={sketchConfig.colors === 'LIGHT' ? 'active' : ''} 
            onClick={() => setColorTheme('LIGHT')}
          >
            Light
          </button>
          <button 
            className={sketchConfig.colors === 'DARK' ? 'active' : ''} 
            onClick={() => setColorTheme('DARK')}
          >
            Dark
          </button>
          <button 
            className={sketchConfig.colors === 'CUSTOM' ? 'active' : ''} 
            onClick={randomizeColors}
          >
            Random
          </button>
        </div>
        
        <div className="color-pickers">
          <div className="color-picker">
            <label>Background</label>
            <input 
              type="color" 
              value={sketchConfig.backgroundColor} 
              onChange={(e) => handleColorChange('backgroundColor', e)} 
            />
          </div>
          <div className="color-picker">
            <label>Model</label>
            <input 
              type="color" 
              value={sketchConfig.modelColor} 
              onChange={(e) => handleColorChange('modelColor', e)} 
            />
          </div>
          <div className="color-picker">
            <label>Lines</label>
            <input 
              type="color" 
              value={sketchConfig.lineColor} 
              onChange={(e) => handleColorChange('lineColor', e)} 
            />
          </div>
          <div className="color-picker">
            <label>Shadow</label>
            <input 
              type="color" 
              value={sketchConfig.shadowColor} 
              onChange={(e) => handleColorChange('shadowColor', e)} 
            />
          </div>
        </div>
      </div>
      
      <div className="config-section">
        <h4>Model Settings</h4>
        <div className="checkbox-group">
          <label>
            <input 
              type="checkbox" 
              checked={sketchConfig.lit} 
              onChange={() => handleCheckboxChange('lit')} 
            />
            Use Lighting
          </label>
        </div>
        
        <div className="slider-group">
          <label>Opacity: {sketchConfig.opacity.toFixed(2)}</label>
          <input 
            type="range" 
            min="0" 
            max="1" 
            step="0.01" 
            value={sketchConfig.opacity} 
            onChange={(e) => handleSliderChange('opacity', e)} 
          />
        </div>
      </div>
      
      <div className="config-section">
        <h4>Edge Settings</h4>
        <div className="select-group">
          <label>Edge Type</label>
          <select 
            value={sketchConfig.display} 
            onChange={(e) => handleSelectChange('display', e)}
          >
            <option value="THRESHOLD_EDGES">Threshold Edges</option>
            <option value="NORMAL_EDGES">Normal Edges</option>
            <option value="NONE">None</option>
          </select>
        </div>
        
        <div className="slider-group">
          <label>Threshold: {sketchConfig.threshold}°</label>
          <input 
            type="range" 
            min="0" 
            max="180" 
            step="1" 
            value={sketchConfig.threshold} 
            onChange={(e) => handleSliderChange('threshold', e)} 
          />
        </div>
        
        <div className="checkbox-group">
          <label>
            <input 
              type="checkbox" 
              checked={sketchConfig.displayConditionalEdges} 
              onChange={() => handleCheckboxChange('displayConditionalEdges')} 
            />
            Show Conditional Edges
          </label>
        </div>
        
        <div className="checkbox-group">
          <label>
            <input 
              type="checkbox" 
              checked={sketchConfig.useThickLines} 
              onChange={() => handleCheckboxChange('useThickLines')} 
            />
            Use Thick Lines
          </label>
        </div>
        
        <div className="slider-group">
          <label>Line Thickness: {sketchConfig.thickness.toFixed(1)}</label>
          <input 
            type="range" 
            min="0.1" 
            max="5" 
            step="0.1" 
            value={sketchConfig.thickness} 
            onChange={(e) => handleSliderChange('thickness', e)} 
          />
        </div>
      </div>
      
      <div className="footer">
        <p>Based on <a href="https://github.com/gkjohnson/three-sketch-example" target="_blank" rel="noopener noreferrer">three-sketch-example</a> by Garrett Johnson</p>
      </div>
    </div>
  );
};

export default memo(SketchConfigPanel);