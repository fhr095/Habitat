import React, { useState, useEffect } from "react";
import { Routes, Route, useNavigate, useLocation } from "react-router-dom";
import { getAuth, applyActionCode } from "firebase/auth";
import SceneScreen from "./screens/SceneScreen";
import HomeScreen from "./screens/HomeScreen";
import './App.css';

export default function App() {
  const [isKioskMode, setIsKioskMode] = useState(false);
  const [user, setUser] = useState(null);
  const [verificationMessage, setVerificationMessage] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "k" || event.key === "K") {
        toggleKioskMode();
      }
    };

    const toggleKioskMode = () => {
      setIsKioskMode((prevMode) => !prevMode);
      if (!isKioskMode) {
        if (document.documentElement.requestFullscreen) {
          document.documentElement.requestFullscreen();
        } else if (document.documentElement.mozRequestFullScreen) { /* Firefox */
          document.documentElement.mozRequestFullScreen();
        } else if (document.documentElement.webkitRequestFullscreen) { /* Chrome, Safari and Opera */
          document.documentElement.webkitRequestFullscreen();
        } else if (document.documentElement.msRequestFullscreen) { /* IE/Edge */
          document.documentElement.msRequestFullscreen();
        }
      } else {
        if (document.exitFullscreen) {
          document.exitFullscreen();
        } else if (document.mozCancelFullScreen) { /* Firefox */
          document.mozCancelFullScreen();
        } else if (document.webkitExitFullscreen) { /* Chrome, Safari and Opera */
          document.webkitExitFullscreen();
        } else if (document.msExitFullscreen) { /* IE/Edge */
          document.msExitFullscreen();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isKioskMode]);

  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const mode = queryParams.get('mode');
    const actionCode = queryParams.get('oobCode');

    if (mode === 'verifyEmail' && actionCode) {
      const auth = getAuth();
      applyActionCode(auth, actionCode)
        .then(() => {
          setVerificationMessage('Email verificado com sucesso! Você pode agora fazer login.');
          navigate('/login'); // ou qualquer outra rota apropriada
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
        <Route path="/scene" element={<SceneScreen isKioskMode={isKioskMode} sceneWidthPercent={1.3} sceneHeightPercent={1.3} user={user} />} />
        <Route path="/" element={<HomeScreen />} />
      </Routes>
    </div>
  );
}