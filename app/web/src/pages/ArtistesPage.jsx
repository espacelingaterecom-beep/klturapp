import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Search } from 'lucide-react';
import Header from '@/components/Header.jsx';
import Footer from '@/components/Footer.jsx';
import ArtistCard from '@/components/ArtistCard.jsx';
import { supabase } from '@/lib/supabaseClient.js';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';

const ArtistesPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [artists, setArtists] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchArtists = async () => {
      setLoading(true);
      try {
        let query = supabase
          .from('profiles')
          .select('*')
          .order('is_premium', { ascending: false });

        if (searchQuery) {
          query = query.or(`name.ilike.%${searchQuery}%,bio.ilike.%${searchQuery}%,username.ilike.%${searchQuery}%`);
        }

        const { data, error } = await query;
        if (error) throw error;
        setArtists(data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(() => {
      fetchArtists();
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const filteredArtists = artists;

  return (
    <>
      <Helmet>
        <title>Artistes - KLTUR RAP</title>
        <meta name="description" content="Découvrez les artistes hip-hop centrafricains : rappeurs, beatmakers, danseurs. La scène urbaine de Bangui en un seul endroit." />
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
                Artistes <span className="text-[#D4AF37]">centrafricains</span>
              </h1>
              <p className="text-xl text-white/70 max-w-3xl mx-auto leading-relaxed">
                Découvrez les talents qui font vibrer la scène hip-hop de Bangui
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="max-w-md mx-auto mb-12"
            >
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-white/50" />
                <Input
                  type="text"
                  placeholder="Rechercher un artiste..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-[#111111] border-[#333333] text-white placeholder:text-white/50 focus:border-[#D4AF37] transition-all duration-300"
                />
              </div>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {loading ? (
                [1, 2, 3, 4, 5, 6].map(i => (
                  <Skeleton key={i} className="h-96 rounded-2xl bg-[#111]" />
                ))
              ) : (
                filteredArtists.map((artist, index) => (
                  <motion.div
                    key={artist.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: index * 0.1 }}
                  >
                    <ArtistCard artist={artist} />
                  </motion.div>
                ))
              )}
            </div>

            {!loading && filteredArtists.length === 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.4 }}
                className="text-center py-20"
              >
                <p className="text-xl text-white/50">Aucun artiste trouvé pour "{searchQuery}"</p>
              </motion.div>
            )}
          </div>
        </section>

        <Footer />
      </div>
    </>
  );
};

export default ArtistesPage;