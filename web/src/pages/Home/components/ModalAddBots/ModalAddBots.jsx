import React, { useState } from "react";
import { doc, collection, setDoc } from "firebase/firestore";
import { db, storage } from "../../../../firebase";
import { ref, uploadString, getDownloadURL } from "firebase/storage";
import axios from "axios";
import "./ModalAddBots.scss";

export default function ModalAddBots({ onClose, habitatId }) {
  const [botData, setBotData] = useState({
    name: "",
    personality: "",
    creativity: 1,
    context: "",
    avt: habitatId,
    data: []
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [image, setImage] = useState(null);
  const [imageUrl, setImageUrl] = useState("");

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setBotData({ ...botData, [name]: value });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result);
        setImageUrl(URL.createObjectURL(file));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await axios.post("https://roko.flowfuse.cloud/trainDataJSON", botData, {
        auth: {
          username: "habitat",
          password: "lobomau"
        }
      });

      let downloadURL = "";
      if (image) {
        const imageRef = ref(storage, `avatars/${botData.name}-${Date.now()}`);
        await uploadString(imageRef, image, 'data_url');
        downloadURL = await getDownloadURL(imageRef);
      }

      const newBotRef = doc(collection(db, `habitats/${habitatId}/avatars`));
      await setDoc(newBotRef, { name: botData.name, avt: habitatId, imageUrl: downloadURL });

      alert("Bot adicionado com sucesso!");
      onClose();
    } catch (error) {
      console.error("Erro ao adicionar bot: ", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-add-bots">
      <div className="modal-content">
        <span className="close" onClick={onClose}>&times;</span>
        <h2>Adicionar Bot</h2>
        <form onSubmit={handleSubmit}>
          <label>
            Nome do Bot:
            <input
              type="text"
              name="name"
              value={botData.name}
              onChange={handleInputChange}
              required
            />
          </label>
          <label>
            Personalidade do Bot:
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
              min="1"
              max="10"
              value={botData.creativity}
              onChange={handleInputChange}
              required
            />
          </label>
          <label>
            Contexto:
            <input
              type="text"
              name="context"
              value={botData.context}
              onChange={handleInputChange}
              required
            />
          </label>
          <label>
            Imagem do Bot:
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              required
            />
          </label>
          {imageUrl && (
            <img src={imageUrl} alt="Bot" style={{ width: "100px", height: "100px" }} />
          )}
          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Adicionando..." : "Adicionar Bot"}
          </button>
        </form>
      </div>
    </div>
  );
}