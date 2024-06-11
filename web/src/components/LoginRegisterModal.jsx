// src/components/LoginRegisterModal.jsx
import React from "react";
import { Modal, Button } from "react-bootstrap";

export default function LoginRegisterModal({ show, handleClose }) {
  return (
    <Modal show={show} onHide={handleClose}>
      <Modal.Header closeButton>
        <Modal.Title>Login / Cadastro</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {/* Coloque aqui os campos e lógica para login e cadastro */}
        <p>Formulário de login e cadastro será implementado aqui.</p>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={handleClose}>
          Fechar
        </Button>
        <Button variant="primary" onClick={handleClose}>
          Salvar
        </Button>
      </Modal.Footer>
    </Modal>
  );
}