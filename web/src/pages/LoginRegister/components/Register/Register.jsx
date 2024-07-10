import React, { useState } from "react";
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { doc, setDoc } from "firebase/firestore";
import { db } from "../../../../firebase";
import "./Register.scss";

export default function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const navigate = useNavigate();
  const auth = getAuth();

  const handleEmailChange = (e) => {
    setEmail(e.target.value);
  };

  const handlePasswordChange = (e) => {
    setPassword(e.target.value);
  };

  const handleNameChange = (e) => {
    setName(e.target.value);
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      await setDoc(doc(db, "users", user.uid), {
        email: user.email,
        name: name,
        profileImageUrl: ""
      });
      navigate("/home");
    } catch (error) {
      console.error("Erro ao registrar: ", error);
      alert("Erro ao registrar. Tente novamente.");
    }
  };

  return (
    <div className="register">
      <h1>Cadastrar</h1>
      <form onSubmit={handleRegister}>
        <label>
          Nome:
          <input type="text" value={name} onChange={handleNameChange} required />
        </label>
        <label>
          Email:
          <input type="email" value={email} onChange={handleEmailChange} required />
        </label>
        <label>
          Senha:
          <input type="password" value={password} onChange={handlePasswordChange} required />
        </label>
        <button type="submit">Register</button>
      </form>
    </div>
  );
}