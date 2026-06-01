import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Clock, Calendar, Radio as RadioIcon } from 'lucide-react';
import Header from '@/components/Header.jsx';
import Footer from '@/components/Footer.jsx';
import RadioPlayer from '@/components/RadioPlayer.jsx';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/lib/supabaseClient.js';
import { radioShows as staticShows } from '@/data/data.js';

const EcouterPage = () => {
  const show = staticShows[0];
  const [episodes, setEpisodes] = useState([]);
  const [loading, setLoading] = useState(true);

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

  // Use the latest episode for the player if available, otherwise fallback to static info
  const [selectedEpisode, setSelectedEpisode] = useState(null);

  const currentEpisode = selectedEpisode || (episodes.length > 0 ? episodes[0] : null);

  const playerInfo = currentEpisode ? {
    title: currentEpisode.title,
    schedule: `Diffusé le ${new Date(currentEpisode.date).toLocaleDateString('fr-FR')}`,
    duration: currentEpisode.duration,
    audio_url: currentEpisode.audio_url
  } : {
    title: show.title,
    schedule: show.schedule,
    duration: show.duration,
    audio_url: show.audioUrl
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

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="max-w-3xl mx-auto mb-12"
            >
              {loading ? (
                <Skeleton className="h-48 w-full rounded-2xl bg-[#111]" />
              ) : (
                <RadioPlayer show={playerInfo} />
              )}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="bg-[#111111] rounded-2xl p-8 border border-[#333333] mb-12"
            >
              <h2 className="text-3xl font-bold mb-6 text-[#D4AF37]">{show.title}</h2>
              
              <div className="flex flex-wrap gap-6 mb-6">
                <div className="flex items-center gap-2 text-white/80">
                  <Clock className="h-5 w-5 text-[#D4AF37]" />
                  <span>{show.duration}</span>
                </div>
                <div className="flex items-center gap-2 text-white/80">
                  <Calendar className="h-5 w-5 text-[#D4AF37]" />
                  <span>{show.schedule}</span>
                </div>
              </div>

              <p className="text-white/70 leading-relaxed mb-8">
                {show.description}
              </p>

              <h3 className="text-2xl font-bold mb-4">Les segments de l'émission</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {show.segments.map((segment, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4, delay: 0.4 + index * 0.1 }}
                    className="bg-black rounded-xl p-4 border border-[#333333]"
                  >
                    <h4 className="text-lg font-bold text-[#D4AF37] mb-2">{segment.name}</h4>
                    <p className="text-sm text-white/70 leading-relaxed">{segment.description}</p>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
            >
              <h2 className="text-3xl font-bold mb-6 flex items-center gap-2">
                <RadioIcon className="text-[#D4AF37]" /> Épisodes récents
              </h2>

              {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-40 rounded-2xl bg-[#111]" />)}
                </div>
              ) : episodes.length === 0 ? (
                <div className="text-center py-12 bg-[#111] rounded-2xl border border-[#333] text-white/40">
                  Aucun épisode disponible pour le moment.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {episodes.map((episode, index) => (
                    <motion.div
                      key={episode.id}
                      onClick={() => {
                        setSelectedEpisode(episode);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: 0.6 + index * 0.1 }}
                      className="bg-[#111111] rounded-2xl p-6 border border-[#333333] hover:border-[#D4AF37] transition-all duration-300 group cursor-pointer"
                    >
                      <div className="flex items-center gap-2 text-xs text-white/50 mb-3">
                        <Calendar className="h-3 w-3" />
                        <span>{new Date(episode.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                        <span className="mx-2">•</span>
                        <Clock className="h-3 w-3" />
                        <span>{episode.duration}</span>
                      </div>
                      <h3 className="text-xl font-bold mb-2 group-hover:text-[#D4AF37] transition-colors">{episode.title}</h3>
                      <p className="text-sm text-white/70 leading-relaxed line-clamp-2">{episode.description}</p>
                      {episode.audio_url && (
                        <div className="mt-4 pt-4 border-t border-[#222]">
                           <span className="text-[10px] font-black uppercase text-[#D4AF37] tracking-widest">Audio Disponible</span>
                        </div>
                      )}
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
