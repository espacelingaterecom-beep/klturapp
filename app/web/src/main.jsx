import React from 'react';
import ReactDOM from 'react-dom/client';
import App from '@/App';
import '@/index.css';
import { GoogleAuth } from '@codetrix-studio/capacitor-google-auth';

// Initialisation de Google Auth
GoogleAuth.initialize();

ReactDOM.createRoot(document.getElementById('root')).render(
	<App />
);