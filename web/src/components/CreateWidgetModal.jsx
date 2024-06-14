import React, { useState } from 'react';
import { Modal, Button, Form } from 'react-bootstrap';

export default function CreateWidgetModal({ show, handleClose, handleCreate }) {
  const [content, setContent] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    handleCreate(content);
    setContent('');
  };

  return (
    <Modal show={show} onHide={handleClose} centered>
      <Modal.Header closeButton>
        <Modal.Title>Criar Widget</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-3">
            <Form.Label>Conteúdo</Form.Label>
            <Form.Control
              type="text"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              required
            />
          </Form.Group>
          <Button variant="primary" type="submit">Criar</Button>
        </Form>
      </Modal.Body>
    </Modal>
  );
}