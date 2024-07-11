import React, { useState, useEffect } from "react";
import { doc, getDoc, updateDoc, deleteDoc, collection, getDocs } from "firebase/firestore";
import { db, storage } from "../../../../firebase";
import { FaTimes } from "react-icons/fa";
import "./ModalEditGroup.scss";

export default function ModalEditGroup({ habitatId, selectedGroup, onClose }) {
  const [group, setGroup] = useState(null);
  const [name, setName] = useState("");
  const [imgUrl, setImgUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [groupId, setGroupId] = useState(selectedGroup);

  useEffect(() => {
    const fetchGroup = async () => {
      try {
        const groupRef = doc(db, `habitats/${habitatId}/groups/${groupId}`);
        const groupDoc = await getDoc(groupRef);
        if (groupDoc.exists()) {
          const groupData = groupDoc.data();
          setGroup(groupData);
          setName(groupData.name);
          setImgUrl(groupData.imgUrl);
        }
      } catch (error) {
        console.error("Erro ao buscar grupo: ", error);
      }
    };

    fetchGroup();
  }, [habitatId, groupId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const groupRef = doc(db, `habitats/${habitatId}/groups/${groupId}`);
      await updateDoc(groupRef, {
        name,
        imgUrl,
      });

      alert("Grupo atualizado com sucesso!");
      onClose();
    } catch (error) {
      console.error("Erro ao atualizar grupo: ", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveGroup = async () => {
    setIsSubmitting(true);
    try {
      const groupRef = doc(db, `habitats/${habitatId}/groups/${groupId}`);

      // Deletar subcoleção de mensagens se existir
      const messagesCollection = collection(groupRef, "messages");
      const messagesSnapshot = await getDocs(messagesCollection);
      const deleteMessagesPromises = messagesSnapshot.docs.map((messageDoc) => deleteDoc(messageDoc.ref));
      await Promise.all(deleteMessagesPromises);

      await deleteDoc(groupRef);

      alert("Grupo removido com sucesso!");
      onClose();
    } catch (error) {
      console.error("Erro ao remover grupo: ", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-edit-group">
      <div className="modal-content">
        <span className="close" onClick={onClose}><FaTimes /></span>
        <h2>Editar Grupo</h2>
        <form onSubmit={handleSubmit}>
          <label>
            Nome do Grupo:
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </label>
          <label>
            URL da Imagem:
            <input
              type="text"
              value={imgUrl}
              onChange={(e) => setImgUrl(e.target.value)}
              required
            />
          </label>
          <div>
            <button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Atualizando..." : "Atualizar Grupo"}
            </button>
            <button
              type="button"
              onClick={handleRemoveGroup}
              disabled={isSubmitting}
              className="remove-button"
            >
              Remover Grupo
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}