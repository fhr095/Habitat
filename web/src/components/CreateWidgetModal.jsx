import React, { useState } from 'react';
import { Modal, Button, Form } from 'react-bootstrap';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { collection, addDoc } from 'firebase/firestore';
import { storage, db } from '../firebase';

export default function CreateWidgetModal({ show, handleClose }) {
  const [content, setContent] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [finalizeError, setFinalizeError] = useState('');

  const handleContentChange = (e) => {
    setContent(e.target.value);
  };

  const handleImageChange = (e) => {
    setImageFile(e.target.files[0]);
  };

  const handleUpload = async () => {
    if (!imageFile) return '';

    const imageRef = ref(storage, `widgets/${imageFile.name}`);
    await uploadBytes(imageRef, imageFile);
    return await getDownloadURL(imageRef);
  };

  const handleSubmit = async () => {
    try {
      const imageUrl = await handleUpload();
      const widgetData = { content, imageUrl };
      await addDoc(collection(db, 'widgets'), widgetData);
      setContent('');
      setImageFile(null);
      handleClose();
    } catch (err) {
      setFinalizeError('Ocorreu um erro ao carregar a imagem. Tente novamente mais tarde.');
    }
  };

  return (
    <Modal show={show} onHide={handleClose} centered>
      <Modal.Header closeButton>
        <Modal.Title>Criar Widget</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form>
          <Form.Group controlId="formContent">
            <Form.Label>Conteúdo</Form.Label>
            <Form.Control
              as="textarea"
              rows={4}
              value={content}
              onChange={handleContentChange}
              placeholder="Enter text content"
              required
            />
          </Form.Group>
          <Form.Group controlId="formImageUpload">
            <Form.Label>Upload Imagem</Form.Label>
            <Form.Control type="file" onChange={handleImageChange} />
          </Form.Group>
          {finalizeError && <p className="text-danger">{finalizeError}</p>}
        </Form>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={handleClose}>
          Cancelar
        </Button>
        <Button variant="primary" onClick={handleSubmit}>
          Criar Widget
        </Button>
      </Modal.Footer>
    </Modal>
  );
}