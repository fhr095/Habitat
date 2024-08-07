import React from "react";
import "./Loader.scss";

export default function Loader() {
  return (
    <div className="loader">
      <div className="spinner"></div>
      <p>Carregando...</p>
    </div>
  );
}