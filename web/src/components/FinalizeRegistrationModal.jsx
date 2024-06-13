import React, { useState } from 'react';
import { Modal, Button, Form } from 'react-bootstrap';
import { doc, setDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../firebase';

export default function FinalizeRegistrationModal({ show, handleClose, userUid, email }) {
  const [name, setName] = useState('');
  const [profileImage, setProfileImage] = useState(null);
  const [finalizeError, setFinalizeError] = useState('');

  const handleFinalize = async (e) => {
    e.preventDefault();

    try {
      let profileImageUrl = '';
      if (profileImage) {
        const imageRef = ref(storage, `profile_images/${userUid}`);
        await uploadBytes(imageRef, profileImage);
        profileImageUrl = await getDownloadURL(imageRef);
      }

      await setDoc(doc(db, 'users', userUid), {
        email,
        name,
        profileImageUrl,
      });

      handleClose();
    } catch (err) {
      setFinalizeError('Ocorreu um erro ao finalizar o cadastro. Tente novamente mais tarde.');
    }
  };

  const handleImageChange = (e) => {
    if (e.target.files[0]) {
      setProfileImage(e.target.files[0]);
    }
  };

  return (
    <Modal show={show} onHide={handleClose} backdrop="static" keyboard={false} centered>
      <Modal.Header>
        <Modal.Title>Finalize seu Cadastro</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form onSubmit={handleFinalize}>
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
          {finalizeError && <p className="text-danger">{finalizeError}</p>}
          <Button variant="primary" type="submit">Finalizar Cadastro</Button>
        </Form>
      </Modal.Body>
    </Modal>
  );
}