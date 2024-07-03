import React, { useState, useEffect } from "react";
import { collection, query, getDocs, doc, updateDoc, arrayUnion } from "firebase/firestore";
import { db } from "../../../../firebase";
import "./ModalAddMembers.scss";

export default function ModalAddMembers({ onClose, habitatId }) {
  const [allUsers, setAllUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const q = query(collection(db, "users"));
        const querySnapshot = await getDocs(q);
        const users = [];
        querySnapshot.forEach((doc) => {
          users.push(doc.data().email);
        });
        setAllUsers(users);
      } catch (error) {
        console.error("Erro ao buscar usuários: ", error);
      }
    };

    fetchUsers();
  }, []);

  const handleAddMember = async () => {
    setIsSubmitting(true);
    try {
      const habitatRef = doc(db, "habitats", habitatId);
      await updateDoc(habitatRef, {
        members: arrayUnion(selectedUser)
      });
      setIsSubmitting(false);
      onClose();
    } catch (error) {
      console.error("Erro ao adicionar membro: ", error);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal">
      <div className="modal-content">
        <span className="close" onClick={onClose}>&times;</span>
        <h1>Adicionar Membros</h1>
        <div className="form-group">
          <label htmlFor="members">Selecione o Email do Membro:</label>
          <input 
            type="text" 
            list="users" 
            value={selectedUser} 
            onChange={(e) => setSelectedUser(e.target.value)} 
            placeholder="Digite para buscar..."
          />
          <datalist id="users">
            {allUsers.map((user) => (
              <option key={user} value={user}>{user}</option>
            ))}
          </datalist>
        </div>
        <button 
          onClick={handleAddMember} 
          disabled={!selectedUser || isSubmitting}
        >
          {isSubmitting ? "Adicionando..." : "Adicionar Membro"}
        </button>
      </div>
    </div>
  );
}