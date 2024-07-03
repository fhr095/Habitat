import React, { useState, useEffect } from "react";
import { collection, query, where, getDocs, doc, updateDoc, arrayUnion } from "firebase/firestore";
import { db } from "../../../../firebase";
import "./ListHabitats.scss";

export default function ListHabitats({ onClose, userEmail }) {
  const [publicHabitats, setPublicHabitats] = useState([]);

  useEffect(() => {
    const fetchPublicHabitats = async () => {
      try {
        const q = query(collection(db, "habitats"), where("isPublic", "==", true));
        const querySnapshot = await getDocs(q);
        const habitats = [];
        querySnapshot.forEach((doc) => {
          habitats.push({ id: doc.id, ...doc.data() });
        });
        setPublicHabitats(habitats);
      } catch (error) {
        console.error("Erro ao buscar habitats públicos: ", error);
      }
    };

    fetchPublicHabitats();
  }, []);

  const handleJoinHabitat = async (habitat) => {
    if (habitat.createdBy === userEmail) {
      alert("Você não pode entrar no habitat que você criou.");
      return;
    }

    if (habitat.members && habitat.members.includes(userEmail)) {
      alert("Você já é membro deste habitat.");
      return;
    }

    try {
      const habitatRef = doc(db, "habitats", habitat.id);
      await updateDoc(habitatRef, {
        members: arrayUnion(userEmail) // Adiciona o email ao array de membros ou cria o array se não existir
      });
      alert("Você se juntou ao habitat!");
      onClose();
    } catch (error) {
      console.error("Erro ao juntar-se ao habitat: ", error);
    }
  };

  return (
    <div className="list-habitats">
      <h1>Habitats Públicos</h1>
      <div className="habitat-grid">
        {publicHabitats.length > 0 ? (
          publicHabitats.map(habitat => (
            <div
              key={habitat.id}
              className={`habitat-item ${habitat.createdBy === userEmail || (habitat.members && habitat.members.includes(userEmail)) ? 'disabled' : ''}`}
              onClick={() => handleJoinHabitat(habitat)}
            >
              <img src={habitat.imageUrl} alt="" />
              <p>{habitat.name}</p>
            </div>
          ))
        ) : (
          <p>Nenhum habitat público encontrado.</p>
        )}
      </div>
    </div>
  );
}