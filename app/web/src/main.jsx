import React from 'react';
import ReactDOM from 'react-dom/client';
import App from '@/App';
import '@/index.css';
import { GoogleAuth } from '@codetrix-studio/capacitor-google-auth';
import { Capacitor } from '@capacitor/core';

// Initialisation de Google Auth seulement si on est sur mobile ou si configuré
try {
  if (Capacitor.isNativePlatform()) {
    GoogleAuth.initialize();
  }
} catch (e) {
  console.warn("GoogleAuth init skip:", e);
}

ReactDOM.createRoot(document.getElementById('root')).render(
	<App />
);