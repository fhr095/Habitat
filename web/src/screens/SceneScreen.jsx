import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getAuth, onAuthStateChanged, signOut } from "firebase/auth";
import { collection, onSnapshot, getDoc, doc } from "firebase/firestore";
import { Button } from "react-bootstrap";
import { FaSignInAlt, FaSignOutAlt, FaPlus, FaEye } from "react-icons/fa";

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
  const [isAdmin, setIsAdmin] = useState(false);
  const [modalShow, setModalShow] = useState(false);
  const [feedbackFilter, setFeedbackFilter] = useState("");
  const [dateRangeFilter, setDateRangeFilter] = useState({ type: "" });
  const [searchTerm, setSearchTerm] = useState("");
  const [widgets, setWidgets] = useState([]);
  const [hiddenWidgets, setHiddenWidgets] = useState([]);
  const [showCreateWidgetModal, setShowCreateWidgetModal] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);
        await checkIfAdmin(user.uid);
        loadWidgets();
      } else {
        setCurrentUser(null);
        setIsAdmin(false);
        setWidgets([]);
      }
    });
    return () => unsubscribe();
  }, []);

  const checkIfAdmin = async (uid) => {
    try {
      const userDoc = await getDoc(doc(db, "users", uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        if (userData.role === "adm") {
          setIsAdmin(true);
        } else {
          setIsAdmin(false);
        }
      } else {
        console.log("No such document!");
        setIsAdmin(false);
      }
    } catch (error) {
      console.error("Error getting document:", error);
      setIsAdmin(false);
    }
  };

  const loadWidgets = () => {
    const widgetsRef = collection(db, "widgets");
    const unsubscribe = onSnapshot(widgetsRef, (snapshot) => {
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
        setIsAdmin(false);
      })
      .catch((error) => {
        console.error("Erro ao deslogar:", error);
      });
  };

  const handleDeleteWidget = (id) => {
    setWidgets(widgets.filter((widget) => widget.id !== id));
  };

  const handleHideWidget = (id) => {
    setHiddenWidgets([...hiddenWidgets, id]);
  };

  const handleShowHiddenWidgets = () => {
    setHiddenWidgets([]);
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
        <>
          <div className="widget-container">
            {isAdmin ? (
              <button
                onClick={() => setShowCreateWidgetModal(true)}
                className="widget-button"
              >
                <FaPlus /> Criar Widget
              </button>
            ) : (
              <button
                onClick={handleShowHiddenWidgets}
                className="widget-button"
              >
                <FaEye /> Visualizar Widgets
              </button>
            )}
          </div>
          <CreateWidgetModal
            show={showCreateWidgetModal}
            handleClose={() => setShowCreateWidgetModal(false)}
          />
          {widgets
            .filter((widget) => !hiddenWidgets.includes(widget.id))
            .map((widget) => (
              <MovableWidget
                key={widget.id}
                id={widget.id}
                content={widget.content}
                imageUrl={widget.imageUrl}
                onDelete={handleDeleteWidget}
                onHide={handleHideWidget}
                isAdmin={isAdmin}
              />
            ))}
        </>
      )}
      <LoginRegisterModal
        show={modalShow}
        handleClose={() => setModalShow(false)}
      />
    </div>
  );
}
