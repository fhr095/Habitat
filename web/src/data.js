import { doc, getDoc } from "firebase/firestore";
import { db } from "./firebase"; // Caminho para o seu firebase.js

export async function fetchDocumentAsJSON(collectionName, documentId) {
    try {
        const docRef = doc(db, collectionName, documentId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const jsonData = docSnap.data();
            return jsonData; // Retorna os dados em JSON
        } else {
            console.error("Documento não encontrado!");
            return null;
        }
    } catch (error) {
        console.error("Erro ao buscar documento:", error);
        throw error;
    }
}
