import React, { useState, useEffect } from "react";
import * as THREE from "three";
import "./OrientationControls.scss";

/**
 * Controles para personalizar a orientação espacial na interface
 * Permite ao usuário escolher tipo de caminho e cores
 */
const OrientationControls = ({ 
  onPathTypeChange, 
  onColorChange, 
  active = false,
  onToggleVisibility
}) => {
  const [pathType, setPathType] = useState(2); // 0 = linha, 1 = pontilhado, 2 = setas
  const [color, setColor] = useState("#29B6F6");
  const [isVisible, setIsVisible] = useState(false);
  
  // Opções de cores predefinidas
  const colorOptions = [
    { name: "Azul", value: "#29B6F6" },
    { name: "Laranja", value: "#FF7D45" },
    { name: "Verde", value: "#4CAF50" },
    { name: "Roxo", value: "#9C27B0" },
    { name: "Vermelho", value: "#F44336" }
  ];
  
  // Opções de tipo de caminho
  const pathTypes = [
    { name: "Linha", value: 0 },
    { name: "Pontilhado", value: 1 },
    { name: "Setas", value: 2 }
  ];
  
  // Efeito para mostrar/ocultar controles baseado no estado "active"
  useEffect(() => {
    if (active) {
      setIsVisible(true);
    } else {
      setIsVisible(false);
    }
  }, [active]);
  
  // Handler para mudança de tipo de caminho
  const handlePathTypeChange = (newType) => {
    setPathType(newType);
    if (onPathTypeChange) onPathTypeChange(newType);
  };
  
  // Handler para mudança de cor
  const handleColorChange = (newColor) => {
    setColor(newColor);
    // Converte hex para THREE.Color para compatibilidade com o sistema
    const threeColor = new THREE.Color(newColor);
    if (onColorChange) onColorChange(threeColor.getHex());
  };
  
  // Toggle de visibilidade
  const toggleVisibility = () => {
    const newVisibility = !isVisible;
    setIsVisible(newVisibility);
    if (onToggleVisibility) onToggleVisibility(newVisibility);
  };
  
  if (!active) return null;
  
  return (
    <div className={`orientation-controls ${isVisible ? 'expanded' : 'collapsed'}`}>
      <button className="toggle-button" onClick={toggleVisibility}>
        {isVisible ? '✕' : '⟲'}
      </button>
      
      {isVisible && (
        <div className="controls-panel">
          <div className="control-section">
            <h3>Tipo de Caminho</h3>
            <div className="path-type-options">
              {pathTypes.map((type) => (
                <button
                  key={type.value}
                  className={pathType === type.value ? 'active' : ''}
                  onClick={() => handlePathTypeChange(type.value)}
                >
                  {type.name}
                </button>
              ))}
            </div>
          </div>
          
          <div className="control-section">
            <h3>Cor</h3>
            <div className="color-options">
              {colorOptions.map((option) => (
                <button
                  key={option.value}
                  className={`color-btn ${color === option.value ? 'active' : ''}`}
                  style={{ backgroundColor: option.value }}
                  onClick={() => handleColorChange(option.value)}
                  aria-label={option.name}
                ></button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrientationControls;