import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import SceneScreen from './screens/SceneScreen';
import ChatScreen from './screens/ChatScreen';
import './App.css';

export default function App() {
  return (
    <BrowserRouter>
      <div className='app-container'>
        <Routes>
          <Route path="/" element={<SceneScreen />} />
          <Route path="/chat" element={<ChatScreen />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}