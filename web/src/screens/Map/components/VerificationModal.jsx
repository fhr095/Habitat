import React from 'react';
import { Modal, Button } from 'react-bootstrap';

export default function VerificationModal({ show, handleClose, handleLogin }) {
  return (
    <Modal show={show} onHide={handleClose} centered>
      <Modal.Header closeButton>
        <Modal.Title>Verificação de Email</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p>Email verificado com sucesso! Agora você pode fazer login.</p>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="primary" onClick={handleLogin}>Fazer Login</Button>
      </Modal.Footer>
    </Modal>
  );
}