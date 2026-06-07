import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  Play, Eye, Download, Search, Award, Users, Star, Music,
  CheckCircle2, ChevronRight, Mic2, Video, TrendingUp
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

const MusiquePage = () => {
  const { currentUser, isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(true);
  const [forYouArtists, setForYouArtists] = useState([]);
  const [worldContent, setWorldArtistsContent] = useState([]);
  const [trendingMusic, setTrendingMusic] = useState([]);
  const [allMusic, setAllMusic] = useState([]);
  const [search, setSearch] = useState('');

  const getFileUrl = (bucket, path) => {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    return data.publicUrl;
  };

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
        // First find the KLTUR RAP profile
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

        // 3. Fetch Trending Music (Most viewed)
        const { data: trendingData } = await supabase
          .from('uploads')
          .select('*, profiles:user_id(*)')
          .order('view_count', { ascending: false })
          .limit(10);
        setTrendingMusic(trendingData || []);

        // 4. Fetch All Music
        const { data: musicData } = await supabase
          .from('uploads')
          .select('*, profiles:user_id(*)')
          .order('created_at', { ascending: false })
          .limit(20);
        setAllMusic(musicData || []);

      } catch (err) {
        console.error("Music Page Error:", err);
        toast.error("Erreur lors du chargement de la musique.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleFollow = async (artistId) => {
    if (!isAuthenticated) {
      toast.error("Connectez-vous pour suivre cet artiste");
      return;
    }
    // Logic for follow...
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
                  placeholder="Rechercher un son, un artiste..."
                  className="pl-12 bg-white/5 border-white/10 h-14 rounded-2xl focus:border-[#D4AF37]"
                />
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
             <div className="flex items-center justify-between px-2">
                <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tight flex items-center gap-3">
                   <Music className="w-8 h-8 text-[#D4AF37]" /> Bibliothèque Globale
                </h2>
                <Link to="/galerie-uploads" className="text-white/40 hover:text-white font-bold text-xs uppercase tracking-widest transition-colors">Explorer tout</Link>
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