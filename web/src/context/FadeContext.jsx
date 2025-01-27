// src/context/FadeContext.js
import React, { createContext, useContext, useState } from "react";

const FadeContext = createContext();

export function FadeProvider({ children }) {
  const [fadeOptions, setFadeOptions] = useState([]);

  return (
    <FadeContext.Provider value={{ fadeOptions, setFadeOptions }}>
      {children}
    </FadeContext.Provider>
  );
}

export function useFades() {
  return useContext(FadeContext);
}
