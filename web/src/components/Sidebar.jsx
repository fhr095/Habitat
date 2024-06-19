import React from 'react';
import { Nav } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { FaUser, FaCogs, FaPlus } from 'react-icons/fa';

export default function Sidebar({ setActiveTab, profileImageUrl }) {
  return (
    <Nav className="sidebar flex-column">
      <Nav.Item className="text-center mb-4">
        <img src={profileImageUrl} alt="Profile" className="profile-thumbnail" />
      </Nav.Item>
      <Nav.Item>
        <div className="nav-link" onClick={() => setActiveTab('profile')}>
          <FaUser className="me-2" /> Configuração do Perfil
        </div>
      </Nav.Item>
      <Nav.Item>
        <div className="nav-link" onClick={() => setActiveTab('add-widget')}>  {/* Aqui também deve ser 'add-widget' */}
          <FaPlus className="me-2" /> Adicionar Widget
        </div>
      </Nav.Item>
      <Nav.Item>
        <Link to="/scene" className="nav-link">
          <FaCogs className="me-2" /> Página da Cena
        </Link>
      </Nav.Item>
    </Nav>
  );
}