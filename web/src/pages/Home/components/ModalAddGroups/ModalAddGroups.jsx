import React, { useState } from "react";
import { collection, addDoc, doc, updateDoc, getDoc, arrayUnion } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "../../../../firebase";
import "./ModalAddGroups.scss";

export default function ModalAddGroups({ habitatId, onClose, userEmail }) {
  const [groupName, setGroupName] = useState("");
  const [groupImage, setGroupImage] = useState(null);
  const [currentMember, setCurrentMember] = useState("");
  const [groupMembers, setGroupMembers] = useState([userEmail]); // Adiciona o criador como membro
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = (e) => {
    setGroupImage(e.target.files[0]);
  };

  const handleAddMember = (e) => {
    e.preventDefault();
    if (currentMember.trim() === "" || groupMembers.includes(currentMember.trim())) return;
    setGroupMembers([...groupMembers, currentMember.trim()]);
    setCurrentMember("");
  };

  const handleRemoveMember = (memberToRemove) => {
    setGroupMembers(groupMembers.filter(member => member !== memberToRemove));
  };

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    if (groupName.trim() === "") return;

    setIsUploading(true);

    let imageUrl = "";

    if (groupImage) {
      const imageRef = ref(storage, `groups/${habitatId}/${groupImage.name}`);
      const snapshot = await uploadBytes(imageRef, groupImage);
      imageUrl = await getDownloadURL(snapshot.ref);
    }

    try {
      const groupData = {
        name: groupName,
        imgUrl: imageUrl || "",
        users: groupMembers,
        admin: userEmail, // Define o criador como administrador
        createdAt: new Date(),
      };

      const groupRef = await addDoc(collection(db, `habitats/${habitatId}/groups`), groupData);

      // Adicionar grupo aos usuários
      for (const email of groupMembers) {
        const userRef = doc(db, "users", email);
        const userDoc = await getDoc(userRef);

        if (userDoc.exists()) {
          await updateDoc(userRef, {
            groups: arrayUnion(groupRef.id),
          });
        } else {
          console.warn(`Documento do usuário não encontrado para o email: ${email}`);
        }
      }

      alert("Grupo criado com sucesso!");
      setGroupName("");
      setGroupImage(null);
      setGroupMembers([userEmail]); // Resetando a lista de membros com o criador
      onClose();
    } catch (error) {
      console.error("Erro ao criar grupo: ", error);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="modal-create-group">
      <div className="modal-content">
        <span className="close" onClick={onClose}>&times;</span>
        <h2>Criar Novo Grupo</h2>
        <form onSubmit={handleCreateGroup}>
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
            Adicionar Membro:
            <input
              type="text"
              value={currentMember}
              onChange={(e) => setCurrentMember(e.target.value)}
            />
            <button onClick={handleAddMember}>Adicionar</button>
          </label>
          <ul>
            {groupMembers.map((member, index) => (
              <li key={index}>
                {member}
                {member !== userEmail && ( // O criador não pode se remover
                  <button type="button" onClick={() => handleRemoveMember(member)}>Remover</button>
                )}
              </li>
            ))}
          </ul>
          <button type="submit" disabled={isUploading}>
            {isUploading ? "Criando..." : "Criar"}
          </button>
        </form>
      </div>
    </div>
  );
}