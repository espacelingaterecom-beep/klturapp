import React, { useState, useEffect, useRef } from 'react';
import { Helmet } from 'react-helmet';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, MessageCircle, Share2, Music, UserPlus, Play, Pause, ChevronLeft, Award, ShieldCheck, Trophy } from 'lucide-react';
import { supabase, getPublicImageUrl } from '@/lib/supabaseClient.js';
import { useAuth } from '@/contexts/AuthContext.jsx';
import Header from '@/components/Header.jsx';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';

const ShortVideo = ({ video, isActive }) => {
  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const { currentUser } = useAuth();

  useEffect(() => {
    if (isActive && videoRef.current) {
      videoRef.current.play().catch(e => console.log("Auto-play blocked"));
      setIsPlaying(true);
    } else if (videoRef.current) {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  }, [isActive]);

  const togglePlay = () => {
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleLike = async () => {
    if (!currentUser) return toast.error("Connectez-vous pour liker");
    setIsLiked(!isLiked);
    // Logic for liking in DB...
  };

  const getBadge = (user) => {
    if (user?.subscription_type === 'artist_premium') {
      return <Trophy className="w-3.5 h-3.5 text-[#D4AF37] drop-shadow-[0_0_5px_rgba(212,175,55,0.8)]" />;
    }
    if (user?.subscription_type === 'artist' || (user?.is_premium && !user?.subscription_type)) {
      return <Award className="w-3.5 h-3.5 text-[#D4AF37]" />;
    }
    if (user?.subscription_type === 'auditor') {
      return <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />;
    }
    return null;
  };

  return (
    <div className="relative h-full w-full bg-black flex items-center justify-center snap-start">
      <video
        ref={videoRef}
        src={video.video_url}
        className="h-full w-full object-cover"
        loop
        playsInline
        onClick={togglePlay}
      />

      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />

      {/* Play/Pause Overlay Icon */}
      <AnimatePresence>
        {!isPlaying && (
          <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.5, opacity: 0 }} className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-20 h-20 bg-black/20 backdrop-blur-sm rounded-full flex items-center justify-center">
              <Play className="w-10 h-10 text-white fill-current ml-2" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Info & Actions */}
      <div className="absolute bottom-0 left-0 right-0 p-6 flex items-end justify-between gap-4">
        <div className="flex-grow max-w-[80%] space-y-4">
          <div className="flex items-center gap-3 mb-2">
            <Link to={`/profil/${video.profiles?.id}`}>
              <Avatar className="w-12 h-12 border-2 border-white">
                <AvatarImage src={getPublicImageUrl('avatars', video.profiles?.avatar)} />
                <AvatarFallback className="bg-[#111] text-[#D4AF37] font-black">{video.profiles?.username?.[0]}</AvatarFallback>
              </Avatar>
            </Link>
            <div className="min-w-0">
              <h3 className="font-bold text-white flex items-center gap-1.5 truncate">
                @{video.profiles?.username}
                {getBadge(video.profiles)}
              </h3>
              <p className="text-[10px] text-white/60 font-bold uppercase tracking-widest">{video.profiles?.user_role || 'Artiste'}</p>
            </div>
            <Button size="sm" className="bg-[#D4AF37] text-black h-8 px-4 rounded-full font-bold ml-2">Suivre</Button>
          </div>

          <p className="text-white text-sm leading-snug line-clamp-3">
            {video.caption}
          </p>

          <div className="flex items-center gap-2 text-[#D4AF37] bg-black/40 backdrop-blur-md rounded-full px-4 py-1.5 w-fit border border-[#D4AF37]/30">
            <Music className="w-3.5 h-3.5 animate-spin-slow" />
            <span className="text-[10px] font-black uppercase tracking-tighter truncate max-w-[150px]">
              {video.title || "Son original - KLTUR RAP"}
            </span>
          </div>
        </div>

        {/* Sidebar Actions */}
        <div className="flex flex-col items-center gap-6 mb-2">
          <div className="flex flex-col items-center gap-1">
            <button onClick={handleLike} className={`p-3 rounded-full bg-black/40 backdrop-blur-md border border-white/10 transition-all ${isLiked ? 'text-red-500 scale-110' : 'text-white hover:text-[#D4AF37]'}`}>
              <Heart className={`w-7 h-7 ${isLiked ? 'fill-current' : ''}`} />
            </button>
            <span className="text-white text-[10px] font-black">{video.likes_count || 0}</span>
          </div>

          <div className="flex flex-col items-center gap-1">
            <button className="p-3 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-white hover:text-[#D4AF37]">
              <MessageCircle className="w-7 h-7" />
            </button>
            <span className="text-white text-[10px] font-black">24</span>
          </div>

          <div className="flex flex-col items-center gap-1">
            <button className="p-3 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-white hover:text-[#D4AF37]">
              <Share2 className="w-7 h-7" />
            </button>
            <span className="text-white text-[10px] font-black">Partager</span>
          </div>

          <div className="w-12 h-12 rounded-full border-4 border-[#222] bg-[#111] overflow-hidden animate-spin-slow">
            <img src={video.profiles?.avatar ? getPublicImageUrl('avatars', video.profiles.avatar) : "https://horizons-cdn.hostinger.com/8cb4c9c6-9962-4ccc-80b1-ea71b7a63684/866a587d484c1eedb4c3fd12c56b7757.png"} className="w-full h-full object-cover" alt="" />
          </div>
        </div>
      </div>
    </div>
  );
};

const ShortsPage = () => {
  const [shorts, setShorts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);
  const containerRef = useRef(null);

  useEffect(() => {
    const fetchShorts = async () => {
      try {
        const { data, error } = await supabase
          .from('shorts')
          .select('*, profiles:user_id(*)')
          .order('created_at', { ascending: false });

        if (error) throw error;
        setShorts(data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchShorts();
  }, []);

  const handleScroll = (e) => {
    const scrollPos = e.target.scrollTop;
    const itemHeight = e.target.clientHeight;
    const newIndex = Math.round(scrollPos / itemHeight);
    if (newIndex !== activeIndex) {
      setActiveIndex(newIndex);
    }
  };

  return (
    <>
      <Helmet><title>Shorts - KLTUR RAP</title></Helmet>

      <div className="h-screen bg-black flex flex-col overflow-hidden">
        {/* Header - Fixed Overlay */}
        <div className="absolute top-0 left-0 right-0 z-50 p-4 pointer-events-none">
           <div className="flex items-center justify-between pointer-events-auto">
              <Link to="/" className="text-white hover:text-[#D4AF37] transition-colors">
                <ChevronLeft className="w-8 h-8" />
              </Link>
              <div className="flex gap-4">
                 <span className="text-white font-black uppercase text-xs tracking-[0.3em] border-b-2 border-[#D4AF37] pb-1">Pour toi</span>
                 <span className="text-white/40 font-black uppercase text-xs tracking-[0.3em] pb-1">Abonnements</span>
              </div>
              <div className="w-8" /> {/* Placeholder for balance */}
           </div>
        </div>

        <main
          ref={containerRef}
          onScroll={handleScroll}
          className="flex-grow overflow-y-auto snap-y snap-mandatory h-full scrollbar-hide"
        >
          {loading ? (
            <div className="h-full w-full flex items-center justify-center text-[#D4AF37] font-black animate-pulse uppercase tracking-widest">
              Chargement des Shorts...
            </div>
          ) : shorts.length === 0 ? (
            <div className="h-full w-full flex flex-col items-center justify-center text-center p-8">
               <Play className="w-20 h-20 text-white/10 mb-6" />
               <h2 className="text-2xl font-black text-white uppercase mb-2">Aucun Short pour le moment</h2>
               <p className="text-white/40 text-sm max-w-xs mb-8">Soyez le premier à publier un freestyle de 30 secondes !</p>
               <Button asChild className="bg-[#D4AF37] text-black font-black uppercase rounded-full px-8 h-14">
                  <Link to="/upload">Publier un Short</Link>
               </Button>
            </div>
          ) : (
            shorts.map((video, index) => (
              <ShortVideo
                key={video.id}
                video={video}
                isActive={index === activeIndex}
              />
            ))
          )}
        </main>
      </div>
    </>
  );
};

export default ShortsPage;