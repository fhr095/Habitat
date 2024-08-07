import React, { useState, useEffect } from "react";
import { collection, query, getDocs, doc, setDoc } from "firebase/firestore";
import { db } from "../../../../firebase";
import { FaTimes } from "react-icons/fa";
import "./ModalAddMembers.scss";

export default function ModalAddMembers({ onClose, habitatId }) {
  const [allUsers, setAllUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState("");
  const [tag, setTag] = useState("");
  const [color, setColor] = useState("#000000");
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

  const handleAddMember = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const memberRef = doc(db, `habitats/${habitatId}/members/${selectedUser}`);
      const member = { email: selectedUser, tag, color };
      await setDoc(memberRef, member);
      setIsSubmitting(false);
      onClose();
    } catch (error) {
      console.error("Erro ao adicionar membro: ", error);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-addMembers">
      <div className="modal-addMembers-content">
        <span className="close" onClick={onClose}><FaTimes /></span>
        <h2>Adicionar Membros</h2>
        <form className="form-group" onSubmit={handleAddMember}>
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
          <label>
            Tag:
            <input 
              type="text" 
              value={tag} 
              onChange={(e) => setTag(e.target.value)} 
              placeholder="Tag" 
            />
          </label>
          <label>
            Cor da Tag:
            <input 
              type="color" 
              value={color} 
              onChange={(e) => setColor(e.target.value)} 
            />
          </label>
          <button 
            type="submit"
            disabled={!selectedUser || isSubmitting}
          >
            {isSubmitting ? "Adicionando..." : "Adicionar Membro"}
          </button>
        </form>
      </div>
    </div>
  );
}