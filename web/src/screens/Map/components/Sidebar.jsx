import React from "react";
import { Nav } from "react-bootstrap";
import { FaUser, FaPlus, FaFolder } from 'react-icons/fa';  // Importa os ícones necessários

import "../styles/Sidebar.scss";

export default function Sidebar({ activeComponent, setActiveComponent }) {

  const handleComponentToggle = (component) => {
    if (activeComponent === component) {
      setActiveComponent(null);
    } else {
      setActiveComponent(component);
    }
  };

  return (
    <Nav className="sidebar flex-column">
      <Nav.Item>
        <div className="nav-link" onClick={() => handleComponentToggle("Profile")}>
          <FaUser size={20} />
        </div>
      </Nav.Item>
      <Nav.Item>
        <div className="nav-link" onClick={() => handleComponentToggle("AddHabitat")}>
          <FaPlus size={20} />
        </div>
      </Nav.Item>
      <Nav.Item>
        <div className="nav-link" onClick={() => handleComponentToggle("ListHabitats")}>
          <FaFolder size={20} />
        </div>
      </Nav.Item>
    </Nav>
  );
}