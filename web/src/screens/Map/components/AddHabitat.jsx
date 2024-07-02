import React, { useState } from "react";
import { Form, Button, ProgressBar, Alert } from "react-bootstrap";
import { collection, addDoc, getDocs, query, where } from "firebase/firestore";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { db, storage } from "../../../firebase";
import "../styles/AddHabitat.scss";

export default function AddHabitat({ user }) {
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [glbFile, setGlbFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [alertMessage, setAlertMessage] = useState("");
  const [alertVariant, setAlertVariant] = useState("");

  const handleFileChange = (e) => {
    setGlbFile(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!name || !glbFile) {
      setAlertMessage("Por favor, preencha todos os campos e envie um arquivo .glb");
      setAlertVariant("danger");
      return;
    }

    setLoading(true);

    try {
      if (address) {
        // Verificar se o endereço já está cadastrado
        const addressQuery = query(collection(db, "habitats"), where("address", "==", address));
        const querySnapshot = await getDocs(addressQuery);

        if (!querySnapshot.empty) {
          setAlertMessage("O endereço já está cadastrado.");
          setAlertVariant("danger");
          setLoading(false);
          return;
        }
      }

      const storageRef = ref(storage, `habitats/${glbFile.name}`);
      const uploadTask = uploadBytesResumable(storageRef, glbFile);

      uploadTask.on(
        "state_changed",
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setUploadProgress(progress);
        },
        (error) => {
          console.error("Erro ao enviar arquivo:", error);
          setAlertMessage("Falha ao enviar o arquivo. Tente novamente.");
          setAlertVariant("danger");
          setLoading(false);
        },
        async () => {
          const glbPath = await getDownloadURL(uploadTask.snapshot.ref);

          const habitatData = {
            name,
            address,
            glbPath,
            userEmail: user.email,
            avatarImage: ""
          };

          await addDoc(collection(db, "habitats"), habitatData);

          setName("");
          setAddress("");
          setGlbFile(null);
          setUploadProgress(0);
          setAlertMessage("Habitat criado com sucesso");
          setAlertVariant("success");
          setLoading(false);
        }
      );
    } catch (error) {
      console.error("Erro ao criar habitat:", error);
      setAlertMessage("Falha ao criar o habitat. Tente novamente.");
      setAlertVariant("danger");
      setLoading(false);
    }
  };

  return (
    <div className="addHabitat-container">
      <h2>Criar Habitat</h2>
      {alertMessage && (
        <Alert variant={alertVariant} onClose={() => setAlertMessage("")} dismissible>
          {alertMessage}
        </Alert>
      )}
      <Form onSubmit={handleSubmit}>
        <Form.Group className="mb-3">
          <Form.Label>Nome</Form.Label>
          <Form.Control
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </Form.Group>
        <Form.Group className="mb-3">
          <Form.Label>Endereço</Form.Label>
          <Form.Control
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
          />
        </Form.Group>
        <Form.Group className="mb-3">
          <Form.Label>Enviar Modelo .glb</Form.Label>
          <Form.Control
            type="file"
            accept=".glb"
            onChange={handleFileChange}
            required
          />
          {glbFile && (
            <ProgressBar now={uploadProgress} label={`${Math.round(uploadProgress)}%`} className="mb-3" />
          )}
        </Form.Group>
        <Button variant="primary" type="submit" disabled={loading}>
          {loading ? <div className="spinner-border spinner-border-sm" role="status"></div> : "Criar Habitat"}
        </Button>
      </Form>
    </div>
  );
}