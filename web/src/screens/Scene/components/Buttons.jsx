import React from "react";
import { FaSignInAlt, FaSignOutAlt } from "react-icons/fa";
import { auth } from "../../../firebase";
import { signOut } from "firebase/auth";
import "../styles/Buttons.scss";

export default function Buttons({ logged, onLoginClick, onLogoutClick }) {
  const handleLogout = () => {
    signOut(auth)
      .then(() => {
        console.log("User logged out");
        onLogoutClick();
      })
      .catch((error) => {
        console.error("Error during logout:", error);
      });
  };

  return (
    <div className="buttons-container">
      <div className="up-buttons">
        {!logged ? (
          <button className="login-button" onClick={onLoginClick}>
            Login/Cadastrar
            <FaSignInAlt color="#004736" size={20} />
          </button>
        ) : (
          <button className="login-button" onClick={handleLogout}>
            Sair
            <FaSignOutAlt color="#004736" size={20} />
          </button>
        )}
      </div>
      <div className="down-buttons"></div>
    </div>
  );
}