import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import SceneScreen from './screens/SceneScreen';
import ChatScreen from './screens/ChatScreen'; // Assume you have this component

export default function App() {
  return (
    <Router>
      <div className='app-container'>
        <Routes>
          <Route path="/" element={<SceneScreen />} />
          <Route path="/chat" element={<ChatScreen />} />
        </Routes>
      </div>
    </Router>
  );
}
