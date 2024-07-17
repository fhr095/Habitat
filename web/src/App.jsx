import React, { useEffect, useState } from "react";
import { Routes, Route, useNavigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

import { auth, db } from "./firebase"; 

import Home from "./pages/Home/Home";
import Scene from "./pages/Scene/Scene";
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
        if (window.location.pathname === "/login") {
          navigate("/");
        }
      } else {
        setIsAuthenticated(false);
        navigate("/login");
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  if (isAuthenticated === null) {
    return (
      <div className="loading-page">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      <Routes>
        <Route path="/login" element={<LoginRegister />} />
        <Route path="/scene/:id" element={<Scene user={userData} />} />
        <Route path="/" element={<Home user={userData} />} />
      </Routes>
    </div>
  );
}