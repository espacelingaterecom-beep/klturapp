import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Play, Eye, Download, Search, Award } from 'lucide-react';
import { toast } from 'sonner';
import Header from '@/components/Header.jsx';
import Footer from '@/components/Footer.jsx';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/lib/supabaseClient.js';

const UploadsGalleryPage = () => {
  const [uploads, setUploads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [genreFilter, setGenreFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [sortBy, setSortBy] = useState('-created');

  const getFileUrl = (bucket, path) => {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    return data.publicUrl;
  };

  useEffect(() => {
    const fetchUploads = async () => {
      setLoading(true);
      try {
        let query = supabase
          .from('uploads')
          .select('*, profiles:user_id(*)');

        if (search) {
          query = query.or(`title.ilike.%${search}%,profiles.name.ilike.%${search}%`);
        }
        
        if (genreFilter !== 'all') {
          query = query.eq('genre', genreFilter);
        }

        if (typeFilter !== 'all') {
          query = query.eq('type', typeFilter);
        }

        // Apply standard sorting
        const sortField = sortBy.startsWith('-') ? sortBy.substring(1) : sortBy;
        const ascending = !sortBy.startsWith('-');

        // Map Pocketbase fields to Supabase fields
        const fieldMapping = {
          'created': 'created_at',
          'viewCount': 'view_count',
          'downloadCount': 'download_count'
        };

        const supabaseSortField = fieldMapping[sortField] || sortField;
        query = query.order(supabaseSortField, { ascending });

        const { data, error } = await query;
        if (error) throw error;
        
        const mappedItems = (data || []).map(item => ({
          ...item,
          expand: {
            userId: item.profiles
          }
        }));

        // Prioritize premium users locally
        const sortedItems = [...mappedItems].sort((a, b) => {
          const aPremium = a.expand?.userId?.is_premium ? 1 : 0;
          const bPremium = b.expand?.userId?.is_premium ? 1 : 0;
          return bPremium - aPremium; // Premium first
        });

        setUploads(sortedItems);
      } catch (err) {
        console.error(err);
        toast.error('Erreur lors du chargement de la galerie.');
      } finally {
        setLoading(false);
      }
    };

    const delayDebounceFn = setTimeout(() => {
      fetchUploads();
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [search, genreFilter, typeFilter, sortBy]);

  return (
    <>
      <Helmet>
        <title>Galerie - KLTUR RAP</title>
      </Helmet>

      <div className="min-h-screen flex flex-col bg-[#050505]">
        <Header />

        <main className="flex-grow py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
          <div className="mb-12">
            <h1 className="text-4xl md:text-5xl font-black text-white uppercase tracking-tight mb-4">
              La <span className="text-[#D4AF37]">Galerie</span>
            </h1>
            <p className="text-white/60 text-lg">Explorez les dernières sorties de la scène urbaine centrafricaine.</p>
          </div>

          {/* Filters */}
          <div className="bg-[#0a0a0a] rounded-xl border border-[#222] p-4 mb-8 flex flex-col md:flex-row gap-4 relative z-20">
            <div className="relative flex-grow">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-white/40" />
              <Input 
                value={search} onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher un titre, un artiste..." 
                className="pl-10 bg-[#111] border-[#333] text-white focus:border-[#D4AF37]"
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full md:w-[150px] bg-[#111] border-[#333] text-white">
                <SelectValue placeholder="Format" />
              </SelectTrigger>
              <SelectContent className="bg-[#111] border-[#333] text-white">
                <SelectItem value="all">Tous les formats</SelectItem>
                <SelectItem value="Song">Singles</SelectItem>
                <SelectItem value="Music Video">Clips</SelectItem>
                <SelectItem value="Album">Albums</SelectItem>
              </SelectContent>
            </Select>
            <Select value={genreFilter} onValueChange={setGenreFilter}>
              <SelectTrigger className="w-full md:w-[150px] bg-[#111] border-[#333] text-white">
                <SelectValue placeholder="Genre" />
              </SelectTrigger>
              <SelectContent className="bg-[#111] border-[#333] text-white">
                <SelectItem value="all">Tous genres</SelectItem>
                <SelectItem value="Rap">Rap</SelectItem>
                <SelectItem value="Hip-Hop">Hip-Hop</SelectItem>
                <SelectItem value="Drill">Drill</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full md:w-[180px] bg-[#111] border-[#333] text-white">
                <SelectValue placeholder="Trier par" />
              </SelectTrigger>
              <SelectContent className="bg-[#111] border-[#333] text-white">
                <SelectItem value="-created">Plus récents</SelectItem>
                <SelectItem value="-viewCount">Plus vus</SelectItem>
                <SelectItem value="-downloadCount">Plus téléchargés</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Grid */}
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4, 5, 6, 7, 8].map(i => <Skeleton key={i} className="aspect-square rounded-xl bg-[#111]" />)}
            </div>
          ) : uploads.length === 0 ? (
            <div className="text-center py-20 text-white/50 bg-[#0a0a0a] rounded-xl border border-[#222]">
              <Search className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <h3 className="text-xl font-bold text-white mb-2">Aucun résultat</h3>
              <p>Essayez de modifier vos filtres de recherche.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
              {uploads.map(upload => {
                const artist = upload.expand?.userId;
                return (
                  <Link key={upload.id} to={`/uploads/${upload.id}`} className="group block">
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="bg-[#0a0a0a] rounded-xl overflow-hidden border border-[#222] hover:border-[#D4AF37] transition-all hover:-translate-y-1 h-full flex flex-col"
                    >
                      <div className="aspect-square relative overflow-hidden bg-[#111]">
                        {upload.cover_art && (
                          <img 
                            src={getFileUrl('covers', upload.cover_art)}
                            alt={upload.title}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                        )}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <div className="w-12 h-12 bg-[#D4AF37] rounded-full flex items-center justify-center text-black pl-1 gold-glow transform scale-90 group-hover:scale-100 transition-transform">
                            <Play className="w-5 h-5" fill="currentColor" />
                          </div>
                        </div>
                        {artist?.is_premium && (
                          <div className="absolute top-2 left-2 bg-black/80 p-1.5 rounded-full border border-[#D4AF37]/50" title="Artiste Certifié">
                            <Award className="w-3.5 h-3.5 text-[#D4AF37]" />
                          </div>
                        )}
                        <div className="absolute top-2 right-2 bg-black/80 px-2 py-0.5 rounded text-[10px] font-bold text-white uppercase tracking-wider backdrop-blur-sm">
                          {upload.type}
                        </div>
                      </div>
                      
                      <div className="p-4 flex-grow flex flex-col justify-between">
                        <div>
                          <h3 className="font-bold text-white text-sm md:text-base line-clamp-1 mb-1 group-hover:text-[#D4AF37] transition-colors">{upload.title}</h3>
                          <p className="text-xs text-white/60 line-clamp-1">{artist?.name || 'Artiste inconnu'}</p>
                        </div>
                        <div className="flex items-center justify-between text-[10px] md:text-xs text-white/40 font-medium mt-3 pt-3 border-t border-[#222]">
                          <span className="flex items-center gap-1"><Eye className="w-3.5 h-3.5"/> {upload.view_count || 0}</span>
                          <span className="flex items-center gap-1"><Download className="w-3.5 h-3.5"/> {upload.download_count || 0}</span>
                        </div>
                      </div>
                    </motion.div>
                  </Link>
                );
              })}
            </div>
          )}
        </main>

        <Footer />
      </div>
    </>
  );
};

export default UploadsGalleryPage;