import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Search, Filter, Award, Play, User as UserIcon, Calendar, Music, Image as ImageIcon, Heart, MessageSquare } from 'lucide-react';
import Header from '@/components/Header.jsx';
import Footer from '@/components/Footer.jsx';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import LikersModal from '@/components/LikersModal.jsx';
import { supabase } from '@/lib/supabaseClient.js';
import { useAudio } from '@/contexts/AudioContext.jsx';
import { useDebounce } from '@/hooks/use-debounce.js';

const GalleryPage = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const { playTrack } = useAudio();

  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 500);
  const [typeFilter, setTypeFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all');
  const [genreFilter, setGenreFilter] = useState('all');
  const [sortOption, setSortOption] = useState('trending'); // trending, newest, popular

  const roles = ['Artiste', 'Producteur', 'Beat maker', 'Photographe', 'Réalisateur', 'Manager', 'Ingénieur de son', 'Auditeur', 'Autre'];
  const genres = ['Rap', 'Hip-Hop', 'Drill', 'R&B', 'Trap', 'Afrobeat', 'Gospel', 'Autre'];

  const [selectedPostId, setSelectedPostId] = useState(null);
  const [showLikersModal, setShowLikersModal] = useState(false);

  const getFileUrl = (bucket, path) => {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    return data.publicUrl;
  };

  useEffect(() => {
    const fetchGallery = async () => {
      setLoading(true);
      try {
        let allItems = [];
        
        // Fetch Uploads (Music)
        if (typeFilter === 'all' || typeFilter === 'Musique') {
          let query = supabase
            .from('uploads')
            .select('*, profiles:user_id(*)');
          
          if (debouncedSearch) {
            query = query.or(`title.ilike.%${debouncedSearch}%,genre.ilike.%${debouncedSearch}%`);
          }

          if (genreFilter !== 'all') {
            query = query.eq('genre', genreFilter);
          }

          const { data: uploads, error: uploadsError } = await query.limit(50);

          if (uploadsError) throw uploadsError;

          const formattedUploads = (uploads || []).map(u => ({
            id: u.id,
            type: 'Musique',
            badge: u.type,
            title: u.title,
            creator: u.profiles?.username || u.profiles?.name || 'Inconnu',
            isPremium: u.profiles?.is_premium || false,
            date: u.created_at,
            image: getFileUrl('covers', u.cover_art),
            link: `/uploads/${u.id}`,
            url: getFileUrl('uploads', u.file_path),
            score: (u.view_count || 0) + ((u.download_count || 0) * 2),
            views: u.view_count || 0
          }));
          allItems = [...allItems, ...formattedUploads];
        }

        // Fetch Users (Artistes)
        if (typeFilter === 'all' || typeFilter === 'Artistes') {
          let query = supabase
            .from('profiles')
            .select('*');

          if (debouncedSearch) {
            query = query.or(`name.ilike.%${debouncedSearch}%,username.ilike.%${debouncedSearch}%,user_role.ilike.%${debouncedSearch}%`);
          }

          if (roleFilter !== 'all') {
            query = query.eq('user_role', roleFilter);
          }

          const { data: users, error: usersError } = await query.limit(30);

          if (usersError) throw usersError;

          const formattedUsers = (users || []).map(u => ({
            id: u.id,
            type: 'Artiste',
            badge: u.user_role || 'Artiste',
            title: u.username || u.name,
            creator: '', // Self
            isPremium: u.is_premium || false,
            date: u.created_at,
            image: getFileUrl('avatars', u.profilePhoto) || getFileUrl('avatars', u.avatar),
            link: `/profil/${u.id}`,
            score: u.is_premium ? 1000 : 0, // Premium artists get base boost
            views: 0,
            role: u.user_role
          }));
          allItems = [...allItems, ...formattedUsers];
        }

        // Fetch Posts (Photos/Vidéos)
        if (typeFilter === 'all' || typeFilter === 'Publications') {
          let query = supabase
            .from('posts')
            .select('*, profiles:user_id(*)');

          if (debouncedSearch) {
            query = query.ilike('caption', `%${debouncedSearch}%`);
          }

          const { data: posts, error: postsError } = await query.order('created_at', { ascending: false }).limit(30);

          if (!postsError) {
            const formattedPosts = (posts || []).map(p => ({
              id: p.id,
              type: 'Publication',
              badge: p.media_type === 'video' ? 'Vidéo' : 'Photo',
              title: p.caption || 'Sans légende',
              creator: p.profiles?.username || 'Artiste',
              isPremium: p.profiles?.is_premium || false,
              date: p.created_at,
              image: getFileUrl('posts', p.content_url),
              link: `/posts/${p.id}`,
              score: (p.likes_count || 0) * 5 + (p.comments_count || 0) * 10,
              views: 0,
              likes: p.likes_count || 0,
              comments: p.comments_count || 0,
              mediaType: p.media_type
            }));
            allItems = [...allItems, ...formattedPosts];
          }
        }

        // Note: For News and Events, since no collections exist in schema, we skip fetching them.
        
        // Sorting Logic
        if (sortOption === 'trending') {
          // Premium first, then score, then newest
          allItems.sort((a, b) => {
            if (a.isPremium !== b.isPremium) return a.isPremium ? -1 : 1;
            if (b.score !== a.score) return b.score - a.score;
            return new Date(b.date) - new Date(a.date);
          });
        } else if (sortOption === 'newest') {
          // Premium first, then newest
          allItems.sort((a, b) => {
            if (a.isPremium !== b.isPremium) return a.isPremium ? -1 : 1;
            return new Date(b.date) - new Date(a.date);
          });
        } else if (sortOption === 'popular') {
          // Strictly views/score, Premium gives slight edge
          allItems.sort((a, b) => {
            const aScore = a.score + (a.isPremium ? 500 : 0);
            const bScore = b.score + (b.isPremium ? 500 : 0);
            return bScore - aScore;
          });
        }

        setItems(allItems);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchGallery();
  }, [debouncedSearch, typeFilter, roleFilter, genreFilter, sortOption]);

  return (
    <>
      <Helmet>
        <title>Galerie - KLTUR RAP</title>
      </Helmet>

      <div className="min-h-screen flex flex-col bg-[#050505]">
        <Header />
        <LikersModal isOpen={showLikersModal} onClose={() => setShowLikersModal(false)} postId={selectedPostId} />

        <main className="flex-grow py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
          <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <h1 className="text-4xl md:text-5xl font-black text-white uppercase tracking-tight mb-2">
                Le <span className="text-[#D4AF37]">Mouvement</span>
              </h1>
              <p className="text-white/60 text-lg">Découvrez tout le contenu KLTUR RAP au même endroit.</p>
            </div>
          </div>

          {/* Filters Bar */}
          <div className="bg-[#0a0a0a] rounded-2xl border border-[#222] p-4 mb-8 flex flex-col md:flex-row gap-4">
            <div className="relative flex-grow">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-white/40" />
              <Input 
                value={search} onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher..." 
                className="pl-10 bg-[#111] border-[#333] text-white focus:border-[#D4AF37]"
              />
            </div>
            <Select value={typeFilter} onValueChange={(val) => { setTypeFilter(val); setRoleFilter('all'); setGenreFilter('all'); }}>
              <SelectTrigger className="w-full md:w-[200px] bg-[#111] border-[#333] text-white">
                <Filter className="w-4 h-4 mr-2" /> <SelectValue placeholder="Type de contenu" />
              </SelectTrigger>
              <SelectContent className="bg-[#111] border-[#333] text-white">
                <SelectItem value="all">Tout le contenu</SelectItem>
                <SelectItem value="Musique">Musique</SelectItem>
                <SelectItem value="Artistes">Artistes</SelectItem>
                <SelectItem value="Publications">Publications</SelectItem>
              </SelectContent>
            </Select>

            {typeFilter === 'Artistes' && (
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-full md:w-[180px] bg-[#111] border-[#333] text-[#D4AF37] border-[#D4AF37]/30 animate-in fade-in zoom-in-95 duration-200">
                  <SelectValue placeholder="Tous les rôles" />
                </SelectTrigger>
                <SelectContent className="bg-[#111] border-[#333] text-white">
                  <SelectItem value="all">Tous les rôles</SelectItem>
                  {roles.map(role => (
                    <SelectItem key={role} value={role}>{role}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {typeFilter === 'Musique' && (
              <Select value={genreFilter} onValueChange={setGenreFilter}>
                <SelectTrigger className="w-full md:w-[180px] bg-[#111] border-[#333] text-[#D4AF37] border-[#D4AF37]/30 animate-in fade-in zoom-in-95 duration-200">
                  <SelectValue placeholder="Tous les genres" />
                </SelectTrigger>
                <SelectContent className="bg-[#111] border-[#333] text-white">
                  <SelectItem value="all">Tous les genres</SelectItem>
                  {genres.map(genre => (
                    <SelectItem key={genre} value={genre}>{genre}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            <Select value={sortOption} onValueChange={setSortOption}>
              <SelectTrigger className="w-full md:w-[200px] bg-[#111] border-[#333] text-white">
                <SelectValue placeholder="Trier par" />
              </SelectTrigger>
              <SelectContent className="bg-[#111] border-[#333] text-white">
                <SelectItem value="trending">Tendances (Premium First)</SelectItem>
                <SelectItem value="newest">Plus récents</SelectItem>
                <SelectItem value="popular">Plus populaires</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Masonry-like Grid */}
          {loading ? (
            <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-6 space-y-6">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="break-inside-avoid">
                  <Skeleton className={`w-full rounded-2xl bg-[#111] ${i%2 === 0 ? 'h-64' : 'h-80'}`} />
                </div>
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-20 bg-[#0a0a0a] rounded-2xl border border-[#222]">
              <Search className="w-12 h-12 text-white/20 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">Aucun résultat</h3>
              <p className="text-white/50">Essayez d'autres mots-clés ou filtres.</p>
            </div>
          ) : (
            <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-6 space-y-6">
              {items.map(item => (
                <Link key={item.id} to={item.link} className="block break-inside-avoid group">
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                    className="bg-[#0a0a0a] rounded-2xl border border-[#222] overflow-hidden hover:border-[#D4AF37] transition-all duration-300 relative group-hover:-translate-y-1 group-hover:shadow-[0_10px_30px_rgba(0,0,0,0.5)]"
                  >
                    {/* Badge */}
                    <div className="absolute top-3 left-3 z-10 bg-black/80 backdrop-blur text-[10px] font-bold text-white uppercase tracking-wider px-2 py-1 rounded border border-[#333] flex items-center gap-1.5">
                      {item.type === 'Musique' && <Music className="w-3 h-3 text-[#D4AF37]"/>}
                      {item.type === 'Artiste' && <UserIcon className="w-3 h-3 text-[#D4AF37]"/>}
                      {item.type === 'Publication' && <ImageIcon className="w-3 h-3 text-[#D4AF37]"/>}
                      {item.type}
                    </div>

                    {/* Image Area */}
                    <div className={`relative bg-[#111] overflow-hidden ${item.type === 'Artiste' ? 'aspect-square' : 'aspect-[4/5]'}`}>
                      {item.image ? (
                        item.mediaType === 'video' ? (
                          <video src={item.image} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" muted playsInline />
                        ) : (
                          <img src={item.image} alt={item.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                        )
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-[#111]">
                          <UserIcon className="w-16 h-16 text-white/10" />
                        </div>
                      )}
                      
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-80 group-hover:opacity-100 transition-opacity" />
                      
                      {(item.type === 'Musique' || item.mediaType === 'video') && (
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <div
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              playTrack({
                                id: item.id,
                                title: item.title,
                                artist: item.creator,
                                url: item.url,
                                cover: item.image
                              });
                            }}
                            className="w-14 h-14 bg-[#D4AF37] rounded-full flex items-center justify-center text-black pl-1 gold-glow transform scale-50 group-hover:scale-100 transition-transform duration-300 cursor-pointer"
                          >
                            <Play className="w-6 h-6" fill="currentColor" />
                          </div>
                        </div>
                      )}

                      {/* Content Overlay */}
                      <div className="absolute bottom-0 left-0 right-0 p-5">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-bold text-white text-lg leading-tight group-hover:text-[#D4AF37] transition-colors">{item.title}</h3>
                          {item.isPremium && <Award className="w-4 h-4 text-[#D4AF37] shrink-0" title="Certifié" />}
                        </div>
                        {item.creator && (
                          <p className="text-white/70 text-sm font-medium">{item.creator}</p>
                        )}
                        <div className="mt-3 flex items-center justify-between text-xs text-white/50 border-t border-white/10 pt-3">
                          <span className="bg-white/10 px-2 py-0.5 rounded text-white/80">{item.badge}</span>
                          <div className="flex items-center gap-3">
                            {item.type === 'Musique' ? (
                              <span>{item.views} vues</span>
                            ) : (
                              <>
                                <button
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    setSelectedPostId(item.id);
                                    setShowLikersModal(true);
                                  }}
                                  className="flex items-center gap-1 hover:scale-110 transition-transform"
                                >
                                  <Heart className="w-3 h-3 fill-red-500 text-red-500" /> {item.likes}
                                </button>
                                <span className="flex items-center gap-1"><MessageSquare className="w-3 h-3" /> {item.comments}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </Link>
              ))}
            </div>
          )}
        </main>

        <Footer />
      </div>
    </>
  );
};

export default GalleryPage;