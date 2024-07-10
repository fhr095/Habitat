import React, { useState } from "react";
import Login from "./components/Login/Login";
import Register from "./components/Register/Register";
import "./LoginRegister.scss";

import ImageLoginRegister from "../../assets/images/login-register.png";

export default function LoginRegister() {
  const [isLogin, setIsLogin] = useState(false);

  const toggleView = () => {
    setIsLogin(!isLogin);
  };

  return (
    <div className="loginRegister-container">
      <div className={`cover ${isLogin ? "move-right" : "move-left"}`}>
        <img src={ImageLoginRegister} alt="cover" />
        <button onClick={toggleView}>
          {isLogin ? "Já possui uma conta? Faça login" : "Não possui uma conta? Registre-se"}
        </button>
      </div>
      <div className="form-container">
        <Register />
        <Login />
      </div>
    </div>
  );
}