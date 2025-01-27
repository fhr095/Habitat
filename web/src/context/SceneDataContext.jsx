// src/context/SceneDataContext.jsx
import React, { createContext, useContext, useState, useCallback } from "react";

const SceneDataContext = createContext();

export function SceneDataProvider({ children }) {
  // Estado para guardar opções de fade, antes usado no FadeContext
  const [fadeOptions, setFadeOptions] = useState([]);

  // Estado para registrar a função highlightFade, antes no SceneContext
  const [highlightFadeFn, setHighlightFadeFn] = useState(() => () => {});

  // Função para registrar highlightFade
  const registerHighlightFade = useCallback((fn) => {
    setHighlightFadeFn(() => fn);
  }, []);

  return (
    <SceneDataContext.Provider
      value={{
        fadeOptions,
        setFadeOptions,
        highlightFade: highlightFadeFn,
        registerHighlightFade
      }}
    >
      {children}
    </SceneDataContext.Provider>
  );
}

export function useSceneData() {
  return useContext(SceneDataContext);
}
