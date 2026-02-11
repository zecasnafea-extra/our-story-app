import React, { useState } from 'react';
import { Plus, Gift, Trash2 } from 'lucide-react';
import { useFirestore } from '../../hooks/useFirestore';
import AddWishModal from '../Modals/AddWishModal';

const WishJar = () => {
  const { documents: wishes, updateDocument, deleteDocument } = useFirestore('wishes');
  const [showModal, setShowModal] = useState(false);

  const revealWish = async (id) => {
    try { await updateDocument(id, { isRevealed: true }); }
    catch (error) { console.error('Error revealing wish:', error); }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this wish?')) {
      try { await deleteDocument(id); }
      catch (error) { console.error('Error deleting wish:', error); alert('Failed to delete wish. Please try again.'); }
    }
  };

  const canReveal = (wish) => {
    if (!wish.unlockDate) return true;
    return new Date(wish.unlockDate) <= new Date();
  };

  return (
    <div className="p-6 animate-fade-in" style={{ background: '#0B0B0C', minHeight: '100vh' }}>

      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-3xl font-semibold" style={{ color: '#C89B3C' }}>Wish Jar</h2>
          <p className="text-sm mt-1" style={{ color: '#787878' }}>Dreams we share together 🫙</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="text-white p-3 rounded-full shadow-lg hover:scale-110 transition-all"
          style={{ background: 'linear-gradient(135deg, #5C3A21 0%, #C89B3C 100%)', boxShadow: '0 4px 15px rgba(200,155,60,0.25)' }}
        >
          <Plus size={24} />
        </button>
      </div>

      {/* Wishes Grid */}
      <div className="grid gap-4">
        {wishes.map((wish, index) => (
          <div
            key={wish.id}
            className="card animate-slide-up relative group"
            style={{
              animationDelay: `${index * 100}ms`,
              background: 'linear-gradient(135deg, #1A1A1C 0%, #201A08 50%, #1A1A1C 100%)',
              border: '1px solid rgba(200,155,60,0.25)'
            }}
          >
            {wish.isRevealed && (
              <button
                onClick={() => handleDelete(wish.id)}
                className="absolute top-4 right-4 p-2 rounded-full opacity-0 group-hover:opacity-100 transition-all z-10"
                style={{ background: 'rgba(180,50,50,0.15)', color: '#E05555' }}
              >
                <Trash2 size={18} />
              </button>
            )}

            {wish.isRevealed ? (
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <Gift style={{ color: '#C89B3C', flexShrink: 0, marginTop: '0.25rem' }} size={24} />
                  <div className="flex-1">
                    <p className="text-lg font-medium leading-relaxed" style={{ color: '#E8E8E8' }}>
                      {wish.text}
                    </p>
                  </div>
                </div>
                <div className="flex justify-between items-center pt-3" style={{ borderTop: '1px solid rgba(200,155,60,0.15)' }}>
                  <span className="text-sm" style={{ color: '#787878' }}>— {wish.createdBy || 'Anonymous'}</span>
                  <span className="text-xs font-medium" style={{ color: '#C89B3C' }}>Revealed ✨</span>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full mb-4 animate-pulse"
                  style={{ background: 'linear-gradient(135deg, #5C3A21 0%, #C89B3C 100%)', boxShadow: '0 0 20px rgba(200,155,60,0.25)' }}>
                  <Gift className="text-white" size={40} />
                </div>
                <p className="font-medium mb-4" style={{ color: '#A8A8A8' }}>A wish is waiting...</p>

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
                      className="block mx-auto text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity"
                      style={{ color: '#E05555', marginTop: '0.5rem' }}
                    >
                      Delete
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="text-sm" style={{ color: '#787878' }}>Locked until</p>
                    <p className="font-semibold" style={{ color: '#C89B3C' }}>
                      {new Date(wish.unlockDate).toLocaleDateString('en-US', {
                        year: 'numeric', month: 'long', day: 'numeric'
                      })}
                    </p>
                    <div className="mt-3 text-2xl">🔒</div>
                    <button
                      onClick={() => handleDelete(wish.id)}
                      className="block mx-auto text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity mt-4"
                      style={{ color: '#E05555' }}
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
          <div className="text-center py-16" style={{ color: '#787878' }}>
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
