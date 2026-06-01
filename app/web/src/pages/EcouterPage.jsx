import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Clock, Calendar, Radio as RadioIcon, Play, Pause } from 'lucide-react';
import Header from '@/components/Header.jsx';
import Footer from '@/components/Footer.jsx';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabaseClient.js';
import { radioShows as staticShows } from '@/data/data.js';
import { useAudio } from '@/contexts/AudioContext.jsx';

const EcouterPage = () => {
  const show = staticShows[0];
  const [episodes, setEpisodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const { playTrack, currentTrack, isPlaying, togglePlay } = useAudio();

  const radioCover = "https://horizons-cdn.hostinger.com/8cb4c9c6-9962-4ccc-80b1-ea71b7a63684/866a587d484c1eedb4c3fd12c56b7757.png";

  useEffect(() => {
    const fetchEpisodes = async () => {
      try {
        const { data, error } = await supabase
          .from('radio_episodes')
          .select('*')
          .order('date', { ascending: false });

        if (error) throw error;
        setEpisodes(data || []);
      } catch (err) {
        console.error("Error fetching radio episodes:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchEpisodes();
  }, []);

  const latestEpisode = episodes.length > 0 ? episodes[0] : null;

  const handlePlayEpisode = (ep) => {
    const trackData = {
      id: ep.id || 'radio-static',
      title: ep.title,
      artist: 'KLTUR RAP Radio',
      url: ep.audio_url || ep.audioUrl,
      cover: radioCover
    };

    const playlist = episodes.map(e => ({
      id: e.id,
      title: e.title,
      artist: 'KLTUR RAP Radio',
      url: e.audio_url,
      cover: radioCover
    }));

    playTrack(trackData, playlist);
  };

  return (
    <>
      <Helmet>
        <title>Écouter - KLTUR RAP Radio</title>
        <meta name="description" content="Écoutez KLTUR RAP - Voix Urbaines, l'émission de référence pour la culture hip-hop centrafricaine. Diffusion tous les samedis 16h-17h." />
      </Helmet>

      <div className="min-h-screen bg-black text-white">
        <Header />

        <section className="py-20 bg-gradient-to-b from-black to-[#111111]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center mb-12"
            >
              <h1 className="text-5xl md:text-6xl font-bold mb-4 leading-tight" style={{ letterSpacing: '-0.02em', textBalance: 'balance' }}>
                <span className="text-[#D4AF37]">KLTUR RAP</span> Radio
              </h1>
              <p className="text-xl text-white/70 max-w-3xl mx-auto leading-relaxed">
                Votre rendez-vous hebdomadaire avec la culture hip-hop centrafricaine
              </p>
            </motion.div>

            {/* Featured Player Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="max-w-4xl mx-auto mb-16"
            >
              {loading ? (
                <Skeleton className="h-64 w-full rounded-3xl bg-[#111]" />
              ) : (
                <div className="bg-[#0a0a0a] rounded-3xl border border-[#D4AF37]/30 p-8 flex flex-col md:flex-row items-center gap-8 shadow-2xl relative overflow-hidden group">
                  <div className="absolute inset-0 bg-gradient-to-r from-[#D4AF37]/5 to-transparent opacity-50" />

                  <div className="relative z-10 w-48 h-48 md:w-56 md:h-56 shrink-0 rounded-2xl overflow-hidden border border-[#222] shadow-2xl">
                    <img src={radioCover} alt="Radio" className="w-full h-full object-contain p-4 bg-[#111]" />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                       <RadioIcon className="w-12 h-12 text-[#D4AF37] animate-pulse" />
                    </div>
                  </div>

                  <div className="relative z-10 flex-grow text-center md:text-left">
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#D4AF37]/10 text-[#D4AF37] text-[10px] font-black uppercase tracking-widest rounded-full mb-4 border border-[#D4AF37]/20">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#D4AF37] opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-[#D4AF37]"></span>
                      </span>
                      Dernière Émission
                    </div>

                    <h2 className="text-3xl md:text-4xl font-black text-white mb-2 uppercase tracking-tight">
                      {latestEpisode?.title || show.title}
                    </h2>
                    <p className="text-white/60 font-bold mb-8 uppercase text-xs tracking-widest">
                      {latestEpisode ? `Diffusé le ${new Date(latestEpisode.date).toLocaleDateString('fr-FR')}` : show.schedule}
                    </p>

                    <Button
                      onClick={() => {
                        if (latestEpisode) handlePlayEpisode(latestEpisode);
                        else handlePlayEpisode({ title: show.title, audio_url: show.audioUrl });
                      }}
                      className="h-16 px-10 bg-[#D4AF37] text-black hover:bg-[#b5952f] font-black text-lg uppercase tracking-wider rounded-2xl gold-glow transition-all active:scale-95"
                    >
                      {currentTrack?.id === (latestEpisode?.id || 'radio-static') && isPlaying ? (
                        <><Pause className="w-6 h-6 mr-2 fill-current" /> Suspendre</>
                      ) : (
                        <><Play className="w-6 h-6 mr-2 fill-current" /> Écouter le Direct</>
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="bg-[#0a0a0a] rounded-3xl p-8 border border-[#222] mb-16"
            >
              <h2 className="text-3xl font-black mb-6 text-[#D4AF37] uppercase tracking-tighter">{show.title}</h2>
              
              <div className="flex flex-wrap gap-6 mb-8">
                <div className="flex items-center gap-2 text-white/80 bg-[#111] px-4 py-2 rounded-xl border border-[#222]">
                  <Clock className="h-5 w-5 text-[#D4AF37]" />
                  <span className="font-bold text-sm uppercase">{show.duration}</span>
                </div>
                <div className="flex items-center gap-2 text-white/80 bg-[#111] px-4 py-2 rounded-xl border border-[#222]">
                  <Calendar className="h-5 w-5 text-[#D4AF37]" />
                  <span className="font-bold text-sm uppercase">{show.schedule}</span>
                </div>
              </div>

              <p className="text-white/60 text-lg leading-relaxed mb-10 font-medium">
                {show.description}
              </p>

              <h3 className="text-xl font-black mb-6 uppercase tracking-widest flex items-center gap-2">
                <div className="w-8 h-1 bg-[#D4AF37] rounded-full" /> Les segments
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {show.segments.map((segment, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4, delay: 0.4 + index * 0.1 }}
                    className="bg-[#111] rounded-2xl p-5 border border-[#222] hover:border-[#D4AF37]/30 transition-colors"
                  >
                    <h4 className="text-sm font-black text-[#D4AF37] mb-2 uppercase tracking-wider">{segment.name}</h4>
                    <p className="text-sm text-white/50 leading-relaxed font-medium">{segment.description}</p>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
            >
              <h2 className="text-3xl font-black mb-8 flex items-center gap-3 uppercase tracking-tighter">
                <RadioIcon className="text-[#D4AF37] w-8 h-8" /> Archives Radio
              </h2>

              {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-40 rounded-3xl bg-[#0a0a0a]" />)}
                </div>
              ) : episodes.length === 0 ? (
                <div className="text-center py-20 bg-[#0a0a0a] rounded-3xl border border-[#222] text-white/20 font-bold uppercase tracking-widest">
                  Aucun épisode disponible pour le moment.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {episodes.map((episode, index) => (
                    <motion.div
                      key={episode.id}
                      onClick={() => handlePlayEpisode(episode)}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: 0.6 + index * 0.1 }}
                      className={`bg-[#0a0a0a] rounded-3xl p-6 border transition-all duration-300 group cursor-pointer flex flex-col justify-between ${
                        currentTrack?.id === episode.id ? 'border-[#D4AF37] shadow-[0_0_20px_rgba(212,175,55,0.1)]' : 'border-[#222] hover:border-[#D4AF37]/50'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-white/40">
                            <Calendar className="h-3 w-3" />
                            <span>{new Date(episode.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                            <span className="mx-1">•</span>
                            <Clock className="h-3 w-3" />
                            <span>{episode.duration}</span>
                          </div>
                          {currentTrack?.id === episode.id && isPlaying && (
                             <div className="flex gap-0.5 items-end h-3">
                               <div className="w-0.5 h-full bg-[#D4AF37] animate-music-bar-1" />
                               <div className="w-0.5 h-2/3 bg-[#D4AF37] animate-music-bar-2" />
                               <div className="w-0.5 h-full bg-[#D4AF37] animate-music-bar-3" />
                             </div>
                          )}
                        </div>
                        <h3 className={`text-xl font-black mb-3 uppercase tracking-tight transition-colors ${currentTrack?.id === episode.id ? 'text-[#D4AF37]' : 'text-white group-hover:text-[#D4AF37]'}`}>
                          {episode.title}
                        </h3>
                        <p className="text-sm text-white/40 leading-relaxed line-clamp-2 font-medium mb-4">{episode.description}</p>
                      </div>

                      <div className="flex items-center justify-between pt-4 border-t border-[#222]">
                        <span className="text-[10px] font-black uppercase text-[#D4AF37] tracking-widest">
                          {currentTrack?.id === episode.id && isPlaying ? "En cours d'écoute" : "Écouter l'archive"}
                        </span>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${currentTrack?.id === episode.id ? 'bg-[#D4AF37] text-black' : 'bg-[#111] text-white group-hover:bg-[#D4AF37] group-hover:text-black'}`}>
                          {currentTrack?.id === episode.id && isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          </div>
        </section>

        <Footer />
      </div>
    </>
  );
};

export default EcouterPage;
