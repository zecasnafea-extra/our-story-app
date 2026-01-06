import React, { useState } from 'react';
import { Plus, Gift, Trash2 } from 'lucide-react';
import { useFirestore } from '../../hooks/useFirestore';
import AddWishModal from '../Modals/AddWishModal';

const WishJar = () => {
  const { documents: wishes, updateDocument, deleteDocument } = useFirestore('wishes');
  const [showModal, setShowModal] = useState(false);

  const revealWish = async (id) => {
    try {
      await updateDocument(id, { isRevealed: true });
    } catch (error) {
      console.error('Error revealing wish:', error);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this wish?')) {
      try {
        await deleteDocument(id);
      } catch (error) {
        console.error('Error deleting wish:', error);
        alert('Failed to delete wish. Please try again.');
      }
    }
  };

  const canReveal = (wish) => {
    if (!wish.unlockDate) return true;
    return new Date(wish.unlockDate) <= new Date();
  };

  return (
    <div className="p-6 animate-fade-in">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-3xl font-bold text-gray-800">Wish Jar</h2>
          <p className="text-gray-600 text-sm mt-1">Dreams we share together 🫙</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-gradient-to-r from-pink-500 to-purple-600 text-white p-3 rounded-full shadow-lg hover:shadow-xl hover:scale-110 transition-all"
        >
          <Plus size={24} />
        </button>
      </div>

      {/* Wishes Grid */}
      <div className="grid gap-4">
        {wishes.map((wish, index) => (
          <div
            key={wish.id}
            className="card bg-gradient-to-br from-purple-50 via-pink-50 to-yellow-50 border-2 border-purple-200 animate-slide-up relative group"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            {wish.isRevealed && (
              <button
                onClick={() => handleDelete(wish.id)}
                className="absolute top-4 right-4 p-2 bg-red-100 hover:bg-red-200 text-red-600 rounded-full opacity-0 group-hover:opacity-100 transition-all z-10"
              >
                <Trash2 size={18} />
              </button>
            )}

            {wish.isRevealed ? (
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <Gift className="text-pink-500 flex-shrink-0 mt-1" size={24} />
                  <div className="flex-1">
                    <p className="text-lg font-medium text-gray-800 leading-relaxed">
                      {wish.text}
                    </p>
                  </div>
                </div>
                <div className="flex justify-between items-center pt-3 border-t border-purple-200">
                  <span className="text-sm text-gray-600">
                    — {wish.createdBy || 'Anonymous'}
                  </span>
                  <span className="text-xs text-purple-600 font-medium">
                    Revealed ✨
                  </span>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-pink-400 to-purple-500 rounded-full mb-4 animate-pulse">
                  <Gift className="text-white" size={40} />
                </div>
                <p className="text-gray-600 font-medium mb-4">A wish is waiting...</p>
                
                {canReveal(wish) ? (
                  <div className="space-y-2">
                    <button
                      onClick={() => revealWish(wish.id)}
                      className="btn-primary"
                    >
                      Reveal Wish ✨
                    </button>
                    <button
                      onClick={() => handleDelete(wish.id)}
                      className="block mx-auto text-sm text-red-600 hover:text-red-700 font-medium opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      Delete
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="text-sm text-gray-500">Locked until</p>
                    <p className="text-pink-600 font-semibold">
                      {new Date(wish.unlockDate).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                    <div className="mt-3 text-2xl">🔒</div>
                    <button
                      onClick={() => handleDelete(wish.id)}
                      className="block mx-auto text-sm text-red-600 hover:text-red-700 font-medium opacity-0 group-hover:opacity-100 transition-opacity mt-4"
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}

        {wishes.length === 0 && (
          <div className="text-center py-16 text-gray-400">
            <div className="text-6xl mb-4">🫙</div>
            <p className="text-lg">No wishes yet</p>
            <p className="text-sm mt-2">Add your dreams and wishes together</p>
          </div>
        )}
      </div>

      {showModal && <AddWishModal onClose={() => setShowModal(false)} />}
    </div>
  );
};

export default WishJar;