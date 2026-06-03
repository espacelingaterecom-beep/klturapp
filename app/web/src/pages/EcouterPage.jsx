import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Clock, Calendar, Radio as RadioIcon, Play, ExternalLink } from 'lucide-react';
import Header from '@/components/Header.jsx';
import Footer from '@/components/Footer.jsx';
import RadioPlayer from '@/components/RadioPlayer.jsx';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase, getPublicImageUrl } from '@/lib/supabaseClient.js';
import { radioShows } from '@/data/data.js';

import { useAudio } from '@/contexts/AudioContext.jsx';

const EcouterPage = () => {
  const { playTrack } = useAudio();
  const [episodes, setEpisodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const show = radioShows[0];

  useEffect(() => {
    const fetchEpisodes = async () => {
      try {
        const { data, error } = await supabase
          .from('radio_episodes')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;
        setEpisodes(data || []);
      } catch (err) {
        console.error("Error fetching episodes:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchEpisodes();
  }, []);

  const handlePlayEpisode = (ep) => {
    if (ep.is_external && ep.external_url) {
      window.open(ep.external_url, '_blank');
    } else if (ep.audio_url) {
      playTrack({
        id: ep.id,
        title: ep.title,
        artist: 'KLTUR RAP Radio',
        url: getPublicImageUrl('uploads', ep.audio_url),
        cover: 'https://horizons-cdn.hostinger.com/8cb4c9c6-9962-4ccc-80b1-ea71b7a63684/866a587d484c1eedb4c3fd12c56b7757.png'
      });
      toast.success(`Lecture de : ${ep.title}`);
    } else {
      toast.error("Aucune source audio pour cet épisode.");
    }
  };

  return (
    <>
      <Helmet>
        <title>Écouter - KLTUR RAP Radio</title>
        <meta name="description" content="Écoutez KLTUR RAP - Voix Urbaines, l'émission de référence pour la culture hip-hop centrafricaine." />
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
              <RadioPlayer show={show} />
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
              <div className="space-y-4">
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
              <h2 className="text-3xl font-bold mb-6 flex items-center gap-3">
                 Épisodes récents <span className="bg-[#D4AF37] text-black text-xs px-2 py-1 rounded-full">{episodes.length}</span>
              </h2>

              {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {[1,2,3,4].map(i => <Skeleton key={i} className="h-40 w-full bg-[#111] rounded-2xl" />)}
                </div>
              ) : episodes.length === 0 ? (
                <div className="text-center py-20 bg-[#111] rounded-2xl border border-[#333] text-white/20">
                   <RadioIcon className="w-12 h-12 mx-auto mb-4 opacity-10" />
                   <p className="font-bold uppercase tracking-widest text-xs">Aucun épisode disponible pour le moment</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {episodes.map((episode, index) => (
                    <motion.div
                      key={episode.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: 0.6 + index * 0.1 }}
                      className="bg-[#111111] rounded-2xl p-6 border border-[#333333] hover:border-[#D4AF37] transition-all duration-300 group cursor-pointer"
                      onClick={() => handlePlayEpisode(episode)}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2 text-xs text-white/50">
                          <Calendar className="h-3 w-3" />
                          <span>{new Date(episode.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                        </div>
                        {episode.is_external ? <ExternalLink className="w-3 h-3 text-white/30" /> : <Play className="w-3 h-3 text-[#D4AF37]" />}
                      </div>
                      <h3 className="text-xl font-bold mb-2 group-hover:text-[#D4AF37] transition-colors">{episode.title}</h3>
                      <p className="text-sm text-white/70 leading-relaxed line-clamp-2">{episode.description}</p>

                      <div className="mt-4 pt-4 border-t border-white/5 flex justify-end">
                         <span className="text-[10px] font-black uppercase text-[#D4AF37] tracking-widest">
                            {episode.is_external ? 'Lien Externe' : 'Lecture Audio'}
                         </span>
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