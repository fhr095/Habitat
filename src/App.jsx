import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import SceneScreen from "./screens/SceneScreen";
import "./App.css";

export default function App() {
  const [isKioskMode, setIsKioskMode] = useState(false);

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

  return (
    <div className="app-container">
      <Router>
        <Routes>
          <Route path="/" element={<SceneScreen isKioskMode={isKioskMode} />} />
        </Routes>
      </Router>
    </div>
  );
}
