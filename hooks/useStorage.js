import { useState } from 'react';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from '../firebase/config';

export const useStorage = () => {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);

  const uploadFile = async (file, path) => {
    if (!file) return null;

    setUploading(true);
    setError(null);
    setProgress(0);

    try {
      const timestamp = Date.now();
      const fileName = `${timestamp}_${file.name}`;
      const storageRef = ref(storage, `${path}/${fileName}`);
      
      // Upload file
      const snapshot = await uploadBytes(storageRef, file);
      setProgress(100);
      
      // Get download URL
      const downloadURL = await getDownloadURL(snapshot.ref);
      
      setUploading(false);
      return downloadURL;
    } catch (err) {
      console.error('Upload error:', err);
      setError(err.message);
      setUploading(false);
      throw err;
    }
  };

  const deleteFile = async (fileUrl) => {
    try {
      const fileRef = ref(storage, fileUrl);
      await deleteObject(fileRef);
    } catch (err) {
      console.error('Delete error:', err);
      throw err;
    }
  };

  return {
    uploadFile,
    deleteFile,
    uploading,
    progress,
    error,
  };
};