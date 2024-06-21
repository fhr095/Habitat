import React from "react";
import { Nav } from "react-bootstrap";
import { FaUser, FaPlus, FaFolder } from 'react-icons/fa';  // Importa os ícones necessários

import "../styles/Sidebar.scss";

export default function Sidebar({ setActiveComponent }) {
  return (
    <Nav className="sidebar flex-column">
      <Nav.Item>
        <div className="nav-link" onClick={() => setActiveComponent("Profile")}>
          <FaUser size={20} />
        </div>
      </Nav.Item>
      <Nav.Item>
        <div className="nav-link" onClick={() => setActiveComponent("AddHabitat")}>
          <FaPlus size={20} />
        </div>
      </Nav.Item>
      <Nav.Item>
        <div className="nav-link" onClick={() => setActiveComponent("ListHabitats")}>
          <FaFolder size={20} />
        </div>
      </Nav.Item>
    </Nav>
  );
}