import React from "react";
import { BrowserRouter as Router, Route, Switch, Link } from "react-router-dom";
import SceneScreen from "./screens/SceneScreen";
import ChatScreen from "./screens/ChatScreen"; // Import the ChatScreen component
import "bootstrap/dist/css/bootstrap.min.css";

function App() {
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

        {/* A <Switch> looks through its children <Route>s and
            renders the first one that matches the current URL. */}
        <Switch>
          <Route path="/">
            <SceneScreen />
          </Route>
          <Route path="/chat">
            <ChatScreen />
          </Route>
        </Switch>
      </div>
    </Router>
  );
}

export default App;
