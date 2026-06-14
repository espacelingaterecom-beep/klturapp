import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Radio, Calendar, Users, ArrowRight, Play, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Header from '@/components/Header.jsx';
import Footer from '@/components/Footer.jsx';
import NewsCard from '@/components/NewsCard.jsx';
import { supabase } from '@/lib/supabaseClient.js';

const HomePage = () => {
  const [news, setNews] = useState([]);
  const [activeLives, setActiveLives] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch News
        const { data: newsData, error: newsError } = await supabase
          .from('news')
          .select('*, profiles:author_id(*)')
          .lte('published_at', new Date().toISOString())
          .order('published_at', { ascending: false })
          .limit(6);

        if (newsError) throw newsError;

        const mappedNews = newsData.map(item => ({
          ...item,
          expand: { authorId: item.profiles }
        }));
        setNews(mappedNews);

        // Fetch Active Lives Count
        const { count, error: liveError } = await supabase
          .from('live_streams')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'live');

        if (!liveError) setActiveLives(count || 0);

      } catch (err) {
        console.error(err);
      }
    };
    fetchData();
  }, []);

  return (
    <>
      <Helmet>
        <title>KLTUR RAP - Que pour la culture hip-hop centrafricaine</title>
      </Helmet>

      <div className="min-h-screen bg-black text-white">
        <Header />

        <section className="relative min-h-[100dvh] flex items-center justify-center overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-black via-black/95 to-black z-0" />
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#D4AF37] rounded-full blur-[120px]" />
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#D4AF37] rounded-full blur-[120px]" />
          </div>

          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8 }} className="mb-8">
              <img src="https://horizons-cdn.hostinger.com/8cb4c9c6-9962-4ccc-80b1-ea71b7a63684/866a587d484c1eedb4c3fd12c56b7757.png" alt="KLTUR RAP Logo" className="w-64 h-auto mx-auto mb-8 glow-gold" />
            </motion.div>

            <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.2 }} className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight" style={{ letterSpacing: '-0.02em', textBalance: 'balance' }}>
              QUE POUR LA CULTURE <span className="text-[#D4AF37]">HIP-HOP</span>
            </motion.h1>

            <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.4 }} className="text-xl md:text-2xl text-white/80 mb-12 max-w-3xl mx-auto leading-relaxed">
              Votre plateforme de référence pour la scène hip-hop centrafricaine. Radio, événements, artistes et actualités de Bangui.
            </motion.p>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.6 }} className="flex flex-wrap items-center justify-center gap-4">
              <Link to="/musique">
                <Button className="bg-[#D4AF37] text-black hover:bg-[#b5952f] transition-all duration-300 text-lg px-8 py-6 font-bold glow-gold-hover">Découvrir la musique</Button>
              </Link>
              <Link to="/ecouter">
                <Button variant="outline" className="border-[#D4AF37] text-[#D4AF37] hover:bg-[#D4AF37] hover:text-black transition-all duration-300 text-lg px-8 py-6 font-bold">Écouter la radio</Button>
              </Link>
            </motion.div>
          </div>
        </section>

        {/* News Section */}
        <section className="py-24 bg-[#0a0a0a] border-t border-[#222]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-end justify-between mb-12">
              <div>
                <h2 className="text-4xl font-bold mb-2">Actualités <span className="text-[#D4AF37]">KLTUR RAP</span></h2>
                <p className="text-white/60 text-lg">Découvrez les dernières nouvelles, sorties et événements.</p>
              </div>
              <Link to="/actualites" className="flex items-center text-[#D4AF37] font-bold hover:underline">
                Voir tout <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {news.map(item => <NewsCard key={item.id} news={item} />)}
            </div>

            <div className="mt-8 text-center md:hidden">
               <Link to="/actualites">
                 <Button variant="outline" className="border-[#D4AF37] text-[#D4AF37] w-full h-12 font-bold uppercase text-xs">
                   Voir plus d'actualités
                 </Button>
               </Link>
            </div>
          </div>
        </section>

        {/* Shorts Teaser Section */}
        <section className="py-24 bg-black overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row items-center justify-between gap-12">
              <motion.div
                initial={{ opacity: 0, x: -50 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8 }}
                viewport={{ once: true }}
                className="max-w-xl text-center md:text-left"
              >
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#D4AF37]/10 text-[#D4AF37] text-[10px] font-black uppercase tracking-widest rounded-full mb-6 border border-[#D4AF37]/20">
                  <Zap className="w-3 h-3 fill-current" /> Nouveau
                </div>
                <h2 className="text-4xl md:text-5xl font-black text-white uppercase mb-6 leading-tight">
                  KLTUR <span className="text-[#D4AF37]">Shorts</span>
                </h2>
                <p className="text-xl text-white/60 mb-8 leading-relaxed">
                  Découvrez les talents du mouvement centrafricain en format court. Freestyles, coulisses et exclusivités en 30 secondes.
                </p>
                <Link to="/shorts">
                  <Button className="bg-[#D4AF37] text-black hover:bg-[#b5952f] transition-all h-14 px-10 font-black uppercase tracking-wider rounded-full">
                    Regarder les Shorts
                  </Button>
                </Link>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8 }}
                viewport={{ once: true }}
                className="relative group"
              >
                <div className="absolute inset-0 bg-[#D4AF37] rounded-3xl blur-[80px] opacity-20 group-hover:opacity-30 transition-opacity" />
                <div className="relative w-64 md:w-72 aspect-[9/16] bg-[#0a0a0a] rounded-[2.5rem] border-8 border-[#1a1a1a] shadow-2xl overflow-hidden">
                   <div className="absolute inset-0 flex items-center justify-center">
                      <Play className="w-16 h-16 text-[#D4AF37]/20 animate-pulse" />
                   </div>
                   <div className="absolute bottom-6 left-6 right-6 space-y-2">
                      <div className="h-2 w-2/3 bg-white/10 rounded-full" />
                      <div className="h-2 w-1/2 bg-white/10 rounded-full" />
                   </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Live Streaming Section */}
        <section className="py-24 bg-[#0a0a0a] border-y border-[#222] relative overflow-hidden">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-red-600/5 rounded-full blur-[120px] -mr-64 -mt-64" />

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="flex flex-col lg:flex-row items-center gap-16">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8 }}
                viewport={{ once: true }}
                className="w-full lg:w-1/2"
              >
                <div className="relative aspect-video bg-black rounded-[2.5rem] border border-white/5 shadow-2xl overflow-hidden group">
                   <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1516280440502-37f8ce82245c?auto=format&fit=crop&q=80')] bg-cover bg-center opacity-40 group-hover:scale-110 transition-transform duration-[2s]" />
                   <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />

                   <div className="absolute top-6 left-6 flex gap-2">
                      <span className="bg-red-600 text-white px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-lg animate-pulse">
                         <Radio className="w-3 h-3" /> En Direct
                      </span>
                      {activeLives > 0 && (
                        <span className="bg-black/60 backdrop-blur-md text-white px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border border-white/10">
                           {activeLives} {activeLives > 1 ? 'Lives' : 'Live'} Actif
                        </span>
                      )}
                   </div>

                   <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-20 h-20 bg-red-600 rounded-full flex items-center justify-center text-white shadow-[0_0_50px_rgba(239,68,68,0.3)] group-hover:scale-110 transition-transform">
                         <Play className="w-10 h-10 fill-current ml-1" />
                      </div>
                   </div>

                   <div className="absolute bottom-8 left-8 right-8">
                      <div className="flex items-center gap-4">
                         <div className="h-12 w-12 rounded-full border-2 border-red-500 p-0.5 bg-black">
                            <img src="/icon-only.PNG" className="w-full h-full object-contain rounded-full" alt="KLTUR" />
                         </div>
                         <div>
                            <p className="text-white font-black uppercase text-sm">Session Freestyle #12</p>
                            <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest">Rejoignez le mouvement maintenant</p>
                         </div>
                      </div>
                   </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8 }}
                viewport={{ once: true }}
                className="w-full lg:w-1/2 text-center lg:text-left"
              >
                <h2 className="text-4xl md:text-5xl font-black text-white uppercase mb-6 leading-tight">
                  Vivez le mouvement <span className="text-red-600">En Direct</span>
                </h2>
                <p className="text-xl text-white/60 mb-10 leading-relaxed font-medium">
                  Ne manquez plus aucun événement. Suivez les concerts, les battles et les sessions studio en temps réel avec KLTUR LIVE.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                  <Link to="/live" className="w-full sm:w-auto">
                    <Button className="w-full h-16 px-10 bg-red-600 hover:bg-red-700 text-white font-black uppercase tracking-wider rounded-2xl shadow-xl shadow-red-600/20">
                      Entrer dans le Live
                    </Button>
                  </Link>
                  <div className="flex -space-x-3">
                     {[1,2,3,4].map(i => (
                        <div key={i} className="h-10 w-10 rounded-full border-2 border-[#0a0a0a] bg-[#111] flex items-center justify-center overflow-hidden">
                           <img src={`https://i.pravatar.cc/100?img=${i+10}`} alt="viewer" className="w-full h-full object-cover opacity-60" />
                        </div>
                     ))}
                     <div className="h-10 w-10 rounded-full border-2 border-[#0a0a0a] bg-[#111] flex items-center justify-center text-[10px] font-black text-white/40">
                        +50
                     </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        <section className="py-24 bg-[#111111]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} viewport={{ once: true }} className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold mb-4 leading-tight" style={{ letterSpacing: '-0.02em', textBalance: 'balance' }}>
                Pourquoi <span className="text-[#D4AF37]">KLTUR RAP</span> ?
              </h2>
              <p className="text-lg text-white/70 max-w-2xl mx-auto leading-relaxed">
                La première plateforme dédiée à la promotion de la culture hip-hop en République Centrafricaine
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-black p-8 rounded-2xl border border-[#222] text-center hover:border-[#D4AF37] transition-colors">
                <Radio className="w-12 h-12 text-[#D4AF37] mx-auto mb-4" />
                <h3 className="text-xl font-bold mb-2">Radio hip-hop</h3>
                <p className="text-white/60">Émission hebdomadaire avec interviews et nouveautés.</p>
              </div>
              <div className="bg-black p-8 rounded-2xl border border-[#222] text-center hover:border-[#D4AF37] transition-colors">
                <Calendar className="w-12 h-12 text-[#D4AF37] mx-auto mb-4" />
                <h3 className="text-xl font-bold mb-2">Événements</h3>
                <p className="text-white/60">Concerts, battles, ateliers pour célébrer la culture.</p>
              </div>
              <div className="bg-black p-8 rounded-2xl border border-[#222] text-center hover:border-[#D4AF37] transition-colors">
                <Users className="w-12 h-12 text-[#D4AF37] mx-auto mb-4" />
                <h3 className="text-xl font-bold mb-2">Artistes locaux</h3>
                <p className="text-white/60">Plateforme de visibilité pour les talents de Bangui.</p>
              </div>
            </div>
          </div>
        </section>

        <Footer />
      </div>
    </>
  );
};

export default HomePage;