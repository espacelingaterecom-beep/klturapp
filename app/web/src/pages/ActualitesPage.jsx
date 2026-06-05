import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';
import { Search, Newspaper, Youtube, ArrowUpRight, Facebook } from 'lucide-react';
import Header from '@/components/Header.jsx';
import Footer from '@/components/Footer.jsx';
import NewsCard from '@/components/NewsCard.jsx';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/supabaseClient.js';
import { OfflineManager } from '@/lib/offlineManager.js';
import { Capacitor } from '@capacitor/core';

const ActualitesPage = () => {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchNews = async () => {
      setLoading(true);

      // Charger le cache en premier
      if (Capacitor.isNativePlatform() && !search && filter === 'all') {
        const cached = await OfflineManager.getFromCache('news');
        if (cached) setNews(cached);
      }

      try {
        let query = supabase
          .from('news')
          .select('*')
          // Afficher si publié ou si la date est nulle (ancienne news)
          .or(`published_at.lte.${new Date().toISOString()},published_at.is.null`);

        if (filter !== 'all') {
          query = query.eq('category', filter);
        }

        if (search) {
          query = query.or(`title.ilike.%${search}%,content.ilike.%${search}%`);
        }

        // Tri par date de publication
        const { data, error } = await query.order('published_at', { ascending: false });

        if (error) {
          // Si le tri échoue, on récupère les données sans tri
          const { data: fallbackData } = await supabase
            .from('news')
            .select('*')
            .lte('published_at', new Date().toISOString());
          setNews(fallbackData || []);
        } else {
          setNews(data || []);
          // Sauvegarder dans le cache
          if (Capacitor.isNativePlatform() && !search && filter === 'all') {
            await OfflineManager.saveToCache('news', data);
          }
        }
      } catch (err) {
        console.error("Critical News Page Error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchNews();
  }, [filter, search]);

  const categories = [
    { id: 'all', name: 'Tous' },
    { id: 'News', name: 'News' },
    { id: 'Interview', name: 'Interviews' },
    { id: 'Sortie', name: 'Sorties' },
    { id: 'Event', name: 'Événements' },
    { id: 'Ateliers', name: 'Ateliers' },
    { id: 'Chroniques', name: 'Chroniques' }
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#050505] text-white">
      <Helmet><title>Actualités - KLTUR RAP</title></Helmet>
      <Header />

      <main className="flex-grow py-12 px-4 max-w-7xl mx-auto w-full">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-6xl font-black uppercase mb-4">
            Actualités <span className="text-[#D4AF37]">hip-hop</span>
          </h1>
          <p className="text-white/60">Toute l'actualité de la culture urbaine centrafricaine</p>
        </div>

        <div className="max-w-4xl mx-auto mb-12 space-y-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-white/30" />
            <Input
              value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher..."
              className="pl-12 bg-[#0a0a0a] border-[#222] text-white h-12 rounded-xl focus:border-[#D4AF37]"
            />
          </div>

          <div className="flex flex-wrap justify-center gap-2">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setFilter(cat.id)}
                className={`px-5 py-2 rounded-full text-xs font-bold uppercase transition-all ${
                  filter === cat.id ? 'bg-[#D4AF37] text-black' : 'bg-[#111] text-white/40 hover:text-white'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        {/* YouTube Banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-7xl mx-auto mb-16"
        >
          <a
            href="https://www.youtube.com/@KLTURRAP"
            target="_blank"
            rel="noopener noreferrer"
            className="group block relative overflow-hidden rounded-3xl bg-gradient-to-r from-red-600 to-black p-8 md:p-12 border border-white/10"
          >
            <div className="absolute top-0 right-0 -mt-12 -mr-12 w-64 h-64 bg-white/5 rounded-full blur-3xl group-hover:bg-white/10 transition-colors" />

            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="text-center md:text-left">
                <div className="flex items-center justify-center md:justify-start gap-3 mb-4">
                  <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-red-600 shadow-lg">
                    <Youtube className="w-6 h-6 fill-current" />
                  </div>
                  <span className="text-white font-black uppercase tracking-[0.3em] text-xs">Exclusivité KLTUR RAP</span>
                </div>
                <h2 className="text-3xl md:text-5xl font-black text-white uppercase tracking-tighter mb-4 leading-none">
                  Suivez-nous sur <br className="hidden md:block" /><span className="text-white/80">YouTube</span>
                </h2>
                <p className="text-white/60 font-medium max-w-md">
                  Découvrez nos interviews exclusives, les replays de la radio et les meilleurs clips de la scène urbaine centrafricaine.
                </p>
              </div>

              <Button className="bg-white text-black hover:bg-white/90 font-black uppercase px-8 h-14 rounded-2xl group-hover:scale-105 transition-transform">
                S'abonner maintenant <ArrowUpRight className="ml-2 w-5 h-5" />
              </Button>
            </div>
          </a>
        </motion.div>

        {/* Facebook Banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="max-w-7xl mx-auto mb-16"
        >
          <a
            href="https://www.facebook.com/profile.php?id=61556600949652"
            target="_blank"
            rel="noopener noreferrer"
            className="group block relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#1877F2] to-[#0a0a0a] p-8 md:p-12 border border-white/10"
          >
            <div className="absolute top-0 right-0 -mt-12 -mr-12 w-64 h-64 bg-white/5 rounded-full blur-3xl group-hover:bg-white/10 transition-colors" />

            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="text-center md:text-left">
                <div className="flex items-center justify-center md:justify-start gap-3 mb-4">
                  <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-[#1877F2] shadow-lg">
                    <Facebook className="w-6 h-6 fill-current" />
                  </div>
                  <span className="text-white font-black uppercase tracking-[0.3em] text-xs">Communauté KLTUR RAP</span>
                </div>
                <h2 className="text-3xl md:text-5xl font-black text-white uppercase tracking-tighter mb-4 leading-none">
                  Rejoignez-nous sur <br className="hidden md:block" /><span className="text-white/80">Facebook</span>
                </h2>
                <p className="text-white/60 font-medium max-w-md">
                  Suivez le live, participez aux débats et ne manquez aucune annonce de notre communauté grandissante.
                </p>
              </div>

              <Button className="bg-white text-[#1877F2] hover:bg-white/90 font-black uppercase px-8 h-14 rounded-2xl group-hover:scale-105 transition-transform border-none">
                Nous rejoindre <ArrowUpRight className="ml-2 w-5 h-5" />
              </Button>
            </div>
          </a>
        </motion.div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1,2,3].map(i => <Skeleton key={i} className="h-80 rounded-2xl bg-[#0a0a0a]" />)}
          </div>
        ) : news.length === 0 ? (
          <div className="text-center py-20 bg-[#0a0a0a] rounded-3xl border border-[#222]">
            <Newspaper className="w-12 h-12 text-white/10 mx-auto mb-4" />
            <p className="text-white/40 font-bold uppercase">Aucun article trouvé</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {news.map((item) => (
              <NewsCard key={item.id} news={{
                ...item,
                expand: { authorId: { name: 'Rédaction KLTUR RAP' } }
              }} />
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default ActualitesPage;
