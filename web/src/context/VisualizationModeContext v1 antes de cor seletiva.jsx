// VisualizationModeContext.jsx
import React, { createContext, useState, useContext, useMemo, useCallback } from 'react';

// Configurações padrão para o modo sketch
const defaultSketchConfig = {
  colors: 'LIGHT',
  backgroundColor: '#0d2a28',
  modelColor: '#0d2a28',
  lineColor: '#ffb400',
  shadowColor: '#44491f',
  lit: false,
  opacity: 0.85,
  threshold: 40,
  display: 'THRESHOLD_EDGES',
  displayConditionalEdges: true,
  thickness: 1,
  useThickLines: false
};

// Constantes para os temas de cores
const LIGHT_THEME = {
  backgroundColor: '#eeeeee',
  modelColor: '#ffffff',
  lineColor: '#455A64',
  shadowColor: '#c4c9cb'
};

const DARK_THEME = {
  backgroundColor: '#111111',
  modelColor: '#111111',
  lineColor: '#b0bec5',
  shadowColor: '#2c2e2f'
};

// Criação do contexto
export const VisualizationModeContext = createContext();

// Hook personalizado para acessar o contexto
export const useVisualizationMode = () => useContext(VisualizationModeContext);

export const VisualizationModeProvider = ({ children }) => {
  // Estado para o modo atual
  const [currentMode, setCurrentMode] = useState('normal');
  
  // Estado para as configurações do modo sketch
  const [sketchConfig, setSketchConfig] = useState(defaultSketchConfig);
  
  // Função para alternar entre os modos - agora memoizada para não mudar entre renderizações
  const switchMode = useCallback((mode) => {
    if (mode === 'normal' || mode === 'sketch') {
      setCurrentMode(mode);
    }
  }, []);
  
  // Função para atualizar uma configuração específica do modo sketch - também memoizada
  const updateSketchConfig = useCallback((key, value) => {
    setSketchConfig(prev => ({
      ...prev,
      [key]: value
    }));
  }, []);
  
  // Função para definir um tema de cores predefinido - memoizada
  const setColorTheme = useCallback((theme) => {
    if (theme === 'LIGHT') {
      setSketchConfig(prev => ({
        ...prev,
        colors: 'LIGHT',
        ...LIGHT_THEME
      }));
    } else if (theme === 'DARK') {
      setSketchConfig(prev => ({
        ...prev,
        colors: 'DARK',
        ...DARK_THEME
      }));
    }
  }, []);
  
  // Função para randomizar as cores - memoizada
  const randomizeColors = useCallback(() => {
    const hue = Math.random();
    const saturation = Math.random() * 0.2 + 0.8;
    const lightness = Math.random() * 0.2 + 0.4;
    
    // Converter HSL para hexadecimal
    const hslToHex = (h, s, l) => {
      const toRgb = (p, q, t) => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1/6) return p + (q - p) * 6 * t;
        if (t < 1/2) return q;
        if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
        return p;
      };
      
      let r, g, b;
      if (s === 0) {
        r = g = b = l;
      } else {
        const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        const p = 2 * l - q;
        r = toRgb(p, q, h + 1/3);
        g = toRgb(p, q, h);
        b = toRgb(p, q, h - 1/3);
      }
      
      const toHex = x => {
        const hex = Math.round(x * 255).toString(16);
        return hex.length === 1 ? '0' + hex : hex;
      };
      
      return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
    };
    
    const lineColor = hslToHex(hue, saturation, lightness);
    const backgroundColor = hslToHex(
      (hue + 0.35 + 0.3 * Math.random()) % 1.0,
      saturation * (0.25 + Math.random() * 0.75),
      1.0 - lightness
    );
    
    // Calcular uma cor intermediária para sombra
    const shadowColor = (() => {
      const r1 = parseInt(lineColor.slice(1, 3), 16);
      const g1 = parseInt(lineColor.slice(3, 5), 16);
      const b1 = parseInt(lineColor.slice(5, 7), 16);
      
      const r2 = parseInt(backgroundColor.slice(1, 3), 16);
      const g2 = parseInt(backgroundColor.slice(3, 5), 16);
      const b2 = parseInt(backgroundColor.slice(5, 7), 16);
      
      const r = Math.round(r1 * 0.3 + r2 * 0.7).toString(16).padStart(2, '0');
      const g = Math.round(g1 * 0.3 + g2 * 0.7).toString(16).padStart(2, '0');
      const b = Math.round(b1 * 0.3 + b2 * 0.7).toString(16).padStart(2, '0');
      
      return `#${r}${g}${b}`;
    })();
    
    setSketchConfig(prev => ({
      ...prev,
      colors: 'CUSTOM',
      lineColor,
      backgroundColor,
      modelColor: backgroundColor,
      shadowColor
    }));
  }, []);
  
  // Memoiza o valor do contexto para evitar renderizações desnecessárias
  const contextValue = useMemo(() => ({
    currentMode, 
    switchMode, 
    sketchConfig, 
    updateSketchConfig,
    setColorTheme,
    randomizeColors
  }), [
    currentMode, 
    switchMode, 
    sketchConfig, 
    updateSketchConfig,
    setColorTheme,
    randomizeColors
  ]);
  
  return (
    <VisualizationModeContext.Provider value={contextValue}>
      {children}
    </VisualizationModeContext.Provider>
  );
};