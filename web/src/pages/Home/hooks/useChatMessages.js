// src/pages/Home/hooks/useChatMessages.js
import { useState, useEffect } from 'react';
import { collection, query, onSnapshot, orderBy, addDoc } from 'firebase/firestore';
import { db } from '../../../../firebase';

export function useChatMessages(path) {
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    const messagesRef = collection(db, path);
    const q = query(messagesRef, orderBy('timestamp'));

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const msgs = [];
      querySnapshot.forEach((doc) => {
        msgs.push({ id: doc.id, ...doc.data() });
      });
      setMessages(msgs);
    });

    return () => unsubscribe();
  }, [path]);

  const sendMessage = async (message) => {
    const messagesRef = collection(db, path);
    const newMessage = {
      ...message,
      timestamp: new Date(),
    };
    await addDoc(messagesRef, newMessage);
  };

  return [messages, sendMessage];
}
