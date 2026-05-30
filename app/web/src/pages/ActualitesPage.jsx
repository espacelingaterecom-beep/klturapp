import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';
import { Search, Newspaper } from 'lucide-react';
import Header from '@/components/Header.jsx';
import Footer from '@/components/Footer.jsx';
import NewsCard from '@/components/NewsCard.jsx';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/lib/supabaseClient.js';

const ActualitesPage = () => {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchNews = async () => {
      setLoading(true);
      try {
        let query = supabase.from('news').select('*');

        if (filter !== 'all') {
          query = query.eq('category', filter);
        }

        if (search) {
          query = query.or(`title.ilike.%${search}%,content.ilike.%${search}%`);
        }

        // Tri par date de création
        const { data, error } = await query.order('created_at', { ascending: false });

        if (error) {
          // Si le tri échoue, on récupère les données sans tri
          const { data: fallbackData } = await supabase.from('news').select('*');
          setNews(fallbackData || []);
        } else {
          setNews(data || []);
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
    { id: 'Interviews', name: 'Interviews' },
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
