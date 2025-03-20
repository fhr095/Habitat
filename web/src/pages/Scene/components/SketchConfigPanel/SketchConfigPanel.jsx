// SketchConfigPanel.jsx
import React, { useCallback, memo, useState, useEffect, useRef } from 'react';
import { useVisualizationMode } from '../../../../context/VisualizationModeContext';
import { useSceneConfig } from '../../../../context/SceneConfigContext';
import './SketchConfigPanel.scss';

const SketchConfigPanel = () => {
  const { 
    sketchConfig, 
    updateSketchConfig, 
    updatePreservedMaterialTypes,
    togglePreservedObject,
    setColorTheme, 
    randomizeColors 
  } = useVisualizationMode();
  
  const { scene } = useSceneConfig();
  
  // Estado para rastrear objetos disponíveis na cena
  const [availableObjects, setAvailableObjects] = useState([]);
  // Estado para controlar a expansão de seções
  const [expandedSections, setExpandedSections] = useState({
    colors: true,
    edges: true,
    materials: true,
    objects: false
  });
  // Estado para filtro de objetos
  const [objectFilter, setObjectFilter] = useState('');
  
  // Ref para o componente desacoplado do ciclo de renderização
  const sceneRef = useRef(scene);
  
  // Atualizar ref quando a cena mudar
  useEffect(() => {
    sceneRef.current = scene;
  }, [scene]);
  
  // Descobrir objetos com materiais na cena
  useEffect(() => {
    if (!scene) return;
    
    const objects = [];
    const processed = new Set(); // Para evitar duplicatas
    
    // Função para encontrar todos os objetos com materiais na cena
    const findObjectsWithMaterials = (object) => {
      object.traverse((child) => {
        // Apenas considerar meshes com materiais e que possuem um nome
        if (child.isMesh && child.material && child.name && child.name.trim() !== '') {
          if (!processed.has(child.uuid)) {
            objects.push({
              uuid: child.uuid,
              name: child.name,
              // Tentar obter informações do material para exibição
              materialInfo: child.material ? {
                type: child.material.type,
                color: child.material.color ? 
                  `#${child.material.color.getHexString()}` : 
                  undefined,
                hasTexture: !!child.material.map,
                isTransparent: child.material.transparent
              } : null
            });
            processed.add(child.uuid);
          }
        }
      });
    };
    
    findObjectsWithMaterials(scene);
    
    // Ordenar alfabeticamente por nome
    objects.sort((a, b) => a.name.localeCompare(b.name));
    setAvailableObjects(objects);
    
  }, [scene]);
  
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
  
  const handleMaterialPreservationToggle = useCallback(() => {
    updateSketchConfig('preserveOriginalMaterials', !sketchConfig.preserveOriginalMaterials);
  }, [updateSketchConfig, sketchConfig.preserveOriginalMaterials]);
  
  const handleMaterialTypeToggle = useCallback((type) => {
    updatePreservedMaterialTypes(type, !sketchConfig.preservedMaterialTypes[type]);
  }, [updatePreservedMaterialTypes, sketchConfig.preservedMaterialTypes]);
  
  const handleObjectToggle = useCallback((objectId) => {
    togglePreservedObject(objectId);
  }, [togglePreservedObject]);

  const handleSelectChange = useCallback((key, e) => {
    updateSketchConfig(key, e.target.value);
  }, [updateSketchConfig]);
  
  // Alternar expansão de seções
  const toggleSection = useCallback((section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  }, []);
  
  // Filtrar objetos com base no texto de pesquisa
  const filteredObjects = availableObjects.filter(obj => 
    obj.name.toLowerCase().includes(objectFilter.toLowerCase())
  );

  return (
    <div className="sketch-config-panel">
      <h3>Sketch Mode Settings</h3>
      
      {/* Seção de Cores */}
      <div className="config-section">
        <div className="section-header" onClick={() => toggleSection('colors')}>
          <h4>Color Theme</h4>
          <span className={`toggle-icon ${expandedSections.colors ? 'expanded' : ''}`}>▼</span>
        </div>
        
        {expandedSections.colors && (
          <>
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
          </>
        )}
      </div>
      
      {/* Seção de Configurações do Modelo */}
      <div className="config-section">
        <div className="section-header" onClick={() => toggleSection('materials')}>
          <h4>Material Settings</h4>
          <span className={`toggle-icon ${expandedSections.materials ? 'expanded' : ''}`}>▼</span>
        </div>
        
        {expandedSections.materials && (
          <>
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
            
            {/* Nova seção para preservação de materiais originais */}
            <div className="material-preservation">
              <h5>Original Material Preservation</h5>
              <div className="checkbox-group">
                <label>
                  <input 
                    type="checkbox" 
                    checked={sketchConfig.preserveOriginalMaterials} 
                    onChange={handleMaterialPreservationToggle} 
                  />
                  Enable Material Preservation
                </label>
              </div>
              
              {sketchConfig.preserveOriginalMaterials && (
                <div className="material-properties">
                  <div className="checkbox-group">
                    <label>
                      <input 
                        type="checkbox" 
                        checked={sketchConfig.preservedMaterialTypes.colors} 
                        onChange={() => handleMaterialTypeToggle('colors')} 
                      />
                      Preserve Colors
                    </label>
                  </div>
                  <div className="checkbox-group">
                    <label>
                      <input 
                        type="checkbox" 
                        checked={sketchConfig.preservedMaterialTypes.textures} 
                        onChange={() => handleMaterialTypeToggle('textures')} 
                      />
                      Preserve Textures
                    </label>
                  </div>
                  <div className="checkbox-group">
                    <label>
                      <input 
                        type="checkbox" 
                        checked={sketchConfig.preservedMaterialTypes.metalness} 
                        onChange={() => handleMaterialTypeToggle('metalness')} 
                      />
                      Preserve Metalness
                    </label>
                  </div>
                  <div className="checkbox-group">
                    <label>
                      <input 
                        type="checkbox" 
                        checked={sketchConfig.preservedMaterialTypes.roughness} 
                        onChange={() => handleMaterialTypeToggle('roughness')} 
                      />
                      Preserve Roughness
                    </label>
                  </div>
                  <div className="checkbox-group">
                    <label>
                      <input 
                        type="checkbox" 
                        checked={sketchConfig.preservedMaterialTypes.opacity} 
                        onChange={() => handleMaterialTypeToggle('opacity')} 
                      />
                      Preserve Opacity
                    </label>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
      
      {/* Seção de Bordas */}
      <div className="config-section">
        <div className="section-header" onClick={() => toggleSection('edges')}>
          <h4>Edge Settings</h4>
          <span className={`toggle-icon ${expandedSections.edges ? 'expanded' : ''}`}>▼</span>
        </div>
        
        {expandedSections.edges && (
          <>
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
          </>
        )}
      </div>
      
      {/* Seção de Objetos para Preservação de Material */}
      {sketchConfig.preserveOriginalMaterials && (
        <div className="config-section">
          <div className="section-header" onClick={() => toggleSection('objects')}>
            <h4>Object-Specific Materials</h4>
            <span className={`toggle-icon ${expandedSections.objects ? 'expanded' : ''}`}>▼</span>
          </div>
          
          {expandedSections.objects && (
            <>
              <div className="object-filter">
                <input
                  type="text"
                  placeholder="Filter objects..."
                  value={objectFilter}
                  onChange={(e) => setObjectFilter(e.target.value)}
                />
              </div>
              
              <div className="object-list">
                {filteredObjects.length > 0 ? (
                  filteredObjects.map(obj => (
                    <div key={obj.uuid} className="object-item">
                      <label className="object-label">
                        <input
                          type="checkbox"
                          checked={sketchConfig.preservedObjects.includes(obj.uuid)}
                          onChange={() => handleObjectToggle(obj.uuid)}
                        />
                        <span className="object-name">{obj.name}</span>
                        {obj.materialInfo && obj.materialInfo.color && (
                          <span 
                            className="color-indicator" 
                            style={{ backgroundColor: obj.materialInfo.color }}
                          />
                        )}
                        {obj.materialInfo && obj.materialInfo.hasTexture && (
                          <span className="texture-indicator">T</span>
                        )}
                      </label>
                    </div>
                  ))
                ) : (
                  <div className="no-objects">No objects matching filter</div>
                )}
              </div>
            </>
          )}
        </div>
      )}
      
      <div className="footer">
        <p>Based on <a href="https://github.com/gkjohnson/three-sketch-example" target="_blank" rel="noopener noreferrer">three-sketch-example</a> by Garrett Johnson</p>
      </div>
    </div>
  );
};

export default memo(SketchConfigPanel);