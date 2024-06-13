import React, { useState, useEffect } from "react";
import { Routes, Route, useNavigate, useLocation } from "react-router-dom";
import { getAuth, applyActionCode } from "firebase/auth";
import SceneScreen from "./screens/SceneScreen";
import HomeScreen from "./screens/HomeScreen";
import VerificationModal from "./components/VerificationModal";
import './App.css';
import 'bootstrap/dist/css/bootstrap.min.css';

export default function App() {
  const [user, setUser] = useState(null);
  const [showVerificationModal, setShowVerificationModal] = useState(false);
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
  }, [location]);

  const handleCloseVerificationModal = () => setShowVerificationModal(false);
  const handleLogin = () => {
    setShowVerificationModal(false);
    navigate('/login'); // Redireciona para a tela de login ou outra apropriada
  };

  return (
    <div className="app-container">
      <VerificationModal
        show={showVerificationModal}
        handleClose={handleCloseVerificationModal}
        handleLogin={handleLogin}
      />
      <Routes>
        <Route path="/scene" element={<SceneScreen user={user} />} />
        <Route path="/" element={<HomeScreen />} />
      </Routes>
    </div>
  );
}