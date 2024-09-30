import React, { useState, useEffect } from "react";
import { doc, getDoc, updateDoc, deleteDoc, collection, getDocs, arrayRemove, arrayUnion, query, where } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "../../../../firebase";
import { FaTimes, FaTrash } from "react-icons/fa";
import "./ModalEditGroup.scss";

export default function ModalEditGroup({ habitatId, selectedGroup, onClose }) {
  const [group, setGroup] = useState(null);
  const [name, setName] = useState("");
  const [imgUrl, setImgUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [members, setMembers] = useState([]);
  const [groupId, setGroupId] = useState(selectedGroup);
  const [newMemberEmail, setNewMemberEmail] = useState("");

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
          setMembers(groupData.users || []);
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

  const handleRemoveMember = async (memberEmail) => {
    try {
      const groupRef = doc(db, `habitats/${habitatId}/groups/${groupId}`);
      await updateDoc(groupRef, {
        users: arrayRemove(memberEmail)
      });
      setMembers(prevMembers => prevMembers.filter(member => member !== memberEmail));
    } catch (error) {
      console.error("Erro ao remover membro: ", error);
    }
  };

  const handleAddMember = async () => {
    if (newMemberEmail.trim() === "") return;

    try {
      const usersRef = collection(db, "users");
      const q = query(usersRef, where("email", "==", newMemberEmail));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        alert("Usuário não encontrado.");
        return;
      }

      const groupRef = doc(db, `habitats/${habitatId}/groups/${groupId}`);
      await updateDoc(groupRef, {
        users: arrayUnion(newMemberEmail)
      });
      setMembers(prevMembers => [...prevMembers, newMemberEmail]);
      setNewMemberEmail("");
    } catch (error) {
      console.error("Erro ao adicionar membro: ", error);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const storageRef = ref(storage, `group_images/${groupId}`);
    await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(storageRef);
    setImgUrl(downloadURL);
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
            Upload de Imagem:
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
            />
          </label>
          <div className="members-list">
            <h3>Membros</h3>
            <div className="add-member">
              <input
                type="email"
                value={newMemberEmail}
                onChange={(e) => setNewMemberEmail(e.target.value)}
                placeholder="Adicionar membro pelo email"
              />
              <button type="button" onClick={handleAddMember}>Adicionar</button>
            </div>
            {members.map(member => (
              member !== group.admin && (
                <div key={member} className="member-item">
                  <span>{member}</span>
                  <button type="button" onClick={() => handleRemoveMember(member)}>
                    <FaTrash />
                  </button>
                </div>
              )
            ))}
          </div>
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