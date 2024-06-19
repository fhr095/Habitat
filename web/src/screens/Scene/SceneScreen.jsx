import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getAuth, onAuthStateChanged, signOut } from "firebase/auth";
import { collection, onSnapshot, getDoc, doc } from "firebase/firestore";
import { FaSignInAlt, FaSignOutAlt } from "react-icons/fa";

import ChatContainer from "./components/ChatContainer";
import LoginRegisterModal from "./components/LoginRegisterModal";
import Scene from "./components/Scene";
import WidgetCarousel from "./components/WidgetCarousel";
import { db } from "../../firebase";
import "./styles/SceneScreen.scss";

export default function SceneScreen() {
  const [chatOpen, setChatOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [modalShow, setModalShow] = useState(false);
  const [feedbackFilter, setFeedbackFilter] = useState("");
  const [dateRangeFilter, setDateRangeFilter] = useState({ type: "" });
  const [searchTerm, setSearchTerm] = useState("");
  const [widgets, setWidgets] = useState([]);

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
        setCurrentUser(null);
        setIsAdmin(false);
      })
      .catch((error) => {
        console.error("Erro ao deslogar:", error);
      });
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
          <WidgetCarousel widgets={widgets} />
        </>
      )}
      <LoginRegisterModal
        show={modalShow}
        handleClose={() => setModalShow(false)}
      />
    </div>
  );
}