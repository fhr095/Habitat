import React, { useState, useEffect } from "react";
import { FaCogs } from "react-icons/fa";
import axios from "axios";
import { Button, Form, Card, Alert, ProgressBar } from "react-bootstrap";
import "../styles/Avatar.scss";

export default function Avatar({ habitatId }) {
  const [avatarData, setAvatarData] = useState({
    name: "",
    personality: "",
    criativity: 1,
    context: "",
    avt: habitatId,
    data: []
  });
  const [newInfo, setNewInfo] = useState({ info: "", fade: "" });
  const [loading, setLoading] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const [alertVariant, setAlertVariant] = useState("");

  const username = "habitat";
  const password = "lobomau"; 

  useEffect(() => {
    const fetchAvatarData = async () => {
      try {
        const response = await axios.get(`https://roko.flowfuse.cloud/trainDataJSON?utm_source=${habitatId}`, {
          auth: {
            username,
            password
          }
        });
        const data = response.data;
        setAvatarData({
          name: "Teste",
          personality: "Feliz",
          criativity: 1,
          context: "Carro",
          avt: habitatId,
          data: data.data || []  // Garantir que data é uma matriz
        });
      } catch (error) {
        console.error("Erro ao buscar dados do avatar:", error);
      }
    };

    if (habitatId) {
      fetchAvatarData();
    }
  }, [habitatId]);

  const handleInputChange = (index, field, value) => {
    const updatedData = [...avatarData.data];
    updatedData[index][field] = value;
    setAvatarData((prevData) => ({
      ...prevData,
      data: updatedData
    }));
  };

  const handleAddNewInfo = () => {
    setAvatarData((prevData) => ({
      ...prevData,
      data: [...prevData.data, newInfo]
    }));
    setNewInfo({ info: "", fade: "" });
  };

  const handleRemoveInfo = (index) => {
    const updatedData = avatarData.data.filter((_, i) => i !== index);
    setAvatarData((prevData) => ({
      ...prevData,
      data: updatedData
    }));
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const response = await axios.post("https://roko.flowfuse.cloud/trainDataJSON", avatarData, {
        auth: {
          username,
          password
        }
      });
      if (response.status === 200) {
        setAlertMessage("Alterações salvas com sucesso.");
        setAlertVariant("success");
      } else {
        throw new Error("Falha ao salvar as alterações.");
      }
    } catch (error) {
      setAlertMessage("Falha ao salvar as alterações. Tente novamente.");
      setAlertVariant("danger");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="avatar-container">
      <div className="header">
        <Button variant="primary" className="create-avatar-button" onClick={handleAddNewInfo}>
          Adicionar informações
        </Button>
        <Button variant="success" className="save-button" onClick={handleSave}>
          {loading ? "Salvando..." : "Salvar"}
        </Button>
        <Button variant="secondary" className="advanced-settings-button">
          <FaCogs size={20} />
        </Button>
      </div>

      {alertMessage && (
        <Alert variant={alertVariant} onClose={() => setAlertMessage("")} dismissible>
          {alertMessage}
        </Alert>
      )}

      <div className="avatar-cards">
        {avatarData.data.map((data, index) => (
          <Card key={index} className="avatar-card">
            <Card.Body>
              <Form.Group>
                <Form.Label>Info</Form.Label>
                <Form.Control
                  type="text"
                  value={data.info}
                  onChange={(e) => handleInputChange(index, "info", e.target.value)}
                />
              </Form.Group>
              <Form.Group>
                <Form.Label>Fade</Form.Label>
                <Form.Control
                  type="text"
                  value={data.fade}
                  onChange={(e) => handleInputChange(index, "fade", e.target.value)}
                />
              </Form.Group>
              <Button variant="danger" onClick={() => handleRemoveInfo(index)}>
                Remover
              </Button>
            </Card.Body>
          </Card>
        ))}
      </div>

      {loading && (
        <div className="upload-progress">
          <ProgressBar now={loading ? 100 : 0} label={`${loading ? "Salvando" : ""}`} />
        </div>
      )}
    </div>
  );
}