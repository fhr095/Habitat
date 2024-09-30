import React, { createContext, useState, useContext } from 'react';

const HabitatUserContext = createContext();

export function HabitatUserProvider({ children }) {
  const [habitat, setHabitat] = useState({});
  const [user, setUser] = useState({});

  return (
    <HabitatUserContext.Provider value={{ habitat, setHabitat, user, setUser }}>
      {children}
    </HabitatUserContext.Provider>
  );
}

export function useHabitatUser() {
  return useContext(HabitatUserContext);
}
