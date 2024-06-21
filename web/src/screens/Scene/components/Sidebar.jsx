import React from "react";
import { Nav } from "react-bootstrap";
import { FaUser, FaMap, FaRobot, FaPlus, FaFolder } from 'react-icons/fa';

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
      <Nav.Item>
        <div className="nav-link" onClick={() => setActiveComponent("AIComponent")}>
          <FaRobot size={20} />
        </div>
      </Nav.Item>
    </Nav>
  );
}