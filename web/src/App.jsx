import React, { useEffect, useState } from "react";
import { Routes, Route, useNavigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

import { auth, db } from "./firebase"; // Certifique-se de ajustar o caminho conforme necessário
import Home from "./pages/Home/Home";0
import LoginRegister from "./pages/LoginRegister/LoginRegister";

import 'bootstrap/dist/css/bootstrap.min.css';
import "./App.css";

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(null);
  const [userData, setUserData] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setIsAuthenticated(true);
        const userDocRef = doc(db, "users", user.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          setUserData(userDoc.data());
        } else {
          console.error("No such document!");
        }
        navigate("/");
      } else {
        setIsAuthenticated(false);
        navigate("/login");
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  if (isAuthenticated === null) {
    // Você pode mostrar um loader ou algo enquanto verifica a autenticação
    return <div>Loading...</div>;
  }

  return (
    <div className="app-container">
      <Routes>
        <Route path="/login" element={<LoginRegister />} />
        <Route path="/" element={<Home user={userData} />} />
      </Routes>
    </div>
  );
}