import React, { useState } from 'react';
import { Plus, X, Trash2 } from 'lucide-react';
import { useFirestore } from '../../hooks/useFirestore';
import { useStorage } from '../../hooks/useStorage';
import AddPhotoModal from '../Modals/AddPhotoModal';

const PhotoAlbum = () => {
  const { documents: photos, deleteDocument, loading } = useFirestore('photos');
  const { deleteFile } = useStorage();
  const [showModal, setShowModal] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async (photo) => {
    if (window.confirm('Are you sure you want to delete this photo? This cannot be undone.')) {
      setDeleting(true);
      try {
        console.log('🗑️ Deleting photo:', photo.id);
        
        // Step 1: Delete from Storage
        console.log('📦 Deleting from Storage...');
        await deleteFile(photo.url);
        console.log('✅ Deleted from Storage');
        
        // Step 2: Delete from Firestore
        console.log('📝 Deleting from Firestore...');
        await deleteDocument(photo.id);
        console.log('✅ Deleted from Firestore');
        
        setSelectedPhoto(null);
        console.log('🎉 Photo deleted successfully!');
      } catch (error) {
        console.error('❌ Error deleting photo:', error);
        alert('Failed to delete photo. Please try again.');
      } finally {
        setDeleting(false);
      }
    }
  };

  if (loading) {
    return (
      <div className="p-6 animate-fade-in">
        <div className="flex justify-center items-center py-16">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto"></div>
            <p className="text-gray-600 mt-4">Loading photos...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 animate-fade-in">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-3xl font-bold text-gray-800">Photo Album</h2>
          <p className="text-gray-600 text-sm mt-1">
            Our beautiful moments captured ({photos.length} {photos.length === 1 ? 'photo' : 'photos'})
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-gradient-to-r from-pink-500 to-purple-600 text-white p-3 rounded-full shadow-lg hover:shadow-xl hover:scale-110 transition-all"
          title="Add new photo"
        >
          <Plus size={24} />
        </button>
      </div>

      {/* Photo Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {photos.map((photo, index) => (
          <div
            key={photo.id}
            className="card p-0 overflow-hidden cursor-pointer hover:scale-105 transition-transform animate-scale-in group relative"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            {/* Delete Button (appears on hover) */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDelete(photo);
              }}
              disabled={deleting}
              className="absolute top-2 right-2 p-2 bg-red-500 hover:bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-all z-10 shadow-lg disabled:opacity-50"
              title="Delete photo"
            >
              <Trash2 size={16} />
            </button>

            {/* Photo */}
            <div 
              onClick={() => setSelectedPhoto(photo)}
              className="relative aspect-square"
            >
              <img
                src={photo.url}
                alt={photo.caption}
                className="w-full h-full object-cover"
                loading="lazy"
              />
              {/* Hover overlay with caption */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                <p className="text-white text-sm font-medium line-clamp-2">
                  {photo.caption}
                </p>
              </div>
            </div>
            
            {/* Photo Info */}
            <div className="p-3 bg-white">
              <p className="text-sm font-medium text-gray-800 line-clamp-1">
                {photo.caption}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {new Date(photo.date).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric'
                })}
              </p>
            </div>
          </div>
        ))}

        {/* Empty State */}
        {photos.length === 0 && (
          <div className="col-span-2 md:col-span-3 lg:col-span-4 text-center py-16 text-gray-400">
            <div className="text-6xl mb-4">📸</div>
            <p className="text-lg font-medium">No photos yet</p>
            <p className="text-sm mt-2">Start capturing your beautiful moments together</p>
            <button
              onClick={() => setShowModal(true)}
              className="mt-4 px-6 py-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all"
            >
              Add Your First Photo
            </button>
          </div>
        )}
      </div>

      {/* Photo Modal (Full View) */}
      {selectedPhoto && (
        <div 
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setSelectedPhoto(null)}
        >
          {/* Close Button */}
          <button
            onClick={() => setSelectedPhoto(null)}
            className="absolute top-4 right-4 text-white hover:text-pink-400 transition-colors z-10"
            title="Close"
          >
            <X size={32} />
          </button>

          {/* Delete Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDelete(selectedPhoto);
            }}
            disabled={deleting}
            className="absolute top-4 left-4 p-3 bg-red-500 hover:bg-red-600 text-white rounded-full transition-colors z-10 flex items-center gap-2 disabled:opacity-50"
            title="Delete photo"
          >
            <Trash2 size={20} />
            <span className="text-sm font-medium">{deleting ? 'Deleting...' : 'Delete Photo'}</span>
          </button>
          
          {/* Photo Content */}
          <div className="max-w-4xl w-full" onClick={(e) => e.stopPropagation()}>
            <img
              src={selectedPhoto.url}
              alt={selectedPhoto.caption}
              className="w-full h-auto rounded-lg shadow-2xl"
            />
            <div className="bg-white rounded-b-lg p-4 mt-2">
              <p className="text-lg font-medium text-gray-800">
                {selectedPhoto.caption}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                {new Date(selectedPhoto.date).toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Add Photo Modal */}
      {showModal && <AddPhotoModal onClose={() => setShowModal(false)} />}
    </div>
  );
};

export default PhotoAlbum;
