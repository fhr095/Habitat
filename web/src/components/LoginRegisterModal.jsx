import React, { useState } from 'react';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../firebase';
import { Modal, Button, Form } from 'react-bootstrap';
import '../styles/LoginRegisterModal.scss';
import { FcGoogle } from 'react-icons/fc';

export default function LoginRegisterModal({ show, handleClose }) {
  const [isRegister, setIsRegister] = useState(true);

  // Estado do login
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  // Estado do registro
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [profileImage, setProfileImage] = useState(null);
  const [registerError, setRegisterError] = useState('');

  // Função de login
  const handleLogin = async (e) => {
    e.preventDefault();
    const auth = getAuth();
    try {
      await signInWithEmailAndPassword(auth, loginEmail, loginPassword);
      handleClose();
    } catch (error) {
      setLoginError('Falha ao fazer login. Verifique suas credenciais e tente novamente.');
    }
  };

  // Função de login com Google
  const handleGoogleLogin = async () => {
    const auth = getAuth();
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      handleClose();
    } catch (error) {
      setLoginError('Falha ao fazer login com o Google. Tente novamente.');
    }
  };

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

      // Upload profile image to storage
      let profileImageUrl = '';
      if (profileImage) {
        const imageRef = ref(storage, `profile_images/${user.uid}`);
        await uploadBytes(imageRef, profileImage);
        profileImageUrl = await getDownloadURL(imageRef);
      }

      // Save user data to firestore
      await setDoc(doc(db, 'users', user.uid), {
        email: registerEmail,
        name,
        profileImageUrl,
      });

      handleClose();
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

  const handleImageChange = (e) => {
    if (e.target.files[0]) {
      setProfileImage(e.target.files[0]);
    }
  };

  return (
    <Modal show={show} onHide={handleClose} centered size="lg" dialogClassName="modal-90w">
      <Modal.Body className="p-0">
        <div className="d-flex">
          <div className="register-section p-3">
            <h2>Registrar</h2>
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
              <Form.Group className="mb-3">
                <Form.Label>Nome</Form.Label>
                <Form.Control
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Imagem de Perfil</Form.Label>
                <Form.Control
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                />
              </Form.Group>
              {registerError && <p className="text-danger">{registerError}</p>}
              <Button variant="light" type="submit">Registrar</Button>
            </Form>
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
  );
}