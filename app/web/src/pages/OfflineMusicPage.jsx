import React from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Play, Pause, Trash2, WifiOff, Music, ChevronRight, Award } from 'lucide-react';
import { toast } from 'sonner';
import Header from '@/components/Header.jsx';
import Footer from '@/components/Footer.jsx';
import { Button } from '@/components/ui/button';
import { useAudio } from '@/contexts/AudioContext.jsx';

const OfflineMusicPage = () => {
  const { offlineTracks, playTrack, currentTrack, isPlaying, removeOffline } = useAudio();

  const handleDelete = async (e, trackId) => {
    e.preventDefault();
    e.stopPropagation();
    if (window.confirm("Supprimer ce morceau de votre stockage hors ligne ?")) {
      await removeOffline(trackId);
      toast.success("Supprimé du mode hors ligne");
    }
  };

  return (
    <>
      <Helmet>
        <title>Ma Musique Hors Ligne - KLTUR RAP</title>
      </Helmet>

      <div className="min-h-screen flex flex-col bg-[#050505]">
        <Header />

        <main className="flex-grow py-12 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto w-full">
          <div className="mb-10">
            <div className="flex items-center gap-3 mb-2">
              <WifiOff className="text-[#D4AF37] w-6 h-6" />
              <h1 className="text-3xl md:text-5xl font-black text-white uppercase tracking-tight">
                Mode <span className="text-[#D4AF37]">Hors Ligne</span>
              </h1>
            </div>
            <p className="text-white/60 text-lg">Retrouvez ici tous les morceaux que vous avez téléchargés sur votre appareil.</p>
          </div>

          {offlineTracks.length === 0 ? (
            <div className="bg-[#0a0a0a] rounded-3xl border border-[#222] border-dashed p-20 text-center">
              <div className="w-20 h-20 bg-[#111] rounded-full flex items-center justify-center mx-auto mb-6">
                <Music className="w-10 h-10 text-white/10" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Aucun morceau téléchargé</h3>
              <p className="text-white/40 mb-8 max-w-sm mx-auto">
                Parcourez la galerie et cliquez sur "Rendre hors ligne" pour écouter vos sons préférés sans connexion.
              </p>
              <Button asChild className="bg-[#D4AF37] text-black hover:bg-[#b5952f] font-bold px-8">
                <Link to="/galerie">Découvrir des morceaux</Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {offlineTracks.map((track, index) => {
                const isCurrent = currentTrack?.id === track.id;
                return (
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    key={track.id}
                    onClick={() => playTrack(track, offlineTracks)}
                    className={`group relative bg-[#0a0a0a] border ${
                      isCurrent ? 'border-[#D4AF37] shadow-[0_0_20px_rgba(212,175,55,0.1)]' : 'border-[#222]'
                    } hover:border-[#D4AF37]/50 rounded-2xl p-4 flex items-center gap-4 cursor-pointer transition-all active:scale-[0.98]`}
                  >
                    <div className="relative w-16 h-16 shrink-0 overflow-hidden rounded-xl bg-[#111]">
                      <img
                        src={track.cover}
                        alt={track.title}
                        className="w-full h-full object-cover transition-transform group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        {isCurrent && isPlaying ? (
                          <Pause className="w-6 h-6 text-white fill-current" />
                        ) : (
                          <Play className="w-6 h-6 text-white fill-current pl-1" />
                        )}
                      </div>
                    </div>

                    <div className="flex-grow min-w-0">
                      <h3 className={`font-bold text-base truncate ${isCurrent ? 'text-[#D4AF37]' : 'text-white'}`}>
                        {track.title}
                      </h3>
                      <div className="flex items-center gap-2">
                        <p className="text-white/50 text-sm truncate">{track.artist}</p>
                        {track.is_premium && <Award className="w-3 h-3 text-[#D4AF37]" />}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={(e) => handleDelete(e, track.id)}
                        className="p-2 text-white/20 hover:text-red-500 hover:bg-red-500/10 rounded-full transition-all"
                        title="Supprimer du stockage local"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                      <ChevronRight className={`w-5 h-5 transition-all ${isCurrent ? 'text-[#D4AF37] translate-x-1' : 'text-white/10'}`} />
                    </div>

                    {isCurrent && isPlaying && (
                      <div className="absolute -bottom-[1px] left-4 right-4 h-[2px] bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent animate-pulse" />
                    )}
                  </motion.div>
                );
              })}
            </div>
          )}

          <div className="mt-12 bg-[#111]/30 rounded-2xl p-6 border border-[#222]">
            <h4 className="text-white font-bold mb-2 flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-ping" />
              Stockage Intelligent
            </h4>
            <p className="text-sm text-white/40 leading-relaxed">
              Les morceaux sont stockés de manière sécurisée dans la mémoire de votre application.
              Ils resteront disponibles même si vous redémarrez votre téléphone ou si vous perdez le réseau.
            </p>
          </div>
        </main>

        <Footer />
      </div>
    </>
  );
};

export default OfflineMusicPage;
