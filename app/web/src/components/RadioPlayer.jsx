import React from 'react';
import { Play, Pause, Volume2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { useAudio } from '@/contexts/AudioContext.jsx';

const RadioPlayer = ({ show }) => {
  const { currentTrack, isPlaying, togglePlay, progress, duration, seek, playTrack } = useAudio();

  const isCurrentShow = currentTrack?.id === 'radio-live';

  const handleToggle = () => {
    if (isCurrentShow) {
      togglePlay();
    } else {
      playTrack({
        id: 'radio-live',
        title: show.title,
        artist: 'KLTUR RAP LIVE',
        url: 'https://stream.radio.co/s8a6a6e2e2/listen', // URL de test ou live
        cover: 'https://horizons-cdn.hostinger.com/8cb4c9c6-9962-4ccc-80b1-ea71b7a63684/866a587d484c1eedb4c3fd12c56b7757.png'
      });
    }
  };

  const formatTime = (time) => {
    if (isNaN(time)) return "0:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  return (
    <div className="bg-[#111111] rounded-2xl p-6 border border-[#333333] glow-gold">
      <div className="flex items-center gap-4 mb-6">
        <Button
          onClick={handleToggle}
          className="w-16 h-16 rounded-full bg-[#D4AF37] text-black hover:bg-[#FDB913] transition-all duration-300 flex items-center justify-center"
        >
          {isCurrentShow && isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6 ml-1" />}
        </Button>
        <div className="flex-1">
          <h3 className="text-lg font-bold text-white mb-1">{show.title}</h3>
          <p className="text-sm text-white/60">{show.schedule}</p>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <div className="flex items-center justify-between text-xs text-white/50 mb-2">
            <span>{isCurrentShow ? formatTime(progress) : '0:00'}</span>
            <span>{isCurrentShow ? formatTime(duration) : show.duration}</span>
          </div>
          <Slider
            value={[isCurrentShow ? (progress / duration) * 100 : 0]}
            max={100}
            step={0.1}
            onValueChange={(val) => isCurrentShow && seek((val[0] / 100) * duration)}
            className="w-full"
          />
        </div>

        <div className="flex items-center gap-3">
          <Volume2 className="h-4 w-4 text-[#D4AF37]" />
          <Slider
            defaultValue={[70]}
            max={100}
            step={1}
            className="w-32"
          />
        </div>
      </div>
    </div>
  );
};

export default RadioPlayer;