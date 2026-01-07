import { useState, useEffect } from 'react';
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../firebase/config';

export const useFirestore = (collectionName) => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    
    console.log('🔍 Setting up listener for collection:', collectionName);
    
    const q = query(
      collection(db, collectionName),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const docs = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          docs.push({
            id: doc.id,
            ...data,
            // Convert Firestore Timestamps to JS Dates
            createdAt: data.createdAt?.toDate?.() || new Date(),
            updatedAt: data.updatedAt?.toDate?.() || null
          });
        });
        setDocuments(docs);
        setLoading(false);
        setError(null);
        console.log(`✅ Loaded ${docs.length} documents from ${collectionName}`);
      },
      (err) => {
        console.error('❌ Firestore error:', err);
        console.error('Error code:', err.code);
        console.error('Error message:', err.message);
        
        setError(err.message);
        setLoading(false);
        
        // If ordering fails due to missing index
        if (err.code === 'failed-precondition' || err.message.includes('index')) {
          console.warn('⚠️ You need to create an index in Firebase Console');
          const indexUrl = err.message.match(/https:\/\/[^\s]+/)?.[0];
          if (indexUrl) {
            console.warn('📝 Create index here:', indexUrl);
          }
        }
      }
    );

    return () => {
      console.log('🔌 Unsubscribing from', collectionName);
      unsubscribe();
    };
  }, [collectionName]);

  const addDocument = async (data) => {
    try {
      console.log('📝 Adding document to', collectionName);
      console.log('📄 Data:', data);
      
      const docRef = await addDoc(collection(db, collectionName), {
        ...data,
        createdAt: serverTimestamp(),
      });
      
      console.log('✅ Document added with ID:', docRef.id);
      return docRef.id;
    } catch (err) {
      console.error('❌ Error adding document:', err);
      console.error('Error code:', err.code);
      console.error('Error message:', err.message);
      throw err;
    }
  };

  const updateDocument = async (id, data) => {
    try {
      console.log('📝 Updating document:', id);
      const docRef = doc(db, collectionName, id);
      await updateDoc(docRef, {
        ...data,
        updatedAt: serverTimestamp(),
      });
      console.log('✅ Document updated:', id);
    } catch (err) {
      console.error('❌ Error updating document:', err);
      throw err;
    }
  };

  const deleteDocument = async (id) => {
    try {
      console.log('🗑️ Deleting document:', id);
      await deleteDoc(doc(db, collectionName, id));
      console.log('✅ Document deleted:', id);
    } catch (err) {
      console.error('❌ Error deleting document:', err);
      throw err;
    }
  };

  return {
    documents,
    loading,
    error,
    addDocument,
    updateDocument,
    deleteDocument,
  };
};
