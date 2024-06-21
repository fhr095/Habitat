import React from 'react';
import { Modal, Button } from 'react-bootstrap';

export default function CongratsModal({ show, handleClose }) {
  return (
    <Modal show={show} onHide={handleClose} centered>
      <Modal.Header closeButton>
        <Modal.Title>Parabéns!</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p>Parabéns por finalizar seu cadastro gratuito!</p>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="primary" onClick={handleClose}>Fechar</Button>
      </Modal.Footer>
    </Modal>
  );
}