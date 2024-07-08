import React from "react";
import ClipLoader from "react-spinners/ClipLoader";
import "bootstrap/dist/css/bootstrap.min.css";
import '../styles/LoadingResponse.scss';

import { FaTimes } from "react-icons/fa";

import Avatar from "../assets/images/Avatar.png"; // Importando a imagem

export default function LoadingResponse({ onCancel }) {
  return (
    <div className="loading-response-container">
      <div className="message-wrapper">
        <div className="bot-icon">
          <img src={Avatar} alt="Avatar" style={{ width: '30px', height: '30px' }} /> {/* Substituindo o ícone pelo avatar */}
        </div>
        <div className="message-container">
          <p>Carregando...</p>
          <ClipLoader color={"#000"} size={24} />
          <button className="cancel-button" onClick={onCancel}>
            <FaTimes size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}