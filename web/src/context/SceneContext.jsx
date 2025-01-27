// src/context/SceneContext.js
import React, { createContext, useContext, useState, useCallback } from "react";

const SceneContext = createContext();

export function SceneProvider({ children }) {
  const [highlightFadeFn, setHighlightFadeFn] = useState(() => () => {});

  const registerHighlightFade = useCallback((fn) => {
    setHighlightFadeFn(() => fn);
  }, []);

  return (
    <SceneContext.Provider value={{ highlightFade: highlightFadeFn, registerHighlightFade }}>
      {children}
    </SceneContext.Provider>
  );
}

export function useSceneActions() {
  return useContext(SceneContext);
}
