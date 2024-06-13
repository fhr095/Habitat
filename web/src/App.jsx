import React, { useState, useEffect } from "react";
import { Routes, Route, useNavigate, useLocation } from "react-router-dom";
import { getAuth, applyActionCode } from "firebase/auth";
import SceneScreen from "./screens/SceneScreen";
import HomeScreen from "./screens/HomeScreen";
import './App.css';

export default function App() {
  const [user, setUser] = useState(null);
  const [verificationMessage, setVerificationMessage] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const mode = queryParams.get('mode');
    const actionCode = queryParams.get('oobCode');

    if (mode === 'verifyEmail' && actionCode) {
      const auth = getAuth();
      applyActionCode(auth, actionCode)
        .then(() => {
          setVerificationMessage('Email verificado com sucesso! Redirecionando para a cena...');
          navigate('/scene'); // Redireciona para a tela de SceneScreen
        })
        .catch((error) => {
          setVerificationMessage('Erro ao verificar email. O link pode ter expirado ou já ter sido usado.');
        });
    }
  }, [location, navigate]);

  return (
    <div className="app-container">
      {verificationMessage && <p>{verificationMessage}</p>}
      <Routes>
        <Route path="/scene" element={<SceneScreen user={user} />} />
        <Route path="/" element={<HomeScreen />} />
      </Routes>
    </div>
  );
}