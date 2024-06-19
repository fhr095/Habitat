import React from 'react';
import { Nav } from 'react-bootstrap';
import { FaUser, FaMap, FaRobot, FaPlus } from 'react-icons/fa';

export default function Sidebar({ setActiveTab, profileImageUrl }) {
  return (
    <Nav className="sidebar flex-column">
      <Nav.Item>
        <div className="nav-link" onClick={() => setActiveTab('profile')}>
          <FaUser size={20} />
        </div>
      </Nav.Item>
      <Nav.Item>
        <div className="nav-link" onClick={() => setActiveTab('habitat')}>
          <FaMap size={20} />
        </div>
      </Nav.Item>
      <Nav.Item>
        <div className="nav-link" onClick={() => setActiveTab('ai')}>
          <FaRobot size={20} />
        </div>
      </Nav.Item>
      <Nav.Item>
        <div className="nav-link" onClick={() => setActiveTab('add-widget')}>
          <FaPlus size={20} />
        </div>
      </Nav.Item>
    </Nav>
  );
}