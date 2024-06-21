import React from "react";
import { Nav } from "react-bootstrap";
import { FaCogs, FaUserPlus, FaPlusSquare, FaArrowLeft } from 'react-icons/fa';
import { useNavigate } from "react-router-dom";

import "../styles/Sidebar.scss";

export default function Sidebar({ setActiveComponent }) {
  const navigate = useNavigate();

  return (
    <Nav className="sidebar flex-column">
      <Nav.Item>
        <div className="nav-link" onClick={() => navigate('/map')}>
          <FaArrowLeft size={20} />
        </div>
      </Nav.Item>
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