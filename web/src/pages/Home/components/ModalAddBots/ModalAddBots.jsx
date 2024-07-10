import React, { useState } from "react";
import { doc, collection, setDoc } from "firebase/firestore";
import { db, storage } from "../../../../firebase";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import axios from "axios";
import "./ModalAddBots.scss";

export default function ModalAddBots({ onClose, habitatId }) {
  const [botData, setBotData] = useState({
    name: "",
    personality: "",
    creativity: 1,
    context: "",
    avt: habitatId,
    data: [{
      info: "",
      fade: "",
    }]
  });
  const [imageFile, setImageFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const username = "habitat";
  const password = "lobomau";

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setBotData((prevData) => ({ ...prevData, [name]: value }));
  };

  const handleImageChange = (e) => {
    setImageFile(e.target.files[0]);
  };

  const handleSaveImage = async () => {
    if (!imageFile) return "";
    setLoading(true);
    try {
      const storageRef = ref(storage, `avatars/${imageFile.name}`);
      const uploadTask = uploadBytesResumable(storageRef, imageFile);
      const downloadURL = await new Promise((resolve, reject) => {
        uploadTask.on(
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
            const url = await getDownloadURL(uploadTask.snapshot.ref);
            resolve(url);
          }
        );
      });
      return downloadURL;
    } catch (error) {
      console.error("Erro ao salvar imagem do avatar: ", error);
      return "";
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Upload image if present
      const imageURL = await handleSaveImage();

      // Send data to external API
      const { name, personality, creativity, context, avt, data } = botData;
      const botDataForAPI = { name, personality, creativity, context, avt, data };

      const response = await axios.post("https://roko.flowfuse.cloud/trainDataJSON", botDataForAPI, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Basic ${btoa(`${username}:${password}`)}`
        }
      });

      if (response.status !== 200) {
        throw new Error("Falha ao adicionar bot.");
      }

      // Save bot data in Firestore
      const newBotRef = doc(collection(db, `habitats/${habitatId}/avatars`));
      await setDoc(newBotRef, {
        name: botData.name,
        avt: habitatId,
        imageUrl: imageURL
      });

      alert("Bot adicionado com sucesso!");
      onClose();
    } catch (error) {
      console.error("Error creating bot:", error);
      alert("Erro ao adicionar bot: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-add-bots">
      <div className="modal-content">
        <span className="close" onClick={onClose}>&times;</span>
        <h2>Adicionar Bot</h2>
        <form onSubmit={handleSubmit}>
          <label>
            Nome:
            <input
              type="text"
              name="name"
              value={botData.name}
              onChange={handleInputChange}
              required
            />
          </label>
          <label>
            Personalidade:
            <input
              type="text"
              name="personality"
              value={botData.personality}
              onChange={handleInputChange}
              required
            />
          </label>
          <label>
            Criatividade:
            <input
              type="number"
              name="creativity"
              value={botData.creativity}
              onChange={handleInputChange}
              min="1"
              max="5"
              required
            />
          </label>
          <label>
            Contexto:
            <textarea
              name="context"
              value={botData.context}
              onChange={handleInputChange}
              required
            />
          </label>
          <label>
            Imagem:
            <input type="file" onChange={handleImageChange} accept="image/*" required />
          </label>
          <button type="submit" disabled={loading}>
            {loading ? "Carregando..." : "Adicionar Bot"}
          </button>
        </form>
      </div>
    </div>
  );
}