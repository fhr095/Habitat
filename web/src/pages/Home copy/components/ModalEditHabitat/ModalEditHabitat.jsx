import React, { useState, useEffect } from "react";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "../../../../firebase";
import { FaTimes } from "react-icons/fa";

import "./ModalEditHabitat.scss";

export default function ModalEditHabitat({ habitatId, onClose }) {
  const [habitatData, setHabitatData] = useState(null);
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [image, setImage] = useState(null);
  const [isPublic, setIsPublic] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchHabitatData = async () => {
      const habitatRef = doc(db, "habitats", habitatId);
      const habitatDoc = await getDoc(habitatRef);
      if (habitatDoc.exists()) {
        const data = habitatDoc.data();
        setHabitatData(data);
        setName(data.name);
        setAddress(data.address);
        setIsPublic(data.isPublic);
      }
    };
    fetchHabitatData();
  }, [habitatId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      let imageUrl = habitatData.imageUrl;

      if (image) {
        const imageRef = ref(storage, `habitats/images/${image.name}`);
        await uploadBytes(imageRef, image);
        imageUrl = await getDownloadURL(imageRef);
      }

      const habitatRef = doc(db, "habitats", habitatId);
      await updateDoc(habitatRef, {
        name,
        address,
        imageUrl,
        isPublic,
      });

      alert("Habitat atualizado com sucesso!");
      onClose();
    } catch (error) {
      console.error("Erro ao atualizar habitat: ", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!habitatData) {
    return null;
  }

  return (
    <div className="modal-edit-habitat">
      <div className="modal-content">
        <span className="close" onClick={onClose}><FaTimes /></span>
        <h2>Editar Habitat</h2>
        <form onSubmit={handleSubmit}>
          <label>
            Nome do Habitat:
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </label>
          <label>
            Endereço:
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
          </label>
          <label>
            Imagem do Habitat:
            <input
              type="file"
              onChange={(e) => setImage(e.target.files[0])}
              accept="image/*"
            />
          </label>
          <label>
            Público:
            <input
              type="checkbox"
              checked={isPublic}
              onChange={(e) => setIsPublic(e.target.checked)}
            />
          </label>
          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Atualizando..." : "Atualizar Habitat"}
          </button>
        </form>
      </div>
    </div>
  );
}