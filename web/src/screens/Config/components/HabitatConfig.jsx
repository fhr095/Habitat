import React, { useState, useEffect } from "react";
import { Form, Button, Alert, ProgressBar } from "react-bootstrap";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { db, storage } from "../../../firebase";
import { useLocation } from "react-router-dom";

import '../styles/HabitatConfig.scss';

export default function HabitatConfig() {
  const [habitatData, setHabitatData] = useState({
    name: "",
    address: "",
    glbPath: ""
  });
  const [newGlbFile, setNewGlbFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [alertMessage, setAlertMessage] = useState("");
  const [alertVariant, setAlertVariant] = useState("");
  const location = useLocation();

  useEffect(() => {
    const fetchHabitatData = async () => {
      const queryParams = new URLSearchParams(location.search);
      const habitatId = queryParams.get("id");

      if (habitatId) {
        try {
          const habitatDocRef = doc(db, "habitats", habitatId);
          const habitatDoc = await getDoc(habitatDocRef);
          if (habitatDoc.exists()) {
            setHabitatData({ id: habitatId, ...habitatDoc.data() });
          } else {
            console.error("Habitat não encontrado");
          }
        } catch (error) {
          console.error("Erro ao buscar dados do habitat:", error);
        }
      }
    };

    fetchHabitatData();
  }, [location]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setHabitatData((prevData) => ({
      ...prevData,
      [name]: value
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setNewGlbFile(file);
  };

  const handleSaveChanges = async () => {
    setLoading(true);
    try {
      let glbPath = habitatData.glbPath;

      if (newGlbFile) {
        const storageRef = ref(storage, `habitats/${newGlbFile.name}`);
        const uploadTask = uploadBytesResumable(storageRef, newGlbFile);

        uploadTask.on(
          "state_changed",
          (snapshot) => {
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            setUploadProgress(progress);
          },
          (error) => {
            console.error("Erro ao fazer upload do arquivo:", error);
            setAlertMessage("Falha ao fazer upload do arquivo. Tente novamente.");
            setAlertVariant("danger");
            setLoading(false);
          },
          async () => {
            glbPath = await getDownloadURL(uploadTask.snapshot.ref);
            const habitatDocRef = doc(db, "habitats", habitatData.id);
            await updateDoc(habitatDocRef, {
              name: habitatData.name,
              address: habitatData.address,
              glbPath
            });
            setAlertMessage("Habitat atualizado com sucesso.");
            setAlertVariant("success");
            setUploadProgress(0);
            setLoading(false);
          }
        );
      } else {
        const habitatDocRef = doc(db, "habitats", habitatData.id);
        await updateDoc(habitatDocRef, {
          name: habitatData.name,
          address: habitatData.address,
          glbPath
        });
        setAlertMessage("Habitat atualizado com sucesso.");
        setAlertVariant("success");
        setLoading(false);
      }
    } catch (error) {
      console.error("Erro ao atualizar habitat:", error);
      setAlertMessage("Falha ao atualizar o habitat. Tente novamente.");
      setAlertVariant("danger");
      setLoading(false);
    }
  };

  return (
    <div className="components-container">
      <h2>Configurar Habitat</h2>
      {alertMessage && (
        <Alert variant={alertVariant} onClose={() => setAlertMessage("")} dismissible>
          {alertMessage}
        </Alert>
      )}
      <Form>
        <Form.Group className="mb-3 form-group">
          <Form.Label className="form-label">Nome</Form.Label>
          <Form.Control
            type="text"
            name="name"
            value={habitatData.name}
            onChange={handleInputChange}
            className="form-control"
          />
        </Form.Group>
        <Form.Group className="mb-3 form-group">
          <Form.Label className="form-label">Endereço</Form.Label>
          <Form.Control
            type="text"
            name="address"
            value={habitatData.address}
            onChange={handleInputChange}
            className="form-control"
          />
        </Form.Group>
        <Form.Group className="mb-3 form-group">
          <Form.Label className="form-label">Modelo 3D (.glb)</Form.Label>
          <Form.Control
            type="file"
            accept=".glb"
            onChange={handleFileChange}
            className="form-control"
          />
          {newGlbFile && (
            <ProgressBar now={uploadProgress} label={`${Math.round(uploadProgress)}%`} className="mb-3" />
          )}
        </Form.Group>
        <Button variant="primary" onClick={handleSaveChanges} disabled={loading} className="btn-primary">
          {loading ? <div className="spinner-border spinner-border-sm" role="status"></div> : "Salvar Alterações"}
        </Button>
      </Form>
    </div>
  );
}