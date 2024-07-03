import React from "react";

import Login from "./components/Login/Login";
import Register from "./components/Register/Register";

import "./LoginRegister.scss";

export default function LoginRegister() {
    return (
        <div className="loginRegister-container">
            <Register />
            <Login />
        </div>
    );
    }