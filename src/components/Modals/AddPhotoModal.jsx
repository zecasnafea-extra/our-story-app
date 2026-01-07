import React, { useState } from 'react';
import { X, Upload } from 'lucide-react';
import { useFirestore } from '../../hooks/useFirestore';
import { useStorage } from '../../hooks/useStorage';

const AddPhotoModal = ({ onClose }) => {
  const { addDocument } = useFirestore('photos');
  const { uploadFile, uploading, progress, error } = useStorage();
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [formData, setFormData] = useState({
    caption: '',
    date: new Date().toISOString().split('T')[0]
  });

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file (JPG, PNG, etc.)');
        return;
      }

      // Validate file size (10MB max)
      if (file.size > 10 * 1024 * 1024) {
        alert('File size must be less than 10MB');
        return;
      }

      console.log('📁 File selected:', {
        name: file.name,
        size: `${(file.size / 1024 / 1024).toFixed(2)}MB`,
        type: file.type
      });

      setSelectedFile(file);
      
      // Show preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedFile) {
      alert('Please select a photo');
      return;
    }

    if (!formData.caption.trim()) {
      alert('Please add a caption');
      return;
    }

    try {
      console.log('🚀 Starting photo upload process...');
      
      // Step 1: Upload to Storage
      console.log('📤 Step 1: Uploading to Firebase Storage...');
      const photoUrl = await uploadFile(selectedFile, 'photos');
      console.log('✅ Step 1 complete - Photo URL:', photoUrl);
      
      // Step 2: Add to Firestore
      console.log('📝 Step 2: Adding document to Firestore...');
      const docData = {
        url: photoUrl,
        caption: formData.caption.trim(),
        date: formData.date,
        fileName: selectedFile.name,
        fileSize: selectedFile.size,
        fileType: selectedFile.type
      };
      
      const docId = await addDocument(docData);
      console.log('✅ Step 2 complete - Document ID:', docId);
      
      console.log('🎉 Photo uploaded successfully!');
      
      // Close modal
      onClose();
    } catch (error) {
      console.error('❌ ERROR OCCURRED:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      console.error('Full error:', error);
      
      alert(`Failed to upload photo: ${error.message || 'Unknown error occurred'}`);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="bg-white rounded-2xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto animate-scale-in">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-bold text-gray-800">📸 Add Photo</h3>
          <button 
            onClick={onClose} 
            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
            type="button"
            disabled={uploading}
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* File Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Choose Photo *
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-pink-400 transition-colors cursor-pointer">
              <input
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
                id="photo-upload"
                disabled={uploading}
              />
              <label htmlFor="photo-upload" className="cursor-pointer block">
                {preview ? (
                  <div className="space-y-2">
                    <img 
                      src={preview} 
                      alt="Preview" 
                      className="w-full h-48 object-cover rounded-lg"
                    />
                    <p className="text-sm text-gray-600 font-medium">
                      {selectedFile?.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {(selectedFile?.size / 1024 / 1024).toFixed(2)}MB
                    </p>
                    {!uploading && (
                      <p className="text-xs text-blue-600">Click to change photo</p>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Upload className="mx-auto text-gray-400" size={48} />
                    <p className="text-gray-600 font-medium">Click to upload photo</p>
                    <p className="text-xs text-gray-400">PNG, JPG, GIF up to 10MB</p>
                  </div>
                )}
              </label>
            </div>
          </div>

          {/* Caption */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Caption *
            </label>
            <input
              type="text"
              value={formData.caption}
              onChange={(e) => setFormData({...formData, caption: e.target.value})}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
              placeholder="Describe this moment..."
              disabled={uploading}
              required
            />
          </div>

          {/* Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Date *
            </label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({...formData, date: e.target.value})}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
              disabled={uploading}
              required
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              <strong>Error:</strong> {error}
            </div>
          )}

          {/* Upload Progress */}
          {uploading && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-gray-600">
                <span>Uploading...</span>
                <span>{progress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-pink-500 to-purple-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-xs text-gray-500 text-center">
                Please don't close this window...
              </p>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={uploading || !selectedFile || !formData.caption.trim()}
            className="w-full bg-gradient-to-r from-pink-500 to-purple-600 text-white py-3 rounded-lg font-medium hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {uploading ? `Uploading... ${progress}%` : 'Add Photo 📸'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddPhotoModal;
