import React from "react";
import { Nav } from "react-bootstrap";
import { FaCogs, FaUserPlus, FaPlusSquare } from 'react-icons/fa';

import "../styles/Sidebar.scss";

export default function Sidebar({ setActiveComponent }) {
  return (
    <Nav className="sidebar flex-column">
      <Nav.Item>
        <div className="nav-link" onClick={() => setActiveComponent("HabitatConfig")}>
          <FaCogs size={20} />
        </div>
      </Nav.Item>
      <Nav.Item>
        <div className="nav-link" onClick={() => setActiveComponent("AddAvatar")}>
          <FaUserPlus size={20} />
        </div>
      </Nav.Item>
      <Nav.Item>
        <div className="nav-link" onClick={() => setActiveComponent("AddWidget")}>
          <FaPlusSquare size={20} />
        </div>
      </Nav.Item>
    </Nav>
  );
}