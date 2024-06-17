import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getAuth, onAuthStateChanged, signOut } from "firebase/auth";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { Button } from "react-bootstrap";
import { FaSignInAlt, FaSignOutAlt, FaPlus } from "react-icons/fa";

import ChatContainer from "../components/ChatContainer";
import LoginRegisterModal from "../components/LoginRegisterModal";
import Scene from "../components/Scene";
import CreateWidgetModal from "../components/CreateWidgetModal";
import MovableWidget from "../components/MovableWidget";
import { db } from "../firebase";
import "../styles/SceneScreen.scss";

export default function SceneScreen() {
  const [chatOpen, setChatOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [modalShow, setModalShow] = useState(false);
  const [feedbackFilter, setFeedbackFilter] = useState("");
  const [dateRangeFilter, setDateRangeFilter] = useState({ type: "" });
  const [searchTerm, setSearchTerm] = useState("");
  const [widgets, setWidgets] = useState([]);
  const [showCreateWidgetModal, setShowCreateWidgetModal] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUser(user);
        loadWidgets(user.email);
      } else {
        setCurrentUser(null);
      }
    });
    return () => unsubscribe();
  }, []);

  const loadWidgets = (email) => {
    const widgetsRef = collection(db, "widgets");
    const q = query(widgetsRef, where("email", "==", email));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const loadedWidgets = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setWidgets(loadedWidgets);
    });
    return unsubscribe;
  };

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

  const handleDeleteWidget = (id) => {
    setWidgets(widgets.filter((widget) => widget.id !== id));
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
      {currentUser && (
        <Button
          className="create-widget-button"
          onClick={() => setShowCreateWidgetModal(true)}
        >
          <FaPlus /> Criar Widget
        </Button>
      )}
      <CreateWidgetModal
        show={showCreateWidgetModal}
        handleClose={() => setShowCreateWidgetModal(false)}
      />
      {widgets.map((widget) => (
        <MovableWidget
          key={widget.id}
          id={widget.id}
          content={widget.content}
          imageUrl={widget.imageUrl}
          onDelete={handleDeleteWidget}
        />
      ))}
      <LoginRegisterModal
        show={modalShow}
        handleClose={() => setModalShow(false)}
      />
    </div>
  );
}
