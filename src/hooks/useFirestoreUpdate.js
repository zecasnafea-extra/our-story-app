import { db } from '../firebase/config';
import { doc, updateDoc, addDoc, collection } from 'firebase/firestore';

export const useFirestoreUpdate = () => {
  const updateDocument = async (collectionName, id, updates) => {
    const docRef = doc(db, collectionName, id);
    await updateDoc(docRef, updates);
  };

  const addDocument = async (collectionName, data) => {
    const colRef = collection(db, collectionName);
    await addDoc(colRef, data);
  };

  return { updateDocument, addDocument };
};
