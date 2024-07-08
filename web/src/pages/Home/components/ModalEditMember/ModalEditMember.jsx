import React, { useState, useEffect } from "react";
import { doc, updateDoc, getDoc } from "firebase/firestore";
import { db } from "../../../../firebase";
import './ModalEditMember.scss';

export default function ModalEditMember({ habitatId, memberId, onClose }) {
  const [tag, setTag] = useState("");
  const [color, setColor] = useState("#000000");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [memberData, setMemberData] = useState(null);

  useEffect(() => {
    const fetchMember = async () => {
      try {
        const memberRef = doc(db, `habitats/${habitatId}/members/${memberId}`);
        const memberDoc = await getDoc(memberRef);

        if (memberDoc.exists()) {
          const data = memberDoc.data();
          setTag(data.tag || "");
          setColor(data.color || "#000000");
          setMemberData(data);
        } else {
          console.error("Membro não encontrado!");
        }
      } catch (error) {
        console.error("Erro ao buscar membro: ", error);
      }
    };

    fetchMember();
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

  if (!memberData) {
    return <div>Carregando...</div>;
  }

  return (
    <div className="modal-edit-member">
      <div className="modal-content">
        <span className="close" onClick={onClose}>&times;</span>
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