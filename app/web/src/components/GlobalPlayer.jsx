import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, SkipForward, SkipBack, Repeat, Repeat1, Shuffle, Volume2, X, Maximize2, Minimize2 } from 'lucide-react';
import { useAudio } from '@/contexts/AudioContext.jsx';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';

const GlobalPlayer = () => {
  const {
    currentTrack, isPlaying, progress, duration,
    loopMode, isShuffle,
    setLoopMode, setIsShuffle,
    togglePlay, handleNext, handlePrev, seek
  } = useAudio();

  const [isExpanded, setIsExpanded] = useState(false);

  if (!currentTrack) return null;

  const formatTime = (time) => {
    if (isNaN(time)) return "0:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  const toggleLoop = () => {
    if (loopMode === 'none') setLoopMode('all');
    else if (loopMode === 'all') setLoopMode('one');
    else setLoopMode('none');
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        className="fixed bottom-24 left-4 right-4 md:left-auto md:right-8 md:w-96 z-[90]"
      >
        <div className="bg-[#0a0a0a]/95 backdrop-blur-xl border border-[#D4AF37]/30 rounded-2xl shadow-2xl overflow-hidden shadow-[#D4AF37]/10">

          {/* Progress Bar at the top */}
          <div className="h-1 bg-[#222] w-full cursor-pointer group relative" onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const percentage = x / rect.width;
            seek(percentage * duration);
          }}>
            <div
              className="h-full bg-[#D4AF37] transition-all duration-100"
              style={{ width: `${(progress / duration) * 100}%` }}
            />
          </div>

          <div className="p-4">
            <div className="flex items-center gap-4">
              {/* Cover Art */}
              <div className="w-12 h-12 rounded-lg overflow-hidden bg-[#111] shrink-0 border border-[#222]">
                <img src={currentTrack.cover} alt={currentTrack.title} className="w-full h-full object-cover" />
              </div>

              {/* Info */}
              <div className="flex-grow min-w-0">
                <h4 className="text-white font-bold text-sm truncate">{currentTrack.title}</h4>
                <p className="text-white/50 text-xs truncate">{currentTrack.artist}</p>
              </div>

              {/* Mini Controls */}
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" onClick={handlePrev} className="text-white/70 hover:text-white h-8 w-8">
                  <SkipBack className="w-4 h-4" />
                </Button>
                <Button onClick={togglePlay} className="bg-[#D4AF37] text-black hover:bg-[#b5952f] rounded-full h-10 w-10 p-0 flex items-center justify-center shrink-0">
                  {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-1" />}
                </Button>
                <Button variant="ghost" size="icon" onClick={handleNext} className="text-white/70 hover:text-white h-8 w-8">
                  <SkipForward className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => setIsExpanded(!isExpanded)} className="text-white/40 hover:text-white h-8 w-8 ml-2">
                  {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                </Button>
              </div>
            </div>

            {/* Expanded Controls */}
            {isExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                className="mt-6 space-y-4 pt-4 border-t border-[#222]"
              >
                <div className="flex justify-between text-[10px] font-bold text-white/40 uppercase tracking-widest">
                  <span>{formatTime(progress)}</span>
                  <span>{formatTime(duration)}</span>
                </div>

                <div className="flex justify-center items-center gap-8">
                  <button
                    onClick={() => setIsShuffle(!isShuffle)}
                    className={`transition-colors ${isShuffle ? 'text-[#D4AF37]' : 'text-white/30 hover:text-white'}`}
                  >
                    <Shuffle className="w-5 h-5" />
                  </button>

                  <button
                    onClick={toggleLoop}
                    className={`transition-colors ${loopMode !== 'none' ? 'text-[#D4AF37]' : 'text-white/30 hover:text-white'}`}
                  >
                    {loopMode === 'one' ? <Repeat1 className="w-5 h-5" /> : <Repeat className="w-5 h-5" />}
                  </button>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default GlobalPlayer;
