import React, { createContext, useState } from 'react';

export const ModelContext = createContext();

export const ModelProvider = ({ children }) => {
  const [currentModel, setCurrentModel] = useState('model1'); // Valores possíveis: 'model1', 'model2', 'both'

  return (
    <ModelContext.Provider value={{ currentModel, setCurrentModel }}>
      {children}
    </ModelContext.Provider>
  );
};
