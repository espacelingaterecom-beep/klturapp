import React, { useState } from 'react';
import { Play, Pause, Volume2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';

const RadioPlayer = ({ show }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState([70]);
  const [progress, setProgress] = useState([0]);

  const togglePlay = () => {
    setIsPlaying(!isPlaying);
  };

  return (
    <div className="bg-[#111111] rounded-2xl p-6 border border-[#333333] glow-gold">
      <div className="flex items-center gap-4 mb-6">
        <Button
          onClick={togglePlay}
          className="w-16 h-16 rounded-full bg-[#D4AF37] text-black hover:bg-[#FDB913] transition-all duration-300 flex items-center justify-center"
        >
          {isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6 ml-1" />}
        </Button>
        <div className="flex-1">
          <h3 className="text-lg font-bold text-white mb-1">{show.title}</h3>
          <p className="text-sm text-white/60">{show.schedule}</p>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <div className="flex items-center justify-between text-xs text-white/50 mb-2">
            <span>0:00</span>
            <span>{show.duration}</span>
          </div>
          <Slider
            value={progress}
            onValueChange={setProgress}
            max={100}
            step={1}
            className="w-full"
          />
        </div>

        <div className="flex items-center gap-3">
          <Volume2 className="h-4 w-4 text-[#D4AF37]" />
          <Slider
            value={volume}
            onValueChange={setVolume}
            max={100}
            step={1}
            className="w-32"
          />
          <span className="text-xs text-white/50 w-8">{volume[0]}%</span>
        </div>
      </div>
    </div>
  );
};

export default RadioPlayer;