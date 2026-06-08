import React, { createContext, useContext, useState, useRef, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient.js';
import { OfflineManager } from '@/lib/offlineManager.js';
import { Capacitor } from '@capacitor/core';
import { useAuth } from './AuthContext.jsx';

const AudioContext = createContext();

export const AudioProvider = ({ children }) => {
  const { currentUser } = useAuth();
  const [currentTrack, setCurrentTrack] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playlist, setPlaylist] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [loopMode, setLoopMode] = useState('none'); // 'none', 'one', 'all'
  const [isShuffle, setIsShuffle] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [offlineTracks, setOfflineTracks] = useState([]);

  const audioRef = useRef(new Audio());

  // Charger la liste des morceaux hors ligne au démarrage
  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      OfflineManager.getDownloadedTracks().then(setOfflineTracks);
    }
  }, []);

  const registerView = async (trackId) => {
    try {
      const isPremiumUser = currentUser?.is_premium || false;
      await supabase.rpc('increment_view_count', {
        project_id: trackId,
        is_premium_user: isPremiumUser,
        viewer_id: currentUser?.id || null
      });
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

  const playTrack = async (track, newPlaylist = []) => {
    if (newPlaylist.length > 0) {
      setPlaylist(newPlaylist);
      const index = newPlaylist.findIndex(t => t.id === track.id);
      setCurrentIndex(index);
    }

    if (currentTrack?.id === track.id) {
      togglePlay();
      return;
    }

    // Gestion du mode hors ligne : Vérifier si le morceau est téléchargé
    let finalUrl = track.url;
    const downloaded = offlineTracks.find(t => t.id === track.id);

    if (downloaded && Capacitor.isNativePlatform()) {
      try {
        finalUrl = await OfflineManager.getLocalUrl(downloaded.localPath);
        console.log("Lecture depuis le stockage local:", finalUrl);
      } catch (e) {
        console.warn("Échec de lecture locale, tentative via URL réseau", e);
      }
    }

    setCurrentTrack({ ...track, isOffline: !!downloaded });
    audioRef.current.src = finalUrl;
    audioRef.current.play();
    setIsPlaying(true);
  };

  const downloadForOffline = async (track) => {
    try {
      const savedTrack = await OfflineManager.downloadTrack(track);
      setOfflineTracks(prev => [...prev.filter(t => t.id !== track.id), savedTrack]);
      return true;
    } catch (e) {
      console.error("Erreur lors de la mise hors ligne:", e);
      return false;
    }
  };

  const removeOffline = async (trackId) => {
    await OfflineManager.deleteTrack(trackId);
    setOfflineTracks(prev => prev.filter(t => t.id !== trackId));
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

  const stopTrack = () => {
    audioRef.current.pause();
    audioRef.current.src = "";
    setCurrentTrack(null);
    setIsPlaying(false);
    setProgress(0);
  };

  return (
    <AudioContext.Provider value={{
      currentTrack, isPlaying, progress, duration,
      loopMode, isShuffle, offlineTracks,
      setLoopMode, setIsShuffle,
      playTrack, togglePlay, handleNext, handlePrev, seek,
      downloadForOffline, removeOffline, stopTrack
    }}>
      {children}
    </AudioContext.Provider>
  );
};

export const useAudio = () => useContext(AudioContext);
