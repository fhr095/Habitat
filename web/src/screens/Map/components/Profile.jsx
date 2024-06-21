import React, { useState, useEffect } from "react";
import { Form, Button, Alert } from "react-bootstrap";
import { getAuth, updateProfile, deleteUser } from "firebase/auth";
import { doc, getDoc, updateDoc, deleteDoc } from "firebase/firestore";
import { ref, getDownloadURL, uploadBytes } from "firebase/storage";
import { db, storage } from "../../../firebase";

import "../styles/Profile.scss";

export default function Profile() {
  const [userData, setUserData] = useState({
    name: "",
    profileImageUrl: "",
    email: "",
    role: ""
  });
  const [newName, setNewName] = useState("");
  const [newProfileImage, setNewProfileImage] = useState(null);
  const [alertMessage, setAlertMessage] = useState("");
  const [alertVariant, setAlertVariant] = useState("");
  const auth = getAuth();
  const user = auth.currentUser;

  useEffect(() => {
    const fetchUserData = async () => {
      if (user) {
        const userDocRef = doc(db, "users", user.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          setUserData(userDoc.data());
          setNewName(userDoc.data().name);
        }
      }
    };

    fetchUserData();
  }, [user]);

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    setNewProfileImage(file);
  };

  const handleUpdateProfile = async () => {
    try {
      let profileImageUrl = userData.profileImageUrl;

      if (newProfileImage) {
        const imageRef = ref(storage, `profileImages/${user.uid}`);
        await uploadBytes(imageRef, newProfileImage);
        profileImageUrl = await getDownloadURL(imageRef);
      }

      await updateProfile(user, {
        displayName: newName,
        photoURL: profileImageUrl,
      });

      const userDocRef = doc(db, "users", user.uid);
      await updateDoc(userDocRef, {
        name: newName,
        profileImageUrl: profileImageUrl,
      });

      setUserData({ ...userData, name: newName, profileImageUrl });
      setAlertMessage("Perfil atualizado com sucesso.");
      setAlertVariant("success");
    } catch (error) {
      setAlertMessage("Falha ao atualizar o perfil. Tente novamente.");
      setAlertVariant("danger");
    }
  };

  const handleDeleteUser = async () => {
    console.log("Iniciando exclusão do usuário...");
    try {
      const userDocRef = doc(db, "users", user.uid);
      await deleteDoc(userDocRef);
      await deleteUser(user);
      setAlertMessage("Conta deletada com sucesso.");
      setAlertVariant("success");
    } catch (error) {
      setAlertMessage("Falha ao deletar a conta. Tente novamente.");
      setAlertVariant("danger");
    }
  };

  return (
    <div className="profile-container">
      <h2>Editar Perfil</h2>
      {alertMessage && (
        <Alert variant={alertVariant} onClose={() => setAlertMessage("")} dismissible>
          {alertMessage}
        </Alert>
      )}
      <Form>
        <Form.Group className="mb-3 form-group">
          <Form.Label className="form-label">Email</Form.Label>
          <Form.Control type="email" value={userData.email} readOnly className="form-control" />
        </Form.Group>
        <Form.Group className="mb-3 form-group">
          <Form.Label className="form-label">Nome</Form.Label>
          <Form.Control
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            className="form-control"
          />
        </Form.Group>
        <Form.Group className="mb-3 form-group">
          <Form.Label className="form-label">Imagem de Perfil</Form.Label>
          <Form.Control type="file" onChange={handleImageUpload} className="form-control" />
          {userData.profileImageUrl && (
            <div className="profile-image-preview">
              <img src={userData.profileImageUrl} alt="Profile" />
            </div>
          )}
        </Form.Group>
        <Button variant="primary" onClick={handleUpdateProfile} className="btn-primary">
          Atualizar Perfil
        </Button>
        <Button variant="danger" onClick={handleDeleteUser} className="btn-danger">
          Deletar Conta
        </Button>
      </Form>
    </div>
  );
}