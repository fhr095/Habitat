import React, { useState, useEffect } from "react";
import { Routes, Route, useNavigate, useLocation } from "react-router-dom";
import { getAuth, applyActionCode } from "firebase/auth";

import ConfigScreen from "./screens/Config/ConfigScreen";
import MapScreen from "./screens/Map/MapScreen";
import HomeScreen from "./screens/Home/HomeScreen";

import VerificationModal from "./screens/Map/components/VerificationModal";
import LoginRegisterModal from "./screens/Map/components/LoginRegisterModal";
import CongratsModal from "./screens/Map/components/CongratsModal";

import './App.css';
import 'bootstrap/dist/css/bootstrap.min.css';

export default function App() {
  const [user, setUser] = useState(null);
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showCongratsModal, setShowCongratsModal] = useState(false);
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
          setShowVerificationModal(true);
        })
        .catch((error) => {
          console.error('Erro ao verificar email:', error);
        });
    }

    const auth = getAuth();
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        setUser(user);
      } else {
        setUser(null);
      }
    });

    return () => unsubscribe();
  }, [location]);

  const handleCloseVerificationModal = () => setShowVerificationModal(false);
  const handleOpenLoginModal = () => {
    setShowVerificationModal(false);
    setShowLoginModal(true);
  };
  const handleCloseLoginModal = () => setShowLoginModal(false);
  const handleShowCongratsModal = () => setShowCongratsModal(true);
  const handleCloseCongratsModal = () => setShowCongratsModal(false);

  return (
    <div className="app-container">
      <VerificationModal
        show={showVerificationModal}
        handleClose={handleCloseVerificationModal}
        handleLogin={handleOpenLoginModal}
      />
      <LoginRegisterModal
        show={showLoginModal}
        handleClose={handleCloseLoginModal}
        handleShowCongrats={handleShowCongratsModal}
      />
      <CongratsModal
        show={showCongratsModal}
        handleClose={handleCloseCongratsModal}
      />
      <Routes>
        <Route path="/config" element={<ConfigScreen user={user} onLoginClick={handleOpenLoginModal} onLogoutClick={() => setUser(null)} />} />
        <Route path="/map" element={<MapScreen user={user} onLoginClick={handleOpenLoginModal} onLogoutClick={() => setUser(null)} />} />
        <Route path="/" element={<HomeScreen />} />
      </Routes>
    </div>
  );
}