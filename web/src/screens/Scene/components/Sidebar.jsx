import React from "react";
import { Nav } from "react-bootstrap";
import { FaUser, FaMap, FaRobot, FaPlus, FaFolder } from 'react-icons/fa';

import "../styles/Sidebar.scss";

export default function Sidebar() {
    return (
        <Nav className="sidebar flex-column">
            <Nav.Item>
                <div className="nav-link">
                    <FaUser size={20} />
                </div>
            </Nav.Item>
            <Nav.Item>
                <div className="nav-link">
                    <FaPlus size={20} />
                </div>
            </Nav.Item>
            <Nav.Item>
                <div className="nav-link">
                    <FaFolder size={20} />
                </div>
            </Nav.Item>
            <Nav.Item>
                <div className="nav-link">
                    <FaRobot size={20} />
                </div>
            </Nav.Item>
        </Nav>
    );
    }