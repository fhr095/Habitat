import React, { useState, useEffect } from "react";
import { ResizableBox } from 'react-resizable'; // Importando ResizableBox
import 'react-resizable/css/styles.css'; // Importando estilos padrão
import { doc, updateDoc, arrayRemove, deleteDoc, getDoc } from "firebase/firestore";
import { db } from "../../../../firebase";
import { useNavigate } from "react-router-dom";
import { useHabitatUser } from "../../../../context/HabitatUserContext"; 
import ModalEditHabitat from "../ModalEditHabitat/ModalEditHabitat";
import Rating from "../Rating/Rating";
import CallAction from "../CallAction/CallAction";
import Equipe from "../Equipe/Equipe";
import ConfigWelcome from "../ConfigWelcome/ConfigWelcome";
import ContextMenu from "./ContextMenu";
import EditBotPanel from "../EditBotPanel/EditBotPanel"; 
import ModalEditBot from "../ModalEditBot/ModalEditBot"
import { FaChartBar } from "react-icons/fa";
import "./Access.scss";

// Objeto de configuração para mapeamento de componentes
const componentConfig = {
  equipe: { label: "Equipe", component: Equipe, adminOnly: false },
  //callAction: { label: "Ação de Chamada", component: CallAction, adminOnly: false },
  //configWelcome: { label: "Configurar Boas-vindas", component: ConfigWelcome, adminOnly: true },
  //editarBot: { label: "Editar Bot", component: EditBotPanel, adminOnly: false },
  // Adicione mais componentes aqui conforme necessário
};

export default function Access() {
  const { habitat, user } = useHabitatUser(); 
  const navigate = useNavigate();
  const [modals, setModals] = useState({
    edit: false,
    rating: false,
  });
  const [isContextMenuOpen, setIsContextMenuOpen] = useState(false);
  const [activeComponent, setActiveComponent] = useState("equipe");
  const [isAdmin, setIsAdmin] = useState(false);
  const [width, setWidth] = useState(350); // Estado para controlar a largura

  useEffect(() => {
    const checkAdmin = async () => {
      const habitatDoc = await getDoc(doc(db, "habitats", habitat.id));
      if (habitatDoc.exists()) {
        const habitatData = habitatDoc.data();
        setIsAdmin(habitatData.createdBy === user.email);
      }
    };

    checkAdmin();
  }, [habitat.id, user.email]);

  const toggleModal = (modalName, value) => {
    setModals((prevModals) => ({
      ...prevModals,
      [modalName]: value,
    }));
  };

  const toggleContextMenu = () => {
    setIsContextMenuOpen((prevState) => !prevState);
  };

  const handleShowComponent = (componentKey) => {
    setActiveComponent(componentKey);
    setIsContextMenuOpen(false);
  };

  const handleDeleteHabitat = async () => {
    try {
      const habitatRef = doc(db, "habitats", habitat.id);
      await deleteDoc(habitatRef);
      alert("Habitat deletado com sucesso.");
      window.location.reload();
    } catch (error) {
      console.error("Erro ao deletar habitat: ", error);
    }
  };

  const handleLeaveHabitat = async () => {
    try {
      const habitatRef = doc(db, "habitats", habitat.id);
      await updateDoc(habitatRef, {
        members: arrayRemove(user.email),
      });

      alert("Você saiu do habitat.");
      setIsContextMenuOpen(false);
      window.location.reload();
    } catch (error) {
      console.error("Erro ao sair do habitat: ", error);
    }
  };

  /*const handleViewScene = () => {
    navigate(`/scene/${habitat.id}`);
  };*/


const handleViewScene = () => {
  const url = `${window.location.origin}/scene/${habitat.id}`;
  window.open(url, '_blank');
};


  const handleAnalyticsClick = () => {
    window.open('https://datareport.netlify.app/', '_blank');
  };

  const handleResize = (event, { size }) => {
    setWidth(size.width);
  };

  const ComponentToRender = componentConfig[activeComponent].component;

  return (
    <ResizableBox
      width={width}
      height={Infinity}
      minConstraints={[250, Infinity]}
      maxConstraints={[600, Infinity]}
      axis="x"
      onResize={handleResize}
      handle={<span className="custom-handle custom-handle-e" />}
      className="access-resizable-box"
      resizeHandles={['e']}
    >
      <div className="access-container" style={{ width: '100%', height: '100%' }}>
        <header>
          <div className="header-left">
            <div className="text">{habitat.name}</div>
            <button 
              className="analytics-icon" 
              onClick={handleAnalyticsClick} 
              aria-label="Abrir Analytics"
            >
              <FaChartBar />
            </button>
          </div>
          <div className="header-right">
            <ContextMenu
              isContextMenuOpen={isContextMenuOpen}
              toggleContextMenu={toggleContextMenu}
              handleShowComponent={handleShowComponent}
              handleViewScene={handleViewScene}
              handleDeleteHabitat={handleDeleteHabitat}
              handleLeaveHabitat={handleLeaveHabitat}
              habitat={habitat}
              userEmail={user.email}
              componentConfig={componentConfig}
              isAdmin={isAdmin}
            />
          </div>
        </header>
        <div className="divider" />

        {ComponentToRender && <ComponentToRender />}

        {modals.edit && <ModalEditHabitat habitatId={habitat.id} onClose={() => toggleModal("edit", false)} />}
        {modals.rating && <Rating habitatId={habitat.id} onClose={() => toggleModal("rating", false)} />}
      </div>
    </ResizableBox>
  );
}
