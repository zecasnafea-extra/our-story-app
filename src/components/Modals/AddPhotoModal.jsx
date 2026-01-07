import React, { useState } from 'react';
import { X, Upload } from 'lucide-react';
import { useFirestore } from '../../hooks/useFirestore';
import { useStorage } from '../../hooks/useStorage';
import { compressImage } from '../../utils/imageCompression'; // ADD THIS LINE

const AddPhotoModal = ({ onClose }) => {
  const { addDocument } = useFirestore('photos');
  const { uploadFile, uploading, progress } = useStorage();
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [compressing, setCompressing] = useState(false); // ADD THIS LINE
  const [formData, setFormData] = useState({
    caption: '',
    date: new Date().toISOString().split('T')[0]
  });

  // REPLACE the handleFileSelect function with this:
  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (file) {
      // Show preview immediately
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
      };
      reader.readAsDataURL(file);

      // Compress the image (happens in browser, not Firebase)
      try {
        setCompressing(true);
        const compressedBlob = await compressImage(file, 1920, 1920, 0.8);
        
        // Convert blob to file
        const compressedFile = new File([compressedBlob], file.name, {
          type: 'image/jpeg',
          lastModified: Date.now(),
        });
        
        setSelectedFile(compressedFile);
        
        // Log size reduction in console
        const originalSizeMB = (file.size / 1024 / 1024).toFixed(2);
        const compressedSizeMB = (compressedFile.size / 1024 / 1024).toFixed(2);
        console.log(`✅ Compressed: ${originalSizeMB}MB → ${compressedSizeMB}MB`);
      } catch (error) {
        console.error('Compression failed, using original:', error);
        setSelectedFile(file);
      } finally {
        setCompressing(false);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedFile || !formData.caption) return;

    try {
      const photoUrl = await uploadFile(selectedFile, 'photos');
      await addDocument({
        url: photoUrl,
        caption: formData.caption,
        date: formData.date
      });
      onClose();
    } catch (error) {
      console.error('Error adding photo:', error);
      alert('Failed to upload photo. Please try again.');
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
          >
            <X size={24} />
          </button>
        </div>

        <div className="space-y-4">
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
                disabled={compressing} // ADD THIS
              />
              <label htmlFor="photo-upload" className="cursor-pointer">
                {preview ? (
                  <div className="space-y-2">
                    <img 
                      src={preview} 
                      alt="Preview" 
                      className="w-full h-48 object-cover rounded-lg"
                    />
                    {/* ADD THIS CONDITIONAL */}
                    {compressing ? (
                      <p className="text-sm text-blue-600">🔄 Compressing image...</p>
                    ) : (
                      <p className="text-sm text-gray-600">Click to change photo</p>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Upload className="mx-auto text-gray-400" size={48} />
                    <p className="text-gray-600">Click to upload photo</p>
                    <p className="text-xs text-gray-400">PNG, JPG up to 10MB</p>
                    <p className="text-xs text-blue-600">✨ Auto-optimized for fast upload</p>
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
              className="input"
              placeholder="Describe this moment..."
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
              className="input"
              required
            />
          </div>

          {/* Upload Progress */}
          {uploading && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-gray-600">
                <span>Uploading...</span>
                <span>{progress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-pink-500 to-purple-600 h-2 rounded-full transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {/* Submit Button - UPDATE disabled condition */}
          <button
            onClick={handleSubmit}
            disabled={uploading || compressing || !selectedFile || !formData.caption}
            className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {compressing ? 'Compressing...' : uploading ? 'Uploading...' : 'Add Photo'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddPhotoModal;
