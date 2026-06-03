import { Filesystem, Directory } from '@capacitor/filesystem';
import { Preferences } from '@capacitor/preferences';
import { Capacitor } from '@capacitor/core';

const TRACKS_KEY = 'offline_tracks';

export const OfflineManager = {
  // Enregistrer un morceau pour le mode hors ligne
  async downloadTrack(track, supabase) {
    if (!Capacitor.isNativePlatform()) {
      throw new Error("Le mode hors ligne n'est disponible que sur l'application mobile.");
    }

    try {
      // 1. Télécharger le fichier audio depuis Supabase
      const response = await fetch(track.url);
      const blob = await response.blob();

      // Convertir le blob en base64 pour Filesystem
      const base64Data = await this.blobToBase64(blob);
      const fileName = `track_${track.id}.mp3`;

      const savedFile = await Filesystem.writeFile({
        path: fileName,
        data: base64Data,
        directory: Directory.Data
      });

      // 2. Télécharger la cover si elle existe
      let localCover = track.cover;
      if (track.cover && !track.cover.startsWith('http')) {
        const coverRes = await fetch(track.cover);
        const coverBlob = await coverRes.blob();
        const coverBase64 = await this.blobToBase64(coverBlob);
        const coverName = `cover_${track.id}.jpg`;

        await Filesystem.writeFile({
          path: coverName,
          data: coverBase64,
          directory: Directory.Data
        });
        localCover = coverName;
      }

      // 3. Sauvegarder les métadonnées dans Preferences
      const { value } = await Preferences.get({ key: TRACKS_KEY });
      const tracks = value ? JSON.parse(value) : [];

      const newTrack = {
        ...track,
        localPath: fileName,
        localCover: localCover,
        isOffline: true,
        downloadedAt: new Date().toISOString()
      };

      const updatedTracks = [...tracks.filter(t => t.id !== track.id), newTrack];
      await Preferences.set({
        key: TRACKS_KEY,
        value: JSON.stringify(updatedTracks)
      });

      return newTrack;
    } catch (error) {
      console.error("Erreur téléchargement hors ligne:", error);
      throw error;
    }
  },

  // Récupérer la liste des morceaux téléchargés
  async getDownloadedTracks() {
    const { value } = await Preferences.get({ key: TRACKS_KEY });
    return value ? JSON.parse(value) : [];
  },

  // Supprimer un morceau du mode hors ligne
  async deleteTrack(trackId) {
    try {
      await Filesystem.deleteFile({
        path: `track_${trackId}.mp3`,
        directory: Directory.Data
      });

      const tracks = await this.getDownloadedTracks();
      const updatedTracks = tracks.filter(t => t.id !== trackId);

      await Preferences.set({
        key: TRACKS_KEY,
        value: JSON.stringify(updatedTracks)
      });
    } catch (e) {
      console.error("Erreur suppression fichier local:", e);
    }
  },

  // Utilitaire pour convertir un Blob en Base64
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
