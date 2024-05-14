import React from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import SceneScreen from './screens/SceneScreen';
import ChatScreen from './screens/ChatScreen';
import 'bootstrap/dist/css/bootstrap.min.css';

export default function App() {
  return (
    <Router>
      <div>
        <nav>
          <ul>
            <li>
              <Link to="/">Home</Link>
            </li>
            <li>
              <Link to="/chat">Chat</Link>
            </li>
          </ul>
        </nav>

        {/* The Routes component replaces Switch in React Router v6 */}
        <Routes>
          <Route path="/chat" element={<ChatScreen />} />
          <Route path="/" element={<SceneScreen />} />
        </Routes>
      </div>
    </Router>
  );
}
