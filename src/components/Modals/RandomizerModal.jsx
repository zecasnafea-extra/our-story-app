import React, { useState, useEffect } from 'react';
import { X, Shuffle, Film, Tv, Gamepad2, Sparkles } from 'lucide-react';

const RandomizerModal = ({ items, onClose }) => {
  const [selectedType, setSelectedType] = useState('all'); // all, movie, series, game
  const [isSpinning, setIsSpinning] = useState(false);
  const [currentItem, setCurrentItem] = useState(null);
  const [finalItem, setFinalItem] = useState(null);
  const [spinSpeed, setSpinSpeed] = useState(100);

  const getFilteredItems = () => {
    let filtered = items.filter(item => item.status !== 'done'); // Only show not completed items
    
    if (selectedType !== 'all') {
      filtered = filtered.filter(item => item.type === selectedType);
    }
    
    return filtered;
  };

  const startRandomizer = () => {
    const availableItems = getFilteredItems();
    
    if (availableItems.length === 0) {
      alert('No items available to randomize!');
      return;
    }

    setIsSpinning(true);
    setFinalItem(null);
    setSpinSpeed(50);

    let spinCount = 0;
    const maxSpins = 30;
    
    const spinInterval = setInterval(() => {
      // Pick random item
      const randomIndex = Math.floor(Math.random() * availableItems.length);
      setCurrentItem(availableItems[randomIndex]);
      
      spinCount++;
      
      // Gradually slow down
      if (spinCount > 15) {
        setSpinSpeed(prev => prev + 20);
      }
      
      // Stop spinning
      if (spinCount >= maxSpins) {
        clearInterval(spinInterval);
        setIsSpinning(false);
        setFinalItem(availableItems[randomIndex]);
      }
    }, spinSpeed);
  };

  const getTypeColor = (type) => {
    switch(type) {
      case 'movie': return 'from-red-500 to-pink-500';
      case 'series': return 'from-blue-500 to-cyan-500';
      case 'game': return 'from-purple-500 to-indigo-500';
      default: return 'from-pink-500 to-purple-500';
    }
  };

  const getTypeIcon = (type) => {
    switch(type) {
      case 'movie': return <Film size={48} className="text-white" />;
      case 'series': return <Tv size={48} className="text-white" />;
      case 'game': return <Gamepad2 size={48} className="text-white" />;
      default: return <Sparkles size={48} className="text-white" />;
    }
  };

  const filteredCount = getFilteredItems().length;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50 animate-fade-in backdrop-blur-sm">
      <div className="bg-white rounded-3xl p-8 max-w-md w-full animate-scale-in shadow-2xl">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-purple-500 to-pink-500 p-3 rounded-full">
              <Shuffle className="text-white" size={24} />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-gray-800">Pick Random</h3>
              <p className="text-sm text-gray-500">{filteredCount} items available</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            disabled={isSpinning}
          >
            <X size={24} />
          </button>
        </div>

        {/* Type Filter */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            What do you want to pick?
          </label>
          <div className="grid grid-cols-4 gap-2">
            <button
              onClick={() => setSelectedType('all')}
              disabled={isSpinning}
              className={`p-3 rounded-xl border-2 transition-all ${
                selectedType === 'all'
                  ? 'border-purple-500 bg-purple-50'
                  : 'border-gray-200 hover:border-purple-300'
              } disabled:opacity-50`}
            >
              <Sparkles className={selectedType === 'all' ? 'text-purple-500' : 'text-gray-400'} size={24} />
              <div className="text-xs font-medium mt-1">All</div>
            </button>
            <button
              onClick={() => setSelectedType('movie')}
              disabled={isSpinning}
              className={`p-3 rounded-xl border-2 transition-all ${
                selectedType === 'movie'
                  ? 'border-red-500 bg-red-50'
                  : 'border-gray-200 hover:border-red-300'
              } disabled:opacity-50`}
            >
              <Film className={selectedType === 'movie' ? 'text-red-500' : 'text-gray-400'} size={24} />
              <div className="text-xs font-medium mt-1">Movie</div>
            </button>
            <button
              onClick={() => setSelectedType('series')}
              disabled={isSpinning}
              className={`p-3 rounded-xl border-2 transition-all ${
                selectedType === 'series'
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-blue-300'
              } disabled:opacity-50`}
            >
              <Tv className={selectedType === 'series' ? 'text-blue-500' : 'text-gray-400'} size={24} />
              <div className="text-xs font-medium mt-1">Series</div>
            </button>
            <button
              onClick={() => setSelectedType('game')}
              disabled={isSpinning}
              className={`p-3 rounded-xl border-2 transition-all ${
                selectedType === 'game'
                  ? 'border-purple-500 bg-purple-50'
                  : 'border-gray-200 hover:border-purple-300'
              } disabled:opacity-50`}
            >
              <Gamepad2 className={selectedType === 'game' ? 'text-purple-500' : 'text-gray-400'} size={24} />
              <div className="text-xs font-medium mt-1">Game</div>
            </button>
          </div>
        </div>

        {/* Display Area */}
        <div className="mb-6">
          {!currentItem && !finalItem ? (
            <div className="text-center py-12 bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl">
              <Shuffle className="mx-auto text-gray-400 mb-4" size={64} />
              <p className="text-gray-600 font-medium">Ready to pick something?</p>
              <p className="text-sm text-gray-500 mt-1">Click the button below!</p>
            </div>
          ) : (
            <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${getTypeColor(currentItem?.type || finalItem?.type)} p-8 text-center transition-all ${
              isSpinning ? 'animate-pulse' : 'animate-bounce-in'
            }`}>
              {/* Sparkles effect */}
              {finalItem && !isSpinning && (
                <div className="absolute inset-0 overflow-hidden">
                  <div className="absolute top-0 left-1/4 w-2 h-2 bg-white rounded-full animate-ping"></div>
                  <div className="absolute top-1/4 right-1/4 w-2 h-2 bg-white rounded-full animate-ping" style={{ animationDelay: '0.2s' }}></div>
                  <div className="absolute bottom-1/4 left-1/3 w-2 h-2 bg-white rounded-full animate-ping" style={{ animationDelay: '0.4s' }}></div>
                </div>
              )}
              
              <div className="relative z-10">
                <div className="mb-4">
                  {getTypeIcon(currentItem?.type || finalItem?.type)}
                </div>
                <h4 className="text-2xl font-bold text-white mb-2">
                  {currentItem?.title || finalItem?.title}
                </h4>
                <div className="inline-block px-4 py-1 bg-white/20 rounded-full backdrop-blur-sm">
                  <span className="text-sm text-white font-medium">
                    {currentItem?.type || finalItem?.type}
                  </span>
                </div>
                
                {finalItem && !isSpinning && (
                  <div className="mt-4 text-white space-y-2">
                    <p className="text-lg font-semibold">🎉 You should watch/play this!</p>
                    
                    {/* Rating */}
                    {finalItem.rating > 0 && (
                      <div className="flex items-center justify-center gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <span key={star} className="text-yellow-300 text-lg">
                            {star <= finalItem.rating ? '★' : '☆'}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Categories */}
                    {finalItem.categories && finalItem.categories.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 justify-center">
                        {finalItem.categories.map((cat) => (
                          <span
                            key={cat}
                            className="text-xs px-2 py-1 bg-white/20 rounded-full backdrop-blur-sm"
                          >
                            {cat}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Type Specific Info */}
                    {finalItem.type === 'series' && (
                      <p className="text-sm opacity-90">
                        Season {finalItem.season} • {finalItem.watchedEpisodes}/{finalItem.totalEpisodes} episodes
                      </p>
                    )}
                    {finalItem.type === 'game' && (
                      <p className="text-sm opacity-90">
                        {finalItem.hoursPlayed}h played • ~{finalItem.estimatedHours}h total
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Randomize Button */}
        <button
          onClick={startRandomizer}
          disabled={isSpinning || filteredCount === 0}
          className={`w-full py-4 rounded-xl font-bold text-lg transition-all shadow-lg ${
            isSpinning
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white hover:shadow-xl hover:scale-105'
          } disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2`}
        >
          {isSpinning ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              Picking...
            </>
          ) : (
            <>
              <Shuffle size={24} />
              {finalItem ? 'Pick Again!' : 'Randomize!'}
            </>
          )}
        </button>

        {filteredCount === 0 && (
          <p className="text-center text-sm text-gray-500 mt-3">
            No items available for the selected type
          </p>
        )}
      </div>
    </div>
  );
};

export default RandomizerModal;
