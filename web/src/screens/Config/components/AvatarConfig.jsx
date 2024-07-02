import React, { useEffect } from "react";
import { Card, Form, Button } from "react-bootstrap";
import { FaTimes } from "react-icons/fa";
import axios from "axios";

import { MAPBOX_TOKEN } from "../../../MapBoxTokem.js";

export default function AvatarConfig({ avatarData, setAvatarData, onClose, address }) {
  const handleInputChange = (field, value) => {
    setAvatarData((prevData) => ({
      ...prevData,
      [field]: value,
    }));
  };

  useEffect(() => {
    const fetchPOIs = async (coordinates) => {
      try {
        const response = await axios.get(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${coordinates}.json`,
          {
            params: {
              types: "poi",
              access_token: MAPBOX_TOKEN,
              proximity: coordinates,
              radius: 1000,
            },
          }
        );

        const pois = response.data.features.map((feature) => feature.text);
        const existingContext = avatarData.context || "";
        const updatedContext = [...new Set([...existingContext.split(", "), ...pois])].join(", ");

        setAvatarData((prevData) => ({
          ...prevData,
          context: updatedContext,
        }));
      } catch (error) {
        console.error("Erro ao buscar POIs:", error);
      }
    };

    const geocodeAddress = async () => {
      try {
        const response = await axios.get(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${address}.json`,
          {
            params: {
              access_token: MAPBOX_TOKEN,
            },
          }
        );

        if (response.data.features.length > 0) {
          const coordinates = response.data.features[0].center;
          fetchPOIs(coordinates);
        }
      } catch (error) {
        console.error("Erro ao geocodificar endereço:", error);
      }
    };

    if (address) {
      geocodeAddress();
    }
  }, [address, avatarData.context, setAvatarData]);

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