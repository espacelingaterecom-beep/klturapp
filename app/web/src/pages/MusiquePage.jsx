import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  Play, Eye, Download, Search, Award, Users, Star, Music,
  CheckCircle2, ChevronRight, Mic2, Video, TrendingUp, Trophy
} from 'lucide-react';
import { toast } from 'sonner';
import Header from '@/components/Header.jsx';
import Footer from '@/components/Footer.jsx';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase, getPublicImageUrl } from '@/lib/supabaseClient.js';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { formatRichText } from '@/lib/textFormatter.jsx';

const MusiquePage = () => {
  const { currentUser, isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(true);
  const [forYouArtists, setForYouArtists] = useState([]);
  const [worldContent, setWorldArtistsContent] = useState([]);
  const [topOfTheWeek, setTopOfTheWeek] = useState([]);
  const [trendingMusic, setTrendingMusic] = useState([]);
  const [allMusic, setAllMusic] = useState([]);
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [genreFilter, setGenreFilter] = useState('all');

  const genres = ['Rap', 'Hip-Hop', 'Trap', 'Drill', 'R&B', 'Afrobeat', 'Autres'];

  const getFileUrl = (bucket, path) => {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    return data.publicUrl;
  };

  useEffect(() => {
    const fetchSearch = async () => {
      if (!search.trim()) {
        setSearchResults([]);
        return;
      }
      try {
        const { data, error } = await supabase
          .from('uploads')
          .select('*, profiles:user_id(*)')
          .or(`title.ilike.%${search}%,genre.ilike.%${search}%`)
          .limit(10);
        if (error) throw error;
        setSearchResults(data || []);
      } catch (err) {
        console.error("Search Error:", err);
      }
    };

    const timer = setTimeout(() => {
      fetchSearch();
    }, 500);

    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // 1. Fetch "COMPTE POUR TOI" - Premium and Official accounts
        const { data: artistsData } = await supabase
          .from('profiles')
          .select('*, followers(count)')
          .or('is_premium.eq.true,is_admin.eq.true')
          .limit(10);

        setForYouArtists(artistsData || []);

        // 2. Fetch "KLTUR RAP WORLD" - Only from @KLTUR RAP account
        const { data: worldProfile } = await supabase
          .from('profiles')
          .select('id')
          .ilike('username', 'KLTUR RAP')
          .maybeSingle();

        if (worldProfile) {
          const { data: worldContentData } = await supabase
            .from('uploads')
            .select('*, profiles:user_id(*)')
            .eq('user_id', worldProfile.id)
            .order('created_at', { ascending: false })
            .limit(8);
          setWorldArtistsContent(worldContentData || []);
        }

        // 3. Fetch Top of the Week (Fallback to likes if RPC missing)
        try {
          const { data: voteAggregation } = await supabase.rpc('get_top_voted_tracks');
          if (voteAggregation && voteAggregation.length > 0) {
            setTopOfTheWeek(voteAggregation);
          } else {
            throw new Error("No votes yet");
          }
        } catch (e) {
          const { data: fallbackTop } = await supabase
            .from('uploads')
            .select('*, profiles:user_id(*)')
            .order('likes_count', { ascending: false })
            .limit(3);
          setTopOfTheWeek(fallbackTop || []);
        }

        // 4. Fetch Trending Music (Most viewed)
        const { data: trendingData } = await supabase
          .from('uploads')
          .select('*, profiles:user_id(*)')
          .order('view_count', { ascending: false })
          .limit(10);
        setTrendingMusic(trendingData || []);

        // 5. Fetch All Music
        let musicQuery = supabase
          .from('uploads')
          .select('*, profiles:user_id(*)');

        if (genreFilter !== 'all') {
          musicQuery = musicQuery.eq('genre', genreFilter);
        }

        const { data: musicData } = await musicQuery
          .order('created_at', { ascending: false })
          .limit(20);
        setAllMusic(musicData || []);

      } catch (err) {
        console.error("Music Page Error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [genreFilter]);

  const handleFollow = async (artistId) => {
    if (!isAuthenticated) {
      toast.error("Connectez-vous pour suivre cet artiste");
      return;
    }
    toast.success("Abonnement réussi !");
  };

  return (
    <>
      <Helmet>
        <title>Musique - KLTUR RAP</title>
      </Helmet>

      <div className="min-h-screen flex flex-col bg-[#050505] text-white">
        <Header />

        <main className="flex-grow py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full space-y-20">

          {/* TOP DE LA SEMAINE - PODIUM */}
          <section className="space-y-12">
             <div className="text-center">
                <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tighter mb-4">
                  <span className="text-[#D4AF37]">Top</span> de la semaine
                </h2>
                <p className="text-white/40 font-bold uppercase text-[10px] tracking-[0.3em]">Le classement officiel voté par la communauté</p>
             </div>

             <div className="flex flex-col md:flex-row items-end justify-center gap-6 md:gap-0 max-w-5xl mx-auto pt-10">
                {/* 2nd Place */}
                <div className="order-2 md:order-1 w-full md:w-1/3">
                   {topOfTheWeek[1] && (
                     <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-[#0a0a0a] rounded-t-[40px] border border-[#222] p-8 text-center relative pt-20 border-b-0 h-[380px] flex flex-col items-center">
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2">
                           <div className="relative">
                              <Avatar className="h-28 w-28 border-4 border-[#222]">
                                 <AvatarImage src={getFileUrl('covers', topOfTheWeek[1].cover_art)} />
                              </Avatar>
                              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-[#C0C0C0] text-black h-8 w-8 rounded-full flex items-center justify-center font-black border-4 border-[#0a0a0a]">2</div>
                           </div>
                        </div>
                        <h3 className="font-black text-white text-xl truncate w-full mb-1">{topOfTheWeek[1].title}</h3>
                        <p className="text-xs text-white/40 font-bold uppercase mb-6">@{topOfTheWeek[1].profiles?.username}</p>
                        <Button asChild variant="outline" className="mt-auto border-white/10 rounded-full px-8">
                           <Link to={`/uploads/${topOfTheWeek[1].id}`}>Écouter</Link>
                        </Button>
                     </motion.div>
                   )}
                </div>

                {/* 1st Place */}
                <div className="order-1 md:order-2 w-full md:w-[40%] z-10">
                   {topOfTheWeek[0] && (
                     <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-[#0f0f0f] rounded-t-[50px] border-2 border-[#D4AF37]/30 p-10 text-center relative pt-24 border-b-0 h-[450px] flex flex-col items-center gold-glow">
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2">
                           <div className="relative">
                              <div className="absolute inset-0 bg-[#D4AF37] rounded-full blur-2xl opacity-20 animate-pulse" />
                              <Avatar className="h-36 w-36 border-4 border-[#D4AF37]">
                                 <AvatarImage src={getFileUrl('covers', topOfTheWeek[0].cover_art)} />
                              </Avatar>
                              <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-[#D4AF37] text-black h-12 w-12 rounded-full flex items-center justify-center text-xl font-black border-4 border-[#0f0f0f]">1</div>
                           </div>
                        </div>
                        <div className="flex items-center gap-2 text-[#D4AF37] mb-4">
                           <Trophy className="w-5 h-5 fill-current" />
                           <span className="font-black uppercase text-xs tracking-widest">Champion de la semaine</span>
                        </div>
                        <h3 className="font-black text-white text-2xl truncate w-full mb-1">{topOfTheWeek[0].title}</h3>
                        <p className="text-sm text-white/40 font-bold uppercase mb-8">@{topOfTheWeek[0].profiles?.username}</p>
                        <Button asChild className="mt-auto bg-[#D4AF37] text-black hover:bg-[#b5952f] rounded-full px-12 h-14 font-black uppercase tracking-wider text-lg">
                           <Link to={`/uploads/${topOfTheWeek[0].id}`}>Écouter le TOP 1</Link>
                        </Button>
                     </motion.div>
                   )}
                </div>

                {/* 3rd Place */}
                <div className="order-3 md:order-3 w-full md:w-1/3">
                   {topOfTheWeek[2] && (
                     <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-[#0a0a0a] rounded-t-[40px] border border-[#222] p-8 text-center relative pt-20 border-b-0 h-[330px] flex flex-col items-center">
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2">
                           <div className="relative">
                              <Avatar className="h-24 w-24 border-4 border-[#222]">
                                 <AvatarImage src={getFileUrl('covers', topOfTheWeek[2].cover_art)} />
                              </Avatar>
                              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-[#CD7F32] text-black h-8 w-8 rounded-full flex items-center justify-center font-black border-4 border-[#0a0a0a]">3</div>
                           </div>
                        </div>
                        <h3 className="font-black text-white text-lg truncate w-full mb-1">{topOfTheWeek[2].title}</h3>
                        <p className="text-xs text-white/40 font-bold uppercase mb-6">@{topOfTheWeek[2].profiles?.username}</p>
                        <Button asChild variant="outline" className="mt-auto border-white/10 rounded-full px-8">
                           <Link to={`/uploads/${topOfTheWeek[2].id}`}>Écouter</Link>
                        </Button>
                     </motion.div>
                   )}
                </div>
             </div>
             {/* Podium Base */}
             <div className="hidden md:block h-4 w-full max-w-5xl mx-auto bg-gradient-to-r from-transparent via-[#222] to-transparent rounded-full shadow-2xl" />
          </section>

          {/* Hero / Header */}
          <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-[#111] to-black border border-white/5 p-8 md:p-16">
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#D4AF37]/10 rounded-full blur-[100px] -mr-32 -mt-32" />
            <div className="relative z-10 max-w-2xl">
              <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter mb-6 leading-none">
                L'univers de la <br /> <span className="text-[#D4AF37]">musique urbaine</span>
              </h1>
              <p className="text-white/60 text-lg mb-8 font-medium">
                Découvrez les derniers sons, les sessions exclusives et les artistes qui font vibrer Bangui.
              </p>
              <div className="relative max-w-md">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-white/30" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Rechercher un son, un artiste..."
                  className="pl-12 bg-white/5 border-white/10 h-14 rounded-2xl focus:border-[#D4AF37]"
                />

                {/* Résultats de recherche en popover */}
                {search.trim() && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-[#0a0a0a] border border-[#222] rounded-2xl shadow-2xl z-50 overflow-hidden max-h-96 overflow-y-auto">
                    {searchResults.length === 0 ? (
                      <div className="p-8 text-center text-white/40 text-sm italic">Aucun résultat pour "{search}"</div>
                    ) : (
                      <div className="p-2 space-y-1">
                        {searchResults.map(item => (
                          <Link
                            key={item.id}
                            to={`/uploads/${item.id}`}
                            className="flex items-center gap-4 p-3 hover:bg-[#111] rounded-xl transition-all group"
                          >
                            <div className="h-12 w-12 rounded-lg overflow-hidden shrink-0 border border-[#222]">
                               <img src={getFileUrl('covers', item.cover_art)} className="h-full w-full object-cover" alt="" />
                            </div>
                            <div className="flex-grow min-w-0">
                               <h4 className="font-bold text-white text-sm truncate group-hover:text-[#D4AF37]">{item.title}</h4>
                               <p className="text-[10px] text-white/40 uppercase font-black tracking-widest">@{item.profiles?.username}</p>
                            </div>
                            <ChevronRight className="w-4 h-4 text-white/10 group-hover:text-[#D4AF37]" />
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 1. COMPTE POUR TOI */}
          <section className="space-y-8">
            <div className="flex items-end justify-between px-2">
              <div>
                <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tight flex items-center gap-3">
                  <Star className="w-8 h-8 text-[#D4AF37] fill-current" /> Compte pour toi
                </h2>
                <p className="text-white/40 font-bold uppercase text-[10px] tracking-[0.2em] mt-2">Comptes officiels et certifiés à suivre</p>
              </div>
              <Button asChild variant="ghost" className="text-[#D4AF37] font-black uppercase text-xs tracking-widest hover:bg-transparent">
                <Link to="/artistes">Tout voir <ChevronRight className="w-4 h-4 ml-1" /></Link>
              </Button>
            </div>

            <div className="flex overflow-x-auto gap-6 pb-6 scrollbar-hide px-2">
              {loading ? (
                [1,2,3,4,5].map(i => <Skeleton key={i} className="min-w-[280px] h-[320px] rounded-3xl bg-[#0a0a0a]" />)
              ) : (
                forYouArtists.map(artist => (
                  <motion.div
                    key={artist.id}
                    whileHover={{ y: -5 }}
                    className="min-w-[280px] bg-[#0a0a0a] rounded-3xl border border-[#222] p-6 flex flex-col items-center text-center group transition-all hover:border-[#D4AF37]/50 shadow-xl"
                  >
                    <div className="relative mb-6">
                      <Avatar className="h-24 w-24 border-4 border-[#111] group-hover:border-[#D4AF37] transition-all shadow-2xl">
                        <AvatarImage src={getFileUrl('avatars', artist.avatar)} />
                        <AvatarFallback className="bg-[#111] text-[#D4AF37] font-black text-2xl">{artist.username?.[0]}</AvatarFallback>
                      </Avatar>
                      {artist.is_premium && (
                        <div className="absolute -bottom-1 -right-1 bg-[#D4AF37] text-black p-1.5 rounded-full border-2 border-[#0a0a0a]">
                          <Award className="w-3 h-3 fill-current" />
                        </div>
                      )}
                    </div>

                    <h3 className="font-black text-white text-lg truncate w-full mb-1 group-hover:text-[#D4AF37] transition-colors">
                      @{artist.username}
                    </h3>
                    <p className="text-[10px] text-white/40 uppercase font-bold tracking-widest mb-4">
                      {artist.user_role || 'Artiste'} • {artist.followers?.[0]?.count || 0} abonnés
                    </p>

                    <div className="flex flex-col w-full gap-2 mt-auto">
                      <Button onClick={() => handleFollow(artist.id)} className="w-full bg-white text-black hover:bg-[#D4AF37] font-black uppercase text-xs h-10 rounded-xl transition-all">
                        Suivre
                      </Button>
                      <Button asChild variant="outline" className="w-full border-white/10 text-white/60 hover:text-white font-black uppercase text-[10px] h-10 rounded-xl">
                        <Link to={`/profil/${artist.id}`}>Voir Profil</Link>
                      </Button>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </section>

          {/* 2. KLTUR RAP WORLD */}
          <section className="space-y-8 bg-[#0a0a0a] rounded-[40px] border border-[#222] p-8 md:p-12 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-[#D4AF37]/5 via-transparent to-transparent pointer-events-none" />

            <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 px-2">
              <div>
                <div className="flex items-center gap-3 mb-4">
                   <div className="bg-[#D4AF37] p-2 rounded-xl text-black">
                      <Mic2 className="w-6 h-6" />
                   </div>
                   <span className="text-white font-black uppercase tracking-[0.3em] text-xs">Exclusivité Plateforme</span>
                </div>
                <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tighter">
                  KLTUR RAP <span className="text-[#D4AF37]">WORLD</span>
                </h2>
                <p className="text-white/60 font-medium max-w-xl mt-4">
                  Plongez au cœur des sessions studio et performances live organisées par KLTUR RAP. Uniquement du contenu pur et exclusif.
                </p>
              </div>
              <Button asChild className="bg-white text-black hover:bg-[#D4AF37] font-black uppercase px-8 h-14 rounded-2xl transition-all shadow-lg">
                 <Link to="/artistes">Explorer le World</Link>
              </Button>
            </div>

            <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {loading ? (
                [1,2,3,4].map(i => <Skeleton key={i} className="aspect-video rounded-3xl bg-[#111]" />)
              ) : worldContent.length === 0 ? (
                <div className="col-span-full py-12 text-center text-white/20 italic font-bold uppercase tracking-widest bg-black/20 rounded-3xl border border-white/5">
                  Bientôt disponible...
                </div>
              ) : (
                worldContent.map(item => (
                  <Link key={item.id} to={`/uploads/${item.id}`} className="group relative aspect-video rounded-3xl overflow-hidden border border-[#222] hover:border-[#D4AF37] transition-all shadow-2xl">
                    <img src={getFileUrl('covers', item.cover_art)} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" alt="" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                       <div className="w-16 h-16 bg-[#D4AF37] rounded-full flex items-center justify-center text-black shadow-[0_0_30px_rgba(212,175,55,0.4)]">
                          <Play className="w-8 h-8 fill-current ml-1" />
                       </div>
                    </div>
                    <div className="absolute bottom-4 left-4 right-4">
                      <p className="text-[10px] font-black uppercase text-[#D4AF37] mb-1">Session Studio</p>
                      <h4 className="font-bold text-white truncate text-sm">{item.title}</h4>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </section>

          {/* 3. TENDANCES */}
          <section className="space-y-8">
            <div className="flex items-center justify-between px-2">
              <div>
                <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tight flex items-center gap-3">
                  <TrendingUp className="w-8 h-8 text-[#D4AF37]" /> Tendances
                </h2>
                <p className="text-white/40 font-bold uppercase text-[10px] tracking-[0.2em] mt-2">Les morceaux les plus écoutés du moment</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 px-2">
              {loading ? (
                [1,2,3,4].map(i => <Skeleton key={i} className="h-24 rounded-2xl bg-[#0a0a0a]" />)
              ) : (
                trendingMusic.map((item, index) => (
                  <Link key={item.id} to={`/uploads/${item.id}`} className="flex items-center gap-4 bg-[#0a0a0a] hover:bg-[#111] p-3 rounded-2xl border border-[#222] group transition-all">
                    <span className="text-2xl font-black text-white/10 w-8 text-center group-hover:text-[#D4AF37]/20 transition-colors">
                      {index + 1}
                    </span>
                    <div className="relative h-16 w-16 shrink-0 rounded-lg overflow-hidden">
                      <img src={getFileUrl('covers', item.cover_art)} className="h-full w-full object-cover" alt="" />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Play className="w-6 h-6 text-white fill-current" />
                      </div>
                    </div>
                    <div className="flex-grow min-w-0">
                      <h4 className="font-bold text-white truncate group-hover:text-[#D4AF37] transition-colors">{item.title}</h4>
                      <p className="text-xs text-white/40 truncate">@{item.profiles?.username}</p>
                    </div>
                    <div className="text-right hidden sm:block">
                      <p className="text-[10px] font-black text-[#D4AF37] uppercase">{item.view_count || 0} vues</p>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </section>

          {/* 4. TOUTE LA MUSIQUE */}
          <section className="space-y-10 pb-20">
             <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-2">
                <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tight flex items-center gap-3">
                   <Music className="w-8 h-8 text-[#D4AF37]" /> Bibliothèque Globale
                </h2>

                <div className="flex flex-wrap gap-2">
                   <button
                     onClick={() => setGenreFilter('all')}
                     className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all border ${genreFilter === 'all' ? 'bg-[#D4AF37] text-black border-[#D4AF37]' : 'bg-[#111] text-white/40 border-white/5 hover:border-white/20'}`}
                   >
                     Tous
                   </button>
                   {genres.map(g => (
                      <button
                        key={g}
                        onClick={() => setGenreFilter(g)}
                        className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all border ${genreFilter === g ? 'bg-[#D4AF37] text-black border-[#D4AF37]' : 'bg-[#111] text-white/40 border-white/5 hover:border-white/20'}`}
                      >
                        {g}
                      </button>
                   ))}
                </div>
             </div>

             <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6 px-2">
                {loading ? (
                   [1,2,3,4,5,6,7,8,9,10].map(i => <Skeleton key={i} className="aspect-square rounded-2xl bg-[#0a0a0a]" />)
                ) : (
                   allMusic.map(music => (
                      <Link key={music.id} to={`/uploads/${music.id}`} className="group block">
                         <div className="relative aspect-square rounded-2xl overflow-hidden border border-[#222] group-hover:border-[#D4AF37] transition-all mb-3 shadow-xl">
                            <img src={getFileUrl('covers', music.cover_art)} className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-500" alt="" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                               <Play className="w-10 h-10 text-[#D4AF37] fill-current" />
                            </div>
                            <div className="absolute top-2 right-2 bg-black/80 px-2 py-0.5 rounded text-[8px] font-black text-white uppercase tracking-widest border border-white/5">
                               {music.genre}
                            </div>
                         </div>
                         <h4 className="font-bold text-sm truncate text-white group-hover:text-[#D4AF37] transition-colors">{music.title}</h4>
                         <p className="text-[10px] text-white/40 font-bold uppercase tracking-tighter mt-0.5">Par @{music.profiles?.username}</p>
                      </Link>
                   ))
                )}
             </div>
          </section>

        </main>

        <Footer />
      </div>
    </>
  );
};

export default MusiquePage;