import { useState } from 'react';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from '../firebase/config';

export const useStorage = () => {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);

  const uploadFile = async (file, path) => {
    if (!file) {
      throw new Error('No file provided');
    }

    setUploading(true);
    setError(null);
    setProgress(0);

    try {
      const timestamp = Date.now();
      const fileName = `${timestamp}_${file.name}`;
      const storageRef = ref(storage, `${path}/${fileName}`);
      
      console.log('📤 Uploading to:', `${path}/${fileName}`);
      console.log('📦 File size:', (file.size / 1024 / 1024).toFixed(2), 'MB');
      
      // Simulate progress (since uploadBytes doesn't provide progress)
      setProgress(30);
      
      // Upload file
      const snapshot = await uploadBytes(storageRef, file);
      console.log('✅ Upload complete');
      
      setProgress(70);
      
      // Get download URL
      const downloadURL = await getDownloadURL(snapshot.ref);
      console.log('✅ Download URL obtained:', downloadURL);
      
      setProgress(100);
      setUploading(false);
      
      return downloadURL;
    } catch (err) {
      console.error('❌ Upload error:', err);
      console.error('Error code:', err.code);
      console.error('Error message:', err.message);
      
      setError(err.message);
      setUploading(false);
      setProgress(0);
      
      throw err;
    }
  };

  const deleteFile = async (fileUrl) => {
    try {
      console.log('🗑️ Deleting file:', fileUrl);
      const fileRef = ref(storage, fileUrl);
      await deleteObject(fileRef);
      console.log('✅ File deleted successfully');
    } catch (err) {
      console.error('❌ Delete error:', err);
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
