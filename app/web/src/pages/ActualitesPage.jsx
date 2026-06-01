import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';
import { Search, Newspaper, Youtube } from 'lucide-react';
import Header from '@/components/Header.jsx';
import Footer from '@/components/Footer.jsx';
import NewsCard from '@/components/NewsCard.jsx';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/lib/supabaseClient.js';

const ActualitesPage = () => {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

  const keywords = ["rap centro", "centro rap", "drill centro", "hip-hop centro", "rap rca"];

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
      <Helmet>
        <title>Actualités - KLTUR RAP</title>
        <meta name="keywords" content={keywords.join(', ')} />
      </Helmet>
      <Header />

      <main className="flex-grow py-12 px-4 max-w-7xl mx-auto w-full">
        {/* YouTube Highlight Banner */}
        <div className="mb-12 bg-red-600/10 border border-red-600/20 rounded-3xl p-8 flex flex-col md:flex-row items-center justify-between gap-6 overflow-hidden relative group">
          <div className="absolute -right-10 -bottom-10 opacity-10 group-hover:scale-110 transition-transform duration-700">
            <Youtube className="w-64 h-64" />
          </div>
          <div className="relative z-10 text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-2 text-red-500 mb-2 font-black uppercase text-xs tracking-widest">
              <Youtube className="w-5 h-5" /> Chaîne Officielle
            </div>
            <h2 className="text-3xl font-black uppercase mb-2">Suivez <span className="text-[#D4AF37]">KLTUR RAP</span> sur YouTube</h2>
            <p className="text-white/60 font-medium">Découvrez nos clips exclusifs, interviews et reportages sur le mouvement RCA.</p>
          </div>
          <Button asChild className="bg-red-600 hover:bg-red-700 text-white font-black uppercase px-8 h-14 rounded-2xl relative z-10 shadow-lg">
            <a href="https://www.youtube.com/@KLTURRAP" target="_blank" rel="noopener noreferrer">
              S'abonner maintenant
            </a>
          </Button>
        </div>

        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-6xl font-black uppercase mb-4">
            Actualités <span className="text-[#D4AF37]">hip-hop</span>
          </h1>
          <p className="text-white/60 mb-6 uppercase text-[10px] font-bold tracking-[0.3em]">
            {keywords.map(kw => `#${kw.replace(' ', '')}`).join(' ')}
          </p>
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
