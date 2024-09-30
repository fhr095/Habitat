// HabitatUserContext.jsx
import React, { createContext, useState, useContext } from 'react';

const HabitatUserContext = createContext();

export function HabitatUserProvider({ children }) {
  const [habitat, setHabitat] = useState({});
  const [user, setUser] = useState({});
  
  // Estados para o chat
  const [chatMember, setChatMember] = useState({});
  const [chatGroup, setChatGroup] = useState({});
  const [chatBot, setChatBot] = useState({});

  return (
    <HabitatUserContext.Provider value={{ 
        habitat, setHabitat, 
        user, setUser, 
        chatMember, setChatMember, 
        chatGroup, setChatGroup, 
        chatBot, setChatBot 
    }}>
      {children}
    </HabitatUserContext.Provider>
  );
}

export function useHabitatUser() {
  return useContext(HabitatUserContext);
}
