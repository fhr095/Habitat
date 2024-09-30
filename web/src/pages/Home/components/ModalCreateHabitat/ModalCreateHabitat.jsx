import React, { useState } from "react";
import { collection, addDoc, doc, setDoc } from "firebase/firestore";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { db, storage } from "../../../../firebase";
import "./ModalCreateHabitat.scss";

export default function ModalCreateHabitat({ onClose, userEmail }) {
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [image, setImage] = useState(null);
  const [mainFile, setMainFile] = useState(null); // Arquivo principal (IFC ou GLB)
  const [mobileFile, setMobileFile] = useState(null); // Arquivo opcional para celular (IFC ou GLB)
  const [isPublic, setIsPublic] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const mainFileRef = ref(storage, `habitats/${mainFile.name}`);
      const imageRef = image ? ref(storage, `habitats/images/${image.name}`) : null;
      const mobileFileRef = mobileFile ? ref(storage, `habitats/mobile/${mobileFile.name}`) : null;

      const uploadTasks = [];

      uploadTasks.push(uploadFile(mainFileRef, mainFile));
      if (image) {
        uploadTasks.push(uploadFile(imageRef, image));
      }
      if (mobileFile) {
        uploadTasks.push(uploadFile(mobileFileRef, mobileFile));
      }

      const uploadResults = await Promise.all(uploadTasks);

      const habitatData = {
        name,
        address,
        imageUrl: uploadResults[1] || null,
        mainFileUrl: uploadResults[0],
        mobileFileUrl: uploadResults[2] || null,
        isPublic,
        createdBy: userEmail,
      };

      const habitatRef = await addDoc(collection(db, "habitats"), habitatData);

      // Adicionar o criador como membro do habitat
      const memberRef = doc(db, `habitats/${habitatRef.id}/members/${userEmail}`);
      await setDoc(memberRef, {
        email: userEmail,
        tag: "Criador",
        color: "#004736",
      });

      console.log("Habitat criado com sucesso");
      setIsSubmitting(false);
      onClose();
    } catch (error) {
      console.error("Erro ao criar habitat: ", error);
      setIsSubmitting(false);
    }
  };

  const uploadFile = (fileRef, file) => {
    return new Promise((resolve, reject) => {
      const uploadTask = uploadBytesResumable(fileRef, file);

      uploadTask.on(
        "state_changed",
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setUploadProgress(progress);
        },
        (error) => {
          console.error("Falha no upload do arquivo", error);
          setIsSubmitting(false);
          reject(error);
        },
        async () => {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          resolve(downloadURL);
        }
      );
    });
  };

  const isFormValid = name && mainFile;

  return (
    <div className="modal-create-habitat">
      <div className="modal-create-habitat-content">
        <span className="close" onClick={onClose}>&times;</span>
        <h1>Criar Habitat</h1>
        <form onSubmit={handleSubmit}>
          <label>
            Nome:
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </label>
          <label>
            Endereço (opcional):
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
          </label>
          <label>
            Imagem do Habitat:
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setImage(e.target.files[0])}
            />
          </label>
          <label>
            Arquivo Principal (IFC ou GLB):
            <input
              type="file"
              accept=".ifc,.glb"
              onChange={(e) => setMainFile(e.target.files[0])}
              required
            />
          </label>
          <label>
            Arquivo Opcional para Celular (IFC ou GLB):
            <input
              type="file"
              accept=".ifc,.glb"
              onChange={(e) => setMobileFile(e.target.files[0])}
            />
          </label>
          <label>
            Público:
            <input
              type="checkbox"
              checked={isPublic}
              onChange={(e) => setIsPublic(e.target.checked)}
            />
          </label>
          <button type="submit" disabled={!isFormValid || isSubmitting}>
            Adicionar Habitat
          </button>
        </form>
        {isSubmitting && (
          <div className="progress-bar">
            <div className="progress" style={{ width: `${uploadProgress}%` }}></div>
          </div>
        )}
      </div>
    </div>
  );
}
