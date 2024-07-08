import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import '../styles/LoginScreen.scss';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const navigate = useNavigate();

  const handleSubmit = (event) => {
    event.preventDefault();
    signInWithEmailAndPassword(auth, email, senha)
      .then((userCredential) => {
        navigate('/');
      })
      .catch((error) => {
        setErro('Falha ao fazer login. Verifique suas credenciais e tente novamente.');
      });
  };

  return (
    <div className="loginScreen">
      <form onSubmit={handleSubmit}>
        <h1>Entrar</h1>
        {erro && <p className="erro">{erro}</p>}
        <input
          placeholder="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          placeholder="Senha"
          type="password"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
        />
        <button type="submit">Entrar</button>
      </form>
    </div>
  );
}