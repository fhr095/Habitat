import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import '../styles/LoginScreen.scss';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [salvarLogin, setSalvarLogin] = useState(false);
  const [erro, setErro] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const savedEmail = localStorage.getItem('email');
    const savedSenha = localStorage.getItem('senha');
    if (savedEmail && savedSenha) {
      setEmail(savedEmail);
      setSenha(savedSenha);
      setSalvarLogin(true);
    }
  }, []);

  const handleSubmit = (event) => {
    event.preventDefault();
    signInWithEmailAndPassword(auth, email, senha)
      .then((userCredential) => {
        if (salvarLogin) {
          localStorage.setItem('email', email);
          localStorage.setItem('senha', senha);
        } else {
          localStorage.removeItem('email');
          localStorage.removeItem('senha');
        }
        navigate('/home');
      })
      .catch((error) => {
        setErro('Falha ao fazer login. Verifique suas credenciais e tente novamente.');
      });
  };

  return (
    <div className="loginScreen">
      <form onSubmit={handleSubmit}>
        <h1>Entrar</h1>
        {erro && <p className="error">{erro}</p>}
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
        <div className="remember-me">
          <input
            type="checkbox"
            checked={salvarLogin}
            onChange={(e) => setSalvarLogin(e.target.checked)}
          />
          <label>Salvar login</label>
        </div>
        <button type="submit">Entrar</button>
      </form>
    </div>
  );
}