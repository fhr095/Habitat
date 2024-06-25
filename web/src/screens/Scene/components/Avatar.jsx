import React, { useState, useEffect } from "react";
import { FaCogs, FaPlus, FaCheck } from "react-icons/fa";
import axios from "axios";
import { Button, Form, Card, Alert, ProgressBar, Image } from "react-bootstrap";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { getDoc, updateDoc, doc } from "firebase/firestore";
import { db, storage } from "../../../firebase";
import "../styles/Avatar.scss";

import AvatarConfig from "./AvatarConfig";

export default function Avatar({ habitatId, modelParts, setSelectedPart, resetModel }) {
  const [avatarData, setAvatarData] = useState({
    name: "",
    personality: "",
    criativity: 1,
    context: "",
    avt: habitatId,
    data: []
  });
  const [newInfo, setNewInfo] = useState({ info: "", fade: "" });
  const [avatarImageFile, setAvatarImageFile] = useState(null);
  const [avatarImageUrl, setAvatarImageUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [alertMessage, setAlertMessage] = useState("");
  const [alertVariant, setAlertVariant] = useState("");
  const [showAdvancedConfig, setShowAdvancedConfig] = useState(false);

  const username = "habitat";
  const password = "lobomau"; 

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
        name: data.name || "",
        personality: data.personality || "",
        criativity: data.criativity || 1,
        context: data.context || "",
        avt: habitatId,
        data: data.data || []
      });

      // Fetch the avatar image URL from Firestore
      const habitatDocRef = doc(db, "habitats", habitatId);
      const habitatDoc = await getDoc(habitatDocRef);
      if (habitatDoc.exists()) {
        const habitatData = habitatDoc.data();
        setAvatarImageUrl(habitatData.avatarImage || "");
      }
    } catch (error) {
      console.error("Erro ao buscar dados do avatar:", error);
    }
  };

  useEffect(() => {
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
    if (field === "fade") {
      setSelectedPart(value);
    }
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

  const handleAvatarImageChange = (e) => {
    setAvatarImageFile(e.target.files[0]);
  };

  const handleSaveAvatarImage = async () => {
    if (!avatarImageFile) return;
    setLoading(true);
    try {
      const avatarStorageRef = ref(storage, `avatars/${avatarImageFile.name}`);
      const avatarUploadTask = uploadBytesResumable(avatarStorageRef, avatarImageFile);
      await new Promise((resolve, reject) => {
        avatarUploadTask.on(
          "state_changed",
          (snapshot) => {
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            setUploadProgress(progress);
          },
          (error) => {
            console.error("Erro ao enviar imagem de avatar:", error);
            reject(error);
          },
          async () => {
            const avatarImagePath = await getDownloadURL(avatarUploadTask.snapshot.ref);
            const habitatDocRef = doc(db, "habitats", habitatId);
            await updateDoc(habitatDocRef, { avatarImage: avatarImagePath });
            setAvatarImageUrl(avatarImagePath);
            setAlertMessage("Imagem de avatar salva com sucesso.");
            setAlertVariant("success");
            resolve();
          }
        );
      });
    } catch (error) {
      setAlertMessage("Falha ao salvar a imagem do avatar. Tente novamente.");
      setAlertVariant("danger");
    } finally {
      setLoading(false);
    }
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
        await fetchAvatarData(); // Atualiza a lista de informações após salvar
        resetModel(); // Chama a função para resetar o modelo
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
    <div className="avatar-container-wrapper">
      <div className="avatar-container">
        <div className="header">
          <div className="avatar-image-section">
            <label htmlFor="avatar-image-upload" className="avatar-image-label">
              {avatarImageUrl ? (
                <Image src={avatarImageUrl} roundedCircle className="avatar-image" />
              ) : (
                <div className="avatar-image-placeholder">Avatar</div>
              )}
            </label>
            <Form.Control
              type="file"
              accept="image/*"
              id="avatar-image-upload"
              onChange={handleAvatarImageChange}
              className="avatar-image-upload"
            />
            <Button
              variant="primary"
              className="save-avatar-image-button"
              onClick={handleSaveAvatarImage}
              disabled={loading || !avatarImageFile}
            >
              <FaCheck size={16} />
            </Button>
          </div>
          <div className="button-group">
            <Button variant="primary" className="create-avatar-button" onClick={handleAddNewInfo}>
              <FaPlus size={16} /> Informações
            </Button>
            <Button variant="success" className="save-button" onClick={handleSave}>
              {loading ? "Salvando..." : "Salvar"}
            </Button>
            <Button 
              variant="secondary" 
              className="advanced-settings-button"
              onClick={() => setShowAdvancedConfig(!showAdvancedConfig)}
            >
              <FaCogs size={20} />
            </Button>
          </div>
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
                    as="select"
                    value={data.fade}
                    onChange={(e) => handleInputChange(index, "fade", e.target.value)}
                  >
                    <option value="">Selecione uma parte</option>
                    {modelParts.map((part, idx) => (
                      <option key={idx} value={part}>{part}</option>
                    ))}
                  </Form.Control>
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

      {showAdvancedConfig && (
        <AvatarConfig 
          avatarData={avatarData}
          setAvatarData={setAvatarData}
          onClose={() => setShowAdvancedConfig(false)}
        />
      )}
    </div>
  );
}