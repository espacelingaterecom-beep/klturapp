import { Filesystem, Directory } from '@capacitor/filesystem';
import { Preferences } from '@capacitor/preferences';
import { Capacitor } from '@capacitor/core';

const TRACKS_KEY = 'offline_tracks';
const CACHE_PREFIX = 'cache_';

export const OfflineManager = {
  // --- Gestion des Musiques ---
  // ... (keep existing downloadTrack, getDownloadedTracks, deleteTrack, etc.)

  // --- Gestion du Cache Général (Events, News, etc.) ---
  async saveToCache(key, data) {
    try {
      await Preferences.set({
        key: `${CACHE_PREFIX}${key}`,
        value: JSON.stringify({
          timestamp: new Date().getTime(),
          data: data
        })
      });
    } catch (e) {
      console.error(`Error saving cache for ${key}:`, e);
    }
  },

  async getFromCache(key) {
    try {
      const { value } = await Preferences.get({ key: `${CACHE_PREFIX}${key}` });
      if (value) {
        return JSON.parse(value).data;
      }
    } catch (e) {
      console.error(`Error reading cache for ${key}:`, e);
    }
    return null;
  },

  // ... rest of utility methods
  blobToBase64(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  },

  // Obtenir l'URL lisible par le lecteur audio pour un fichier local
  async getLocalUrl(fileName) {
    const file = await Filesystem.getUri({
      path: fileName,
      directory: Directory.Data
    });
    return Capacitor.convertFileSrc(file.uri);
  }
};
