import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import SceneScreen from "./screens/SceneScreen";
import LoginScreen from "./screens/LoginScreen";
import RegisterScreen from "./screens/RegisterScreen";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import "./App.css";

export default function App() {
  const [isKioskMode, setIsKioskMode] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUser(user);
      } else {
        setUser(null);
      }
    });

    return () => unsubscribe();
  }, []);

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
    const params = new URLSearchParams(location.search);
    const kiosk = params.get("kiosk");
    setIsKioskMode(kiosk === "true");
  }, [location]);

  return (
    <div className="app-container">
      <Router>
        <Routes>
          <Route path="/login" element={<LoginScreen />} />
          <Route path="/register" element={<RegisterScreen />} />
          <Route path="/" element={<SceneScreen isKioskMode={isKioskMode} sceneWidthPercent={1.3} sceneHeightPercent={1.3} user={user} />} />
        </Routes>
      </Router>
    </div>
  );
}