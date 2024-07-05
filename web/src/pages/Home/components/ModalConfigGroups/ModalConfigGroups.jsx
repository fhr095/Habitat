import React, { useState } from "react";
import { doc, updateDoc, deleteDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { db, storage } from "../../../../firebase";

import "./ModalConfigGroups.scss";

export default function ModalConfigGroups({ group, habitatId, onClose }) {
  const [groupName, setGroupName] = useState(group.name);
  const [groupImage, setGroupImage] = useState(null);
  const [groupMembers, setGroupMembers] = useState(group.users.filter(user => user !== group.admin));
  const [newMember, setNewMember] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = (e) => {
    setGroupImage(e.target.files[0]);
  };

  const handleAddMember = () => {
    if (newMember.trim() !== "" && !groupMembers.includes(newMember.trim())) {
      setGroupMembers([...groupMembers, newMember.trim()]);
      setNewMember("");
    }
  };

  const handleUpdateGroup = async (e) => {
    e.preventDefault();
    setIsUploading(true);

    let imageUrl = group.imgUrl;

    if (groupImage) {
      const imageRef = ref(storage, `groups/${habitatId}/${groupImage.name}`);
      const snapshot = await uploadBytes(imageRef, groupImage);
      imageUrl = await getDownloadURL(snapshot.ref);
    }

    try {
      const groupRef = doc(db, `habitats/${habitatId}/groups/${group.id}`);
      await updateDoc(groupRef, {
        name: groupName,
        imgUrl: imageUrl,
        users: [group.admin, ...groupMembers],
      });
      alert("Grupo atualizado com sucesso!");
      onClose();
    } catch (error) {
      console.error("Erro ao atualizar grupo: ", error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteGroup = async () => {
    try {
      // Deletar a imagem do grupo do Storage
      if (group.imgUrl) {
        const imageRef = ref(storage, group.imgUrl);
        await deleteObject(imageRef);
      }

      // Deletar o documento do grupo do Firestore
      const groupRef = doc(db, `habitats/${habitatId}/groups/${group.id}`);
      await deleteDoc(groupRef);

      alert("Grupo deletado com sucesso.");
      onClose();
      window.location.reload();
    } catch (error) {
      console.error("Erro ao deletar grupo: ", error);
    }
  };

  const handleRemoveMember = async (email) => {
    const updatedMembers = groupMembers.filter(member => member !== email);
    setGroupMembers(updatedMembers);

    try {
      const groupRef = doc(db, `habitats/${habitatId}/groups/${group.id}`);
      await updateDoc(groupRef, {
        users: [group.admin, ...updatedMembers],
      });
      alert("Membro removido com sucesso!");
    } catch (error) {
      console.error("Erro ao remover membro: ", error);
    }
  };

  return (
    <div className="modal-config-group">
      <div className="modal-content">
        <span className="close" onClick={onClose}>&times;</span>
        <h2>Configurações do Grupo</h2>
        <form onSubmit={handleUpdateGroup}>
          <label>
            Nome do Grupo:
            <input
              type="text"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              required
            />
          </label>
          <label>
            Imagem do Grupo:
            <input
              type="file"
              onChange={handleFileChange}
              accept="image/*"
            />
          </label>
          <label>
            Membros do Grupo:
            <ul className="members-list">
              {groupMembers.map((member, index) => (
                <li key={index}>
                  {member}
                  <button type="button" onClick={() => handleRemoveMember(member)}>
                    Remover
                  </button>
                </li>
              ))}
            </ul>
            <div className="add-member">
              <input
                type="text"
                placeholder="Adicionar novo membro"
                value={newMember}
                onChange={(e) => setNewMember(e.target.value)}
              />
              <button type="button" onClick={handleAddMember}>
                Adicionar
              </button>
            </div>
          </label>
          <button type="submit" disabled={isUploading}>
            {isUploading ? "Atualizando..." : "Atualizar"}
          </button>
        </form>
        <button onClick={handleDeleteGroup} className="delete-button">
          Deletar Grupo
        </button>
      </div>
    </div>
  );
}