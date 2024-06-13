import React from 'react';
import { Modal, Button } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';

export default function VerificationModal({ show, handleClose, handleLogin }) {
  return (
    <Modal show={show} onHide={handleClose} centered>
      <Modal.Header closeButton>
        <Modal.Title>Email Verificado</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p>Email verificado com sucesso! Por favor, faça login para continuar.</p>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="primary" onClick={handleLogin}>
          Fazer Login
        </Button>
      </Modal.Footer>
    </Modal>
  );
}