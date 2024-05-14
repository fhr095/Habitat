import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import SceneScreen from "./screens/SceneScreen";
import ChatScreen from "./screens/ChatScreen";
import "./App.css";

export default function App() {
  return (
    <div className="app-container">
      <Router>
        <Routes>
          <Route path="/" element={<SceneScreen />} />
          <Route path="/chat" element={<ChatScreen />} />
        </Routes>
      </Router>
    </div>
  );
}
