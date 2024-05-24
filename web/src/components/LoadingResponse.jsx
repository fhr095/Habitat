import React from "react";
import { AiOutlineRobot } from "react-icons/ai";
import ClipLoader from "react-spinners/ClipLoader";
import "bootstrap/dist/css/bootstrap.min.css";
import '../styles/LoadingResponse.scss';

export default function LoadingResponse() {
  return (
    <div className="loading-response-container">
      <div className="message-wrapper">
        <div className="bot-icon">
          <AiOutlineRobot size={24} color="black" />
        </div>
        <div className="message-container">
          <p>Carregando...</p>
          <ClipLoader color={"#000"} size={24} />
        </div>
      </div>
    </div>
  );
}
