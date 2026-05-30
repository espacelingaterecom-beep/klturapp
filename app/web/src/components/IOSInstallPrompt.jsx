import React, { useState, useEffect } from 'react';
import { Share, X, PlusSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const IOSInstallPrompt = () => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Vérifier si c'est un iPhone/iPad et si l'app n'est pas déjà "installée"
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;

    if (isIOS && !isStandalone) {
      // Afficher le message après 3 secondes
      const timer = setTimeout(() => setShow(true), 3000);
      return () => clearTimeout(timer);
    }
  }, []);

  if (!show) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        className="fixed bottom-6 left-4 right-4 z-[100] md:hidden"
      >
        <div className="bg-[#111] border border-[#D4AF37]/30 rounded-2xl p-5 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-[#D4AF37]" />

          <button onClick={() => setShow(false)} className="absolute top-2 right-2 text-white/40 hover:text-white">
            <X className="w-5 h-5" />
          </button>

          <div className="flex gap-4 items-center">
            <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0 border border-[#222]">
              <img src="https://horizons-cdn.hostinger.com/8cb4c9c6-9962-4ccc-80b1-ea71b7a63684/866a587d484c1eedb4c3fd12c56b7757.png" alt="App Icon" className="w-full h-full object-cover" />
            </div>

            <div className="flex-grow">
              <h4 className="text-white font-bold text-sm mb-1">Installer KLTUR RAP</h4>
              <p className="text-white/60 text-xs leading-relaxed">
                Ajoutez l'app sur votre écran d'accueil pour une expérience optimale.
              </p>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-white/5 space-y-3">
            <div className="flex items-center gap-3 text-white/80 text-xs">
              <div className="bg-white/10 p-1.5 rounded-lg">
                <Share className="w-4 h-4 text-blue-400" />
              </div>
              <span>1. Appuyez sur le bouton <strong>Partager</strong></span>
            </div>

            <div className="flex items-center gap-3 text-white/80 text-xs">
              <div className="bg-white/10 p-1.5 rounded-lg">
                <PlusSquare className="w-4 h-4 text-white" />
              </div>
              <span>2. Choisissez <strong>"Sur l'écran d'accueil"</strong></span>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default IOSInstallPrompt;
