import React, { useEffect} from "react";
import { Routes, Route, useNavigate, useLocation } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

import { auth, db } from "./firebase";
import Scene from "./pages/Scene/Scene";

import 'bootstrap/dist/css/bootstrap.min.css';
import "./App.css";
import { HabitatUserProvider, useHabitatUser } from './context/HabitatUserContext';
import { SceneConfigProvider } from './context/SceneConfigContext'; // Importa o contexto de configuração da cena
import { AnimationProvider } from './context/AnimationContext'; // Importa o contexto de animações
import { ModelProvider } from './context/ModelContext';

export default function App() {
  return (
    <HabitatUserProvider>
      <MainApp />
    </HabitatUserProvider>
  );
}

function MainApp() {
  const { setUser, habitat } = useHabitatUser(); // Agora usando o contexto para gerenciar o user
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const userDocRef = doc(db, "users", user.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          setUser(userDoc.data()); // Armazena o userData completo no contexto
        }
        if (window.location.pathname === "/login") {
          navigate("/");
        }
      } else {
        if (!location.pathname.startsWith("/scene/")) {
          navigate("/login");
        }
      }
    });

    return () => unsubscribe();
  }, [navigate, location, setUser]);



  // Spinner de carregamento enquanto o usuário não é autenticado
  return (
    <div className="app-container">
      <Routes>
        <Route 
          path="/scene/:id" 
          element={
            <SceneConfigProvider>
              <ModelProvider>
                <AnimationProvider>
                  <Scene 
                    key={habitat.id} // Usa habitat.id como key para forçar a recriação do componente
                    mainFileUrl={habitat.mainFileUrl}
                    mobileFileUrl={habitat.mobileFileUrl}
                    fade={habitat.fade}
                    address={habitat.address}
                    // Pass URLs for both models
                  />
                </AnimationProvider>
              </ModelProvider>
            </SceneConfigProvider>
          } 
        />
      </Routes>
    </div>
  );
}
