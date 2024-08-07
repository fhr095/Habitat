import React, { useState, useEffect } from "react";
import { doc, setDoc, onSnapshot } from "firebase/firestore";
import { db } from "../../../../firebase"; // Certifique-se de importar corretamente seu Firebase

import "./ConfigWelcome.scss";

export default function ConfigWelcome({ habitatId }) {
  const [welcomeData, setWelcomeData] = useState({ text: "", active: false });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWelcomeData = () => {
      const welcomeRef = doc(db, `habitats/${habitatId}/welcome/welcomeData`);
      const unsubscribe = onSnapshot(welcomeRef, (doc) => {
        if (doc.exists()) {
          setWelcomeData(doc.data());
        } else {
          console.log("No such document!");
        }
        setLoading(false);
      });

      return () => unsubscribe();
    };

    fetchWelcomeData();
  }, [habitatId]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setWelcomeData((prevData) => ({
      ...prevData,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const welcomeRef = doc(db, `habitats/${habitatId}/welcome/welcomeData`);
      await setDoc(welcomeRef, welcomeData);
      alert("Dados atualizados com sucesso!");
    } catch (error) {
      console.error("Erro ao atualizar dados: ", error);
      alert("Erro ao atualizar dados!");
    }
  };

  if (loading) {
    return <p>Carregando...</p>;
  }

  return (
    <div className="config-welcome">
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="text">Texto de Boas-vindas</label>
          <input
            type="text"
            id="text"
            name="text"
            value={welcomeData.text}
            onChange={handleChange}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="active">Ativo</label>
          <input
            type="checkbox"
            id="active"
            name="active"
            checked={welcomeData.active}
            onChange={handleChange}
          />
        </div>
        <button type="submit">Salvar</button>
      </form>
    </div>
  );
}