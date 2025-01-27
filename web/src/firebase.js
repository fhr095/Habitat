import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, collection, addDoc, getDocs, Timestamp } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { v4 as uuidv4 } from 'uuid';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_APP_API_KEY,
  authDomain: import.meta.env.VITE_APP_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_APP_PROJECT_ID,
  storageBucket: import.meta.env.VITE_APP_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_APP_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_APP_APP_ID,
  measurementId: import.meta.env.VITE_APP_MEASUREMENT_ID,
};

console.log(firebaseConfig );

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// Função para buscar todos os persons conhecidos
export const fetchAllPersons = async () => {
  const personsCol = collection(db, 'persons');
  const snapshot = await getDocs(personsCol);
  const persons = [];
  snapshot.forEach(doc => {
    const data = doc.data();
    persons.push({ personId: data.personId, descriptor: data.descriptor });
  });
  return persons;
};

// Função para salvar um novo "person"
export const saveNewPerson = async (personId, descriptor) => {
  const personsCol = collection(db, 'persons');
  await addDoc(personsCol, {
    personId,
    descriptor: Array.from(descriptor),
    createdAt: Timestamp.now()
  });
};

// Função para salvar uma interação
export const saveInteraction = async (interactionData) => {
  const interactionsCol = collection(db, 'interactions');
  await addDoc(interactionsCol, {
    ...interactionData,
    timestamp: Timestamp.now()
  });
};


// src/firebase.js (adicionar no final do arquivo existente)
export const fetchRatings = async () => {
  const interactionsCol = collection(db, 'interactions');
  const snapshot = await getDocs(interactionsCol);
  const ratingsCount = {};

  snapshot.forEach(doc => {
    const data = doc.data();
    const rating = data.ratings;
    if (rating !== null) {
      ratingsCount[rating] = (ratingsCount[rating] || 0) + 1;
    }
  });

  return ratingsCount;
};

export const fetchInteractionsByWeek = async (weeks = 4) => {
  const interactionsCol = collection(db, 'interactions');
  const snapshot = await getDocs(interactionsCol);
  const interactions = [];

  snapshot.forEach(doc => {
    const data = doc.data();
    interactions.push(data.timestamp.toDate());
  });

  const currentDate = new Date();
  const weekLabels = [];
  const weekCounts = Array(weeks).fill(0);

  for (let i = weeks - 1; i >= 0; i--) {
    const start = startOfWeek(addWeeks(currentDate, -i), { weekStartsOn: 1 });
    const end = addWeeks(start, 1);
    weekLabels.push(format(start, 'dd/MM/yyyy'));
    interactions.forEach(timestamp => {
      if (timestamp >= start && timestamp < end) {
        weekCounts[weeks - 1 - i]++;
      }
    });
  }

  return { weekLabels, weekCounts };
};


export { auth, db, storage };
