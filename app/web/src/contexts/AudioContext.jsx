import React, { createContext, useContext, useState, useRef, useEffect } from 'react';

import { supabase } from '@/lib/supabaseClient.js';

const AudioContext = createContext();

export const AudioProvider = ({ children }) => {
  const [currentTrack, setCurrentTrack] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playlist, setPlaylist] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [loopMode, setLoopMode] = useState('none'); // 'none', 'one', 'all'
  const [isShuffle, setIsShuffle] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);

  const audioRef = useRef(new Audio());

  const registerView = async (trackId) => {
    try {
      await supabase.rpc('increment_view_count', { project_id: trackId });
    } catch (err) {
      console.error("View count error:", err);
    }
  };

  useEffect(() => {
    const audio = audioRef.current;

    const onPlay = () => {
      if (currentTrack?.id) {
        registerView(currentTrack.id);
      }
    };

    audio.addEventListener('play', onPlay, { once: true });

    const updateProgress = () => setProgress(audio.currentTime);
    const updateDuration = () => setDuration(audio.duration);
    const onEnded = () => handleNext();

    audio.addEventListener('timeupdate', updateProgress);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('ended', onEnded);

    return () => {
      audio.removeEventListener('play', onPlay);
      audio.removeEventListener('timeupdate', updateProgress);
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('ended', onEnded);
    };
  }, [currentTrack]);

  const playTrack = (track, newPlaylist = []) => {
    if (newPlaylist.length > 0) {
      setPlaylist(newPlaylist);
      const index = newPlaylist.findIndex(t => t.id === track.id);
      setCurrentIndex(index);
    }

    if (currentTrack?.id === track.id) {
      togglePlay();
      return;
    }

    setCurrentTrack(track);
    audioRef.current.src = track.url;
    audioRef.current.play();
    setIsPlaying(true);
  };

  const togglePlay = () => {
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleNext = () => {
    if (loopMode === 'one') {
      audioRef.current.currentTime = 0;
      audioRef.current.play();
      return;
    }

    let nextIndex = currentIndex + 1;
    if (nextIndex >= playlist.length) {
      if (loopMode === 'all') {
        nextIndex = 0;
      } else {
        setIsPlaying(false);
        return;
      }
    }

    const nextTrack = playlist[nextIndex];
    setCurrentIndex(nextIndex);
    setCurrentTrack(nextTrack);
    audioRef.current.src = nextTrack.url;
    audioRef.current.play();
    setIsPlaying(true);
  };

  const handlePrev = () => {
    let prevIndex = currentIndex - 1;
    if (prevIndex < 0) {
      if (loopMode === 'all') {
        prevIndex = playlist.length - 1;
      } else {
        audioRef.current.currentTime = 0;
        return;
      }
    }

    const prevTrack = playlist[prevIndex];
    setCurrentIndex(prevIndex);
    setCurrentTrack(prevTrack);
    audioRef.current.src = prevTrack.url;
    audioRef.current.play();
    setIsPlaying(true);
  };

  const seek = (time) => {
    audioRef.current.currentTime = time;
    setProgress(time);
  };

  return (
    <AudioContext.Provider value={{
      currentTrack, isPlaying, progress, duration,
      loopMode, isShuffle,
      setLoopMode, setIsShuffle,
      playTrack, togglePlay, handleNext, handlePrev, seek
    }}>
      {children}
    </AudioContext.Provider>
  );
};

export const useAudio = () => useContext(AudioContext);
