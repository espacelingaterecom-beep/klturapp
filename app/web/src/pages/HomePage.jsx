import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Radio, Calendar, Users, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Header from '@/components/Header.jsx';
import Footer from '@/components/Footer.jsx';
import NewsCard from '@/components/NewsCard.jsx';
import { supabase } from '@/lib/supabaseClient.js';

const HomePage = () => {
  const [news, setNews] = useState([]);

  useEffect(() => {
    const fetchNews = async () => {
      try {
        const { data, error } = await supabase
          .from('news')
          .select('*, profiles:author_id(*)')
          .lte('published_at', new Date().toISOString()) // Uniquement les news déjà publiées
          .order('published_at', { ascending: false })
          .limit(6);

        if (error) throw error;

        // Mapping pour garder la compatibilité avec NewsCard (expand.authorId)
        const mappedNews = data.map(item => ({
          ...item,
          expand: {
            authorId: item.profiles
          }
        }));

        setNews(mappedNews);
      } catch (err) {
        console.error(err);
      }
    };
    fetchNews();
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