import React, { useState, useEffect } from 'react';
import { getAuth, updateProfile, deleteUser } from 'firebase/auth';
import { doc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from '../firebase';
import { Container, Form, Button, Row, Col, Image } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';

export default function ProfileSettings() {
  const [name, setName] = useState('');
  const [profileImage, setProfileImage] = useState(null);
  const [profileImageUrl, setProfileImageUrl] = useState('');
  const navigate = useNavigate();
  const auth = getAuth();
  const user = auth.currentUser;

  useEffect(() => {
    if (user) {
      const userDocRef = doc(db, 'users', user.uid);
      getDoc(userDocRef).then((docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          setName(data.name);
          setProfileImageUrl(data.profileImageUrl);
        }
      });
    }
  }, [user]);

  const handleNameChange = (e) => setName(e.target.value);

  const handleImageChange = (e) => setProfileImage(e.target.files[0]);

  const handleSave = async () => {
    if (user) {
      let imageUrl = profileImageUrl;
      if (profileImage) {
        const imageRef = ref(storage, `profile_images/${user.uid}`);
        await uploadBytes(imageRef, profileImage);
        imageUrl = await getDownloadURL(imageRef);
      }

      await updateProfile(user, { displayName: name, photoURL: imageUrl });
      const userDocRef = doc(db, 'users', user.uid);
      await updateDoc(userDocRef, { name, profileImageUrl: imageUrl });

      setProfileImageUrl(imageUrl);
      setProfileImage(null);
      alert('Perfil atualizado com sucesso!');
    }
  };

  const handleDeleteAccount = async () => {
    if (user) {
      try {
        const userDocRef = doc(db, 'users', user.uid);
        await deleteDoc(userDocRef);

        const imageRef = ref(storage, `profile_images/${user.uid}`);
        await deleteObject(imageRef);

        await deleteUser(user);
        alert('Conta deletada com sucesso!');
        navigate('/');
      } catch (error) {
        console.error('Erro ao deletar a conta:', error);
        alert('Erro ao deletar a conta. Tente novamente mais tarde.');
      }
    }
  };

  return (
    <Container className="profile-settings">
      <h1 className="text-center mb-4">Configurações do Usuário</h1>
      <Form className="config-form">
        <Form.Group as={Row} className="mb-3" controlId="formPlaintextName">
          <Form.Label column sm="2">Nome:</Form.Label>
          <Col sm="10">
            <Form.Control type="text" value={name} onChange={handleNameChange} />
          </Col>
        </Form.Group>
        <Form.Group as={Row} className="mb-3" controlId="formFile">
          <Form.Label column sm="2">Foto do Perfil:</Form.Label>
          <Col sm="10">
            <Form.Control type="file" onChange={handleImageChange} />
          </Col>
        </Form.Group>
        {profileImageUrl && (
          <div className="text-center mb-3">
            <Image src={profileImageUrl} alt="Profile" roundedCircle className="profile-image" />
          </div>
        )}
        <Row className="justify-content-center">
          <Col xs="auto">
            <Button variant="primary" onClick={handleSave} className="save-button">
              Salvar
            </Button>
          </Col>
          <Col xs="auto">
            <Button variant="danger" onClick={handleDeleteAccount} className="delete-button">
              Deletar Conta
            </Button>
          </Col>
        </Row>
      </Form>
    </Container>
  );
}