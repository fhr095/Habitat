import React, { useState, useEffect } from 'react';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, signInWithRedirect, getRedirectResult, sendEmailVerification, signOut } from 'firebase/auth';
import { Modal, Button, Form } from 'react-bootstrap';
import '../styles/LoginRegisterModal.scss';
import { FcGoogle } from 'react-icons/fc';
import FinalizeRegistrationModal from './FinalizeRegistrationModal';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';

export default function LoginRegisterModal({ show, handleClose, handleShowCongrats }) {
  const [showFinalizeModal, setShowFinalizeModal] = useState(false);
  const [userUid, setUserUid] = useState(null);
  const [userEmail, setUserEmail] = useState('');

  // Estado do login
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  // Estado do registro
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [registerError, setRegisterError] = useState('');

  // Função de login
  const handleLogin = async (e) => {
    e.preventDefault();
    const auth = getAuth();
    try {
      const userCredential = await signInWithEmailAndPassword(auth, loginEmail, loginPassword);
      const user = userCredential.user;

      // Verificar se o email foi verificado
      await user.reload();
      if (!user.emailVerified) {
        setLoginError('Por favor, verifique seu email antes de fazer login.');
        await auth.signOut();
        return;
      }

      // Verificar se o usuário já tem um cadastro completo
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (!userDoc.exists()) {
        setUserUid(user.uid);
        setUserEmail(user.email);
        setShowFinalizeModal(true);
        handleClose(); // Fecha o modal de login e cadastro
      } else {
        handleClose();
      }
    } catch (error) {
      setLoginError('Falha ao fazer login. Verifique suas credenciais e tente novamente.');
    }
  };

  // Função de login com Google
  const handleGoogleLogin = async () => {
    const auth = getAuth();
    const provider = new GoogleAuthProvider();
    try {
      await signInWithRedirect(auth, provider);
    } catch (error) {
      setLoginError('Falha ao fazer login com o Google. Tente novamente.');
    }
  };

  // Verificar resultado do redirecionamento
  useEffect(() => {
    const auth = getAuth();
    getRedirectResult(auth)
      .then(async (result) => {
        if (result) {
          const user = result.user;

          await user.reload();
          if (!user.emailVerified) {
            setLoginError('Por favor, verifique seu email antes de fazer login.');
            await auth.signOut();
            return;
          }

          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (!userDoc.exists()) {
            setUserUid(user.uid);
            setUserEmail(user.email);
            setShowFinalizeModal(true);
            handleClose(); // Fecha o modal de login e cadastro
          } else {
            handleClose();
          }
        }
      })
      .catch((error) => {
        setLoginError('Falha ao fazer login com o Google. Tente novamente.');
      });
  }, []);

  // Função de registro
  const handleRegister = async (e) => {
    e.preventDefault();
    const auth = getAuth();
  
    if (registerPassword !== confirmPassword) {
      setRegisterError("As senhas não coincidem");
      return;
    }
  
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, registerEmail, registerPassword);
      const user = userCredential.user;
  
      await sendEmailVerification(user, {
        url: 'https://habitatest.netlify.app/scene',
        handleCodeInApp: true
      });
  
      await signOut(auth);
  
      setUserUid(user.uid);
      setUserEmail(user.email);
      setEmailVerificationSent(true); // Indica que o email de verificação foi enviado
    } catch (err) {
      switch (err.code) {
        case 'auth/email-already-in-use':
          setRegisterError('Este email já está em uso.');
          break;
        case 'auth/invalid-email':
          setRegisterError('Email inválido.');
          break;
        case 'auth/weak-password':
          setRegisterError('A senha deve ter pelo menos 6 caracteres.');
          break;
        default:
          setRegisterError('Ocorreu um erro inesperado. Tente novamente mais tarde.');
          break;
      }
    }
  };

  return (
    <>
      <Modal show={show} onHide={handleClose} centered size="lg" dialogClassName="modal-90w">
        <Modal.Body className="p-0">
          <div className="d-flex">
            <div className="register-section p-3">
              <h2>Registrar</h2>
              {emailVerificationSent ? (
                <p>
                  Um e-mail de verificação foi enviado para {userEmail}. Por favor, verifique seu e-mail para continuar.
                  Após verificar seu e-mail, faça login para completar seu cadastro.
                </p>
              ) : (
                <Form onSubmit={handleRegister}>
                  <Form.Group className="mb-3">
                    <Form.Label>Email</Form.Label>
                    <Form.Control
                      type="email"
                      value={registerEmail}
                      onChange={(e) => setRegisterEmail(e.target.value)}
                      required
                    />
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Label>Senha</Form.Label>
                    <Form.Control
                      type="password"
                      value={registerPassword}
                      onChange={(e) => setRegisterPassword(e.target.value)}
                      required
                    />
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Label>Confirmar Senha</Form.Label>
                    <Form.Control
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                    />
                  </Form.Group>
                  {registerError && <p className="text-danger">{registerError}</p>}
                  <Button variant="light" type="submit">Registrar</Button>
                </Form>
              )}
            </div>
            <div className="login-section p-3">
              <h2>Entrar</h2>
              <Form onSubmit={handleLogin}>
                <Form.Group className="mb-3">
                  <Form.Label>Email</Form.Label>
                  <Form.Control
                    type="email"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    required
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Senha</Form.Label>
                  <Form.Control
                    type="password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    required
                  />
                </Form.Group>
                {loginError && <p className="text-danger">{loginError}</p>}
                <Button variant="primary" type="submit" className="w-100">Entrar</Button>
              </Form>
              <div className="text-center my-3">OU</div>
              <Button onClick={handleGoogleLogin} variant="outline-danger" className="w-100">
                <FcGoogle size={20} className="me-2" />
                Entrar com Google
              </Button>
            </div>
          </div>
        </Modal.Body>
      </Modal>

      <FinalizeRegistrationModal 
        show={showFinalizeModal} 
        handleClose={() => setShowFinalizeModal(false)} 
        userUid={userUid}
        email={userEmail}
        handleShowCongrats={handleShowCongrats} // Passa a função para exibir o modal de parabéns
      />
    </>
  );
}