import React, { useState, useEffect } from "react";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../../../../firebase";
import { FaTimes } from "react-icons/fa";
import "./ModalEditMember.scss";

export default function ModalEditMember({ habitatId, selectedMember, onClose }) {
  const [tag, setTag] = useState("");
  const [color, setColor] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [memberId, setMemberId] = useState(selectedMember);

  useEffect(() => {
    const fetchMemberData = async () => {
      try {
        const memberRef = doc(db, `habitats/${habitatId}/members/${memberId}`);
        const memberDoc = await getDoc(memberRef);
        if (memberDoc.exists()) {
          const memberData = memberDoc.data();
          setTag(memberData.tag);
          setColor(memberData.color);
        } else {
          console.error("Member document does not exist.");
        }
      } catch (error) {
        console.error("Erro ao buscar dados do membro: ", error);
      }
    };

    if (memberId) {
      fetchMemberData();
    }
  }, [habitatId, memberId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const memberRef = doc(db, `habitats/${habitatId}/members/${memberId}`);
      await updateDoc(memberRef, {
        tag,
        color,
      });

      alert("Membro atualizado com sucesso!");
      onClose();
    } catch (error) {
      console.error("Erro ao atualizar membro: ", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-edit-member">
      <div className="modal-content">
        <span className="close" onClick={onClose}><FaTimes /></span>
        <h2>Editar Membro</h2>
        <form onSubmit={handleSubmit}>
          <label>
            Tag do Membro:
            <input
              type="text"
              value={tag}
              onChange={(e) => setTag(e.target.value)}
              required
            />
          </label>
          <label>
            Cor da Tag:
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              required
            />
          </label>
          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Atualizando..." : "Atualizar Membro"}
          </button>
        </form>
      </div>
    </div>
  );
}