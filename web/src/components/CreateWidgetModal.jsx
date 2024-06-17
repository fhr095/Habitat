import React, { useState } from 'react';
import { Modal, Button, Form } from 'react-bootstrap';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { collection, addDoc } from 'firebase/firestore';
import { storage, db } from '../firebase';

export default function CreateWidgetModal({ show, handleClose }) {
  const [content, setContent] = useState('');
  const [imageFiles, setImageFiles] = useState([]);
  const [finalizeError, setFinalizeError] = useState('');

  const handleContentChange = (e) => {
    setContent(e.target.value);
  };

  const handleImageChange = (e) => {
    setImageFiles(Array.from(e.target.files));
  };

  const handleUpload = async () => {
    const imageUrls = [];
    for (const file of imageFiles) {
      const imageRef = ref(storage, `widgets/${file.name}`);
      await uploadBytes(imageRef, file);
      const imageUrl = await getDownloadURL(imageRef);
      imageUrls.push(imageUrl);
    }
    return imageUrls;
  };

  const handleSubmit = async () => {
    try {
      const imageUrls = await handleUpload();
      const widgetData = { content, imageUrls };
      await addDoc(collection(db, 'widgets'), widgetData);
      setContent('');
      setImageFiles([]);
      handleClose();
    } catch (err) {
      setFinalizeError('Ocorreu um erro ao carregar as imagens. Tente novamente mais tarde.');
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
            <Form.Label>Upload Imagens</Form.Label>
            <Form.Control type="file" onChange={handleImageChange} multiple />
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