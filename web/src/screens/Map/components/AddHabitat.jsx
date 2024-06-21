import React, { useState } from "react";
import { Form, Button, ProgressBar } from "react-bootstrap";
import { collection, addDoc } from "firebase/firestore";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { db, storage } from "../../../firebase";
import "../styles/AddHabitat.scss";

export default function AddHabitat({ user }) {
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [glbFile, setGlbFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleFileChange = (e) => {
    setGlbFile(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !address || !glbFile) {
      alert("Por favor, preencha todos os campos e envie um arquivo .glb");
      return;
    }

    setLoading(true);

    try {
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
          alert("Falha ao enviar o arquivo. Tente novamente.");
          setLoading(false);
        },
        async () => {
          const glbPath = await getDownloadURL(uploadTask.snapshot.ref);

          const habitatData = {
            name,
            address,
            glbPath,
            userEmail: user.email,
          };

          await addDoc(collection(db, "habitats"), habitatData);

          setName("");
          setAddress("");
          setGlbFile(null);
          setUploadProgress(0);
          alert("Habitat criado com sucesso");
          setLoading(false);
        }
      );
    } catch (error) {
      console.error("Erro ao criar habitat:", error);
      alert("Falha ao criar o habitat. Tente novamente.");
      setLoading(false);
    }
  };

  return (
    <div className="addHabitat-container">
      <h2>Criar Habitat</h2>
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
            required
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
          {loading && (
            <div className="upload-progress">
              <ProgressBar now={uploadProgress} label={`${Math.round(uploadProgress)}%`} />
            </div>
          )}
        </Form.Group>
        <Button variant="primary" type="submit" disabled={loading}>
          {loading ? "Criando..." : "Criar Habitat"}
        </Button>
      </Form>
    </div>
  );
}