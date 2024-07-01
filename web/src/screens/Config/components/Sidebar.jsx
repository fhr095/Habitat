import React from "react";
import { Nav } from "react-bootstrap";
import { FaCog, FaLock, FaUserPlus, FaPlusSquare, FaArrowLeft, FaStar, FaEye } from 'react-icons/fa';
import { useNavigate } from "react-router-dom";

import "../styles/Sidebar.scss";

export default function Sidebar({ activeComponent, setActiveComponent, habitatId }) {
  const navigate = useNavigate();

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
        <div className="nav-link" onClick={() => handleComponentToggle("HabitatConfig")}>
          <FaCog size={20} />
        </div>
      </Nav.Item>
      <Nav.Item>
        <div className="nav-link" onClick={() => handleComponentToggle("AccessConfig")}>
          <FaLock size={20} />
        </div>
      </Nav.Item>
      <Nav.Item>
        <div className="nav-link" onClick={() => handleComponentToggle("Avatar")}>
          <FaUserPlus size={20} />
        </div>
      </Nav.Item>
      <Nav.Item>
        <div className="nav-link" onClick={() => handleComponentToggle("AddWidget")}>
          <FaPlusSquare size={20} />
        </div>
      </Nav.Item>
      <Nav.Item>
        <div className="nav-link" onClick={() => handleComponentToggle("Reviews")}>
          <FaStar size={20} />
        </div>
      </Nav.Item>
      <Nav.Item>
        <div className="nav-link" onClick={() => navigate(`/scene?id=${habitatId}`)}>
          <FaEye  size={20} />
        </div>
      </Nav.Item>
      <Nav.Item>
        <div className="nav-link" onClick={() => navigate("/map")}>
          <FaArrowLeft size={20} />
        </div>
      </Nav.Item>
    </Nav>
  );
}