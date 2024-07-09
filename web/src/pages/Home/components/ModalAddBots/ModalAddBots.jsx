import React, { useState } from "react";
import { doc, collection, setDoc } from "firebase/firestore";
import { db, storage } from "../../../../firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import axios from "axios";
import "./ModalAddBots.scss";

export default function ModalAddBots({ onClose, habitatId }) {
  const [botData, setBotData] = useState({
    name: "",
    personality: "",
    creativity: 1,
    context: "",
    avt: "teste carro",
    data: []
  });
  
  const [image, setImage] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setBotData((prevData) => ({ ...prevData, [name]: value }));
  };

  const handleImageChange = (e) => {
    if (e.target.files[0]) {
      setImage(e.target.files[0]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      let imageUrl = "";
      if (image) {
        const storageRef = ref(storage, `bots/${image.name}`);
        await uploadBytes(storageRef, image);
        imageUrl = await getDownloadURL(storageRef);
      }

      const botDataWithImage = { ...botData, imageUrl };

      // Save bot data to Firestore
      const botDocRef = doc(collection(db, "bots"));
      await setDoc(botDocRef, botDataWithImage);

      // Save additional data (name, imageUrl, avt) to a separate collection
      const additionalData = {
        name: botData.name,
        imageUrl,
        avt: botData.avt
      };
      const additionalDataDocRef = doc(collection(db, `habitats/${habitatId}/avatars`));
      await setDoc(additionalDataDocRef, additionalData);

      // Send data to external API without the image URL
      const { name, personality, creativity, context, avt, data } = botData;
      const botDataForAPI = { name, personality, creativity, context, avt, data };
      await axios.post("https://roko.flowfuse.cloud/trainDataJSON", botDataForAPI, {
        auth: {
          username: "habitat",
          password: "lobomau"
        }
      });

      onClose();
    } catch (error) {
      console.error("Error creating bot:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="modal-add-bots">
      <div className="modal-content">
        <span className="close" onClick={onClose}>&times;</span>
        <h2>Criar Novo Bot</h2>
        <form onSubmit={handleSubmit}>
          <label>
            Nome:
            <input type="text" name="name" value={botData.name} onChange={handleChange} required />
          </label>
          <label>
            Personalidade:
            <input type="text" name="personality" value={botData.personality} onChange={handleChange} required />
          </label>
          <label>
            Criatividade:
            <input type="number" name="creativity" value={botData.creativity} onChange={handleChange} min="1" max="5" required />
          </label>
          <label>
            Contexto:
            <textarea name="context" value={botData.context} onChange={handleChange} required />
          </label>
          <label>
            Imagem:
            <input type="file" onChange={handleImageChange} accept="image/*" required />
          </label>
          <button type="submit" disabled={isLoading}>
            {isLoading ? "Carregando..." : "Criar Bot"}
          </button>
        </form>
      </div>
    </div>
  );
}