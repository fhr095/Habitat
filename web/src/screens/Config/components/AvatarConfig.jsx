import React from "react";
import { Card, Form, Button } from "react-bootstrap";
import { FaTimes } from "react-icons/fa";

export default function AvatarConfig({ avatarData, setAvatarData, onClose }) {
  const handleInputChange = (field, value) => {
    setAvatarData((prevData) => ({
      ...prevData,
      [field]: value
    }));
  };

  return (
    <div className="avatar-config-container">
      <Card className="avatar-config-card">
        <Card.Header>
          <Button variant="link" className="close-button" onClick={onClose}>
            <FaTimes size={20} />
          </Button>
        </Card.Header>
        <Card.Body>
          <Form.Group>
            <Form.Label>Nome</Form.Label>
            <Form.Control
              type="text"
              value={avatarData.name}
              onChange={(e) => handleInputChange("name", e.target.value)}
            />
          </Form.Group>
          <Form.Group>
            <Form.Label>Personalidade</Form.Label>
            <Form.Control
              type="text"
              value={avatarData.personality}
              onChange={(e) => handleInputChange("personality", e.target.value)}
            />
          </Form.Group>
          <Form.Group>
            <Form.Label>Criatividade</Form.Label>
            <Form.Control
              type="number"
              value={avatarData.criativity}
              onChange={(e) => handleInputChange("criativity", e.target.value)}
            />
          </Form.Group>
          <Form.Group>
            <Form.Label>Contexto</Form.Label>
            <Form.Control
              type="text"
              value={avatarData.context}
              onChange={(e) => handleInputChange("context", e.target.value)}
            />
          </Form.Group>
        </Card.Body>
      </Card>
    </div>
  );
}