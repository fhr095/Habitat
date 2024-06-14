import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getAuth, onAuthStateChanged, signOut } from "firebase/auth";
import { Button } from "antd";
import { FaSignInAlt, FaSignOutAlt, FaPlus } from "react-icons/fa";

import ChatContainer from "../components/ChatContainer";
import LoginRegisterModal from "../components/LoginRegisterModal";
import Scene from "../components/Scene";
import CreateWidgetModal from "../components/CreateWidgetModal";
import MovableWidget from "../components/MovableWidget";
import "../styles/SceneScreen.scss";

export default function SceneScreen() {
  const [chatOpen, setChatOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [modalShow, setModalShow] = useState(false);
  const [feedbackFilter, setFeedbackFilter] = useState('');
  const [dateRangeFilter, setDateRangeFilter] = useState({ type: '' });
  const [searchTerm, setSearchTerm] = useState('');
  const [widgets, setWidgets] = useState([]);
  const [showCreateWidgetModal, setShowCreateWidgetModal] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUser(user);
      } else {
        setCurrentUser(null);
      }
    });
    return () => unsubscribe();
  }, []);

  const handleLoginRegister = () => {
    setModalShow(true);
  };

  const handleLogout = () => {
    const auth = getAuth();
    signOut(auth)
      .then(() => {
        console.log("Usuário deslogado com sucesso");
        setCurrentUser(null);
      })
      .catch((error) => {
        console.error("Erro ao deslogar:", error);
      });
  };

  const handleCreateWidget = ({ content, imageUrl }) => {
    setWidgets([...widgets, { content, imageUrl, id: widgets.length }]);
    setShowCreateWidgetModal(false);
  };

  const handleDeleteWidget = (id) => {
    setWidgets(widgets.filter(widget => widget.id !== id));
  };

  return (
    <div className="screen-container">
      <Scene />
      {currentUser && (
        <ChatContainer
          isOpen={chatOpen}
          setChatOpen={setChatOpen}
          onSearch={setSearchTerm}
          feedbackFilter={feedbackFilter}
          setFeedbackFilter={setFeedbackFilter}
          dateRangeFilter={dateRangeFilter}
          setDateRangeFilter={setDateRangeFilter}
          searchTerm={searchTerm}
        />
      )}
      <div className="login-container">
        {!currentUser ? (
          <button onClick={handleLoginRegister} className="login-button">
            Login/Cadastrar
            <FaSignInAlt color="#004736" size={20} />
          </button>
        ) : (
          <button onClick={handleLogout} className="login-button">
            Sair
            <FaSignOutAlt color="#004736" size={20} />
          </button>
        )}
      </div>
      <Button
        className="create-widget-button"
        onClick={() => setShowCreateWidgetModal(true)}
        icon={<FaPlus />}
      >
        Criar Widget
      </Button>
      <CreateWidgetModal
        open={showCreateWidgetModal}
        handleClose={() => setShowCreateWidgetModal(false)}
        handleCreate={handleCreateWidget}
      />
      {widgets.map(widget => (
        <MovableWidget key={widget.id} id={widget.id} content={widget.content} imageUrl={widget.imageUrl} onDelete={handleDeleteWidget} />
      ))}
      <LoginRegisterModal show={modalShow} handleClose={() => setModalShow(false)} />
    </div>
  );
}