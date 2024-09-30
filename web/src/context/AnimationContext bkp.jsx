import { createContext, useContext, useState, useCallback } from 'react';

// Criação do contexto
const AnimationContext = createContext();

// Hook para acessar facilmente o contexto
export const useAnimations = () => useContext(AnimationContext);

// Provedor do contexto que envolve os componentes que precisarão acessar as animações
export const AnimationProvider = ({ children }) => {
  const [animations, setAnimations] = useState([]);  // Estado para armazenar as animações

  // Função para resetar animações (se necessário)
  const resetAnimations = useCallback(() => {
    setAnimations([]);
  }, []);

  return (
    <AnimationContext.Provider value={{ animations, setAnimations, resetAnimations }}>
      {children}
    </AnimationContext.Provider>
  );
};
