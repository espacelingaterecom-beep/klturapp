import { useState, useEffect, useRef } from 'react';
import { Helmet } from 'react-helmet';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, MessageCircle, Share2, Music, Play, ChevronLeft, Send, X } from 'lucide-react';
import { supabase, getPublicImageUrl } from '@/lib/supabaseClient.js';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';

const ShortVideo = ({ video, isActive }) => {
  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [likeId, setLikeId] = useState(null);
  const [likesCount, setLikesCount] = useState(video.likes_count || 0);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState([]);
  const [commentCount, setCommentCount] = useState(video.comments_count || 0);
  const [newComment, setNewComment] = useState('');
  const { currentUser, isAuthenticated } = useAuth();

  const getMediaUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    const { data } = supabase.storage.from('uploads').getPublicUrl(url);
    return data.publicUrl;
  };

  useEffect(() => {
    if (isActive && videoRef.current) {
      videoRef.current.play().catch(() => console.log("Auto-play blocked"));
      setIsPlaying(true);
      checkUserLike();
      fetchCommentCount();
    } else if (videoRef.current) {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  }, [isActive]);

  const checkUserLike = async () => {
    if (!isAuthenticated || !currentUser) return;
    const { data } = await supabase.from('likes').select('id').eq('short_id', video.id).eq('user_id', currentUser.id).maybeSingle();
    if (data) { setIsLiked(true); setLikeId(data.id); }
  };

  const fetchCommentCount = async () => {
    const { count } = await supabase.from('comments').select('*', { count: 'exact', head: true }).eq('short_id', video.id);
    if (count !== null) setCommentCount(count);
  };

  const loadComments = async () => {
    const { data } = await supabase.from('comments').select('*, profiles:user_id(username, avatar)').eq('short_id', video.id).order('created_at', { ascending: false });
    if (data) setComments(data);
  };

  const togglePlay = () => {
    if (isPlaying) videoRef.current.pause();
    else videoRef.current.play();
    setIsPlaying(!isPlaying);
  };

  const handleLike = async () => {
    if (!isAuthenticated) return toast.error("Connectez-vous pour liker");
    try {
      if (isLiked) {
        await supabase.from('likes').delete().eq('id', likeId);
        setIsLiked(false); setLikeId(null); setLikesCount(prev => Math.max(0, prev - 1));
      } else {
        const { data, error } = await supabase.from('likes').insert({ short_id: video.id, user_id: currentUser.id }).select().single();
        if (error) throw error;
        setIsLiked(true); setLikeId(data.id); setLikesCount(prev => prev + 1);
      }
    } catch (err) { toast.error("Erreur de like"); }
  };

  const handlePostComment = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) return toast.error("Connectez-vous pour commenter");
    if (!newComment.trim()) return;
    try {
      const { data, error } = await supabase.from('comments').insert({ short_id: video.id, user_id: currentUser.id, text: newComment.trim() }).select('*, profiles:user_id(username, avatar)').single();
      if (error) throw error;
      setComments(prev => [data, ...prev]); setCommentCount(prev => prev + 1); setNewComment('');
    } catch (err) { toast.error("Erreur d'envoi"); }
  };

  return (
    <div className="relative h-full w-full bg-black flex items-center justify-center snap-start overflow-hidden">
      <video ref={videoRef} src={getMediaUrl(video.video_url)} className="h-full w-full object-cover" loop playsInline onClick={togglePlay} />
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent pointer-events-none" />
      <div className="absolute bottom-0 left-0 right-0 p-6 flex items-end justify-between gap-4 z-10">
        <div className="flex-grow max-w-[80%] space-y-4">
          <div className="flex items-center gap-3 mb-2">
            <Link to={`/profil/${video.profiles?.id}`}><Avatar className="w-12 h-12 border-2 border-white/20"><AvatarImage src={getPublicImageUrl('avatars', video.profiles?.avatar)} /><AvatarFallback className="bg-[#222] text-[#D4AF37] font-black">{video.profiles?.username?.[0]}</AvatarFallback></Avatar></Link>
            <div className="min-w-0"><h3 className="font-bold text-white truncate">@{video.profiles?.username}</h3><p className="text-[10px] text-white/60 font-bold uppercase tracking-widest">{video.profiles?.user_role || 'Artiste'}</p></div>
          </div>
          <p className="text-white text-sm leading-snug line-clamp-2">{video.caption || video.title}</p>
          <div className="flex items-center gap-2 text-[#D4AF37] bg-black/40 backdrop-blur-md rounded-full px-4 py-1.5 w-fit border border-white/10"><Music className="w-3 h-3 animate-spin-slow" /><span className="text-[10px] font-black uppercase tracking-tighter truncate max-w-[150px]">{video.title || "Son original"}</span></div>
        </div>
        <div className="flex flex-col items-center gap-6 mb-2">
          <div className="flex flex-col items-center gap-1"><button onClick={handleLike} className={`p-3 rounded-full bg-black/40 backdrop-blur-md border border-white/10 transition-all ${isLiked ? 'text-red-500 scale-110' : 'text-white'}`}><Heart className={`w-7 h-7 ${isLiked ? 'fill-current' : ''}`} /></button><span className="text-white text-[10px] font-black">{likesCount}</span></div>
          <div className="flex flex-col items-center gap-1"><button onClick={() => { setShowComments(true); loadComments(); }} className="p-3 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-white"><MessageCircle className="w-7 h-7" /></button><span className="text-white text-[10px] font-black">{commentCount}</span></div>
          <button className="p-3 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-white"><Share2 className="w-7 h-7" /></button>
        </div>
      </div>
      <AnimatePresence>
        {showComments && (
          <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} className="absolute inset-0 z-50 bg-black flex flex-col md:w-96 md:left-auto md:right-0 border-l border-white/10">
            <div className="p-4 border-b border-white/10 flex items-center justify-between"><h4 className="font-black uppercase tracking-widest text-sm">Commentaires ({commentCount})</h4><button onClick={() => setShowComments(false)} className="p-2 text-white/50 hover:text-white"><X /></button></div>
            <div className="flex-grow overflow-y-auto p-4 space-y-4">
              {comments.length === 0 ? (<div className="h-full flex flex-col items-center justify-center opacity-20 py-20"><MessageCircle className="w-12 h-12 mb-2" /><p className="text-xs font-bold uppercase tracking-widest">Aucun commentaire</p></div>) : 
              (comments.map(c => (<div key={c.id} className="flex gap-3"><Avatar className="h-8 w-8 shrink-0"><AvatarImage src={getPublicImageUrl('avatars', c.profiles?.avatar)} /><AvatarFallback>{c.profiles?.username?.[0]}</AvatarFallback></Avatar><div className="min-w-0 flex-grow"><p className="text-xs font-black text-[#D4AF37]">@{c.profiles?.username}</p><p className="text-sm text-white/80">{c.text}</p></div></div>)))}
            </div>
            <form onSubmit={handlePostComment} className="p-4 border-t border-white/10 bg-[#111] flex gap-2"><Input value={newComment} onChange={e => setNewComment(e.target.value)} placeholder="Ajouter un commentaire..." className="bg-black border-white/10 h-10" /><Button type="submit" size="icon" className="bg-[#D4AF37] text-black h-10 w-10 shrink-0"><Send className="w-4 h-4" /></Button></form>
          </motion.div>
        )}
      </AnimatePresence>
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
        const { data, error } = await supabase.from('shorts').select('*, profiles:user_id(*)').order('created_at', { ascending: false });
        if (error) throw error;
        setShorts(data || []);
      } catch (err) { console.error(err); } finally { setLoading(false); }
    };
    fetchShorts();
  }, []);

  const handleScroll = (e) => {
    const scrollPos = e.target.scrollTop;
    const itemHeight = e.target.clientHeight;
    const newIndex = Math.round(scrollPos / itemHeight);
    if (newIndex !== activeIndex) setActiveIndex(newIndex);
  };

  return (
    <div className="h-screen bg-black flex flex-col overflow-hidden">
      <Helmet><title>Shorts - KLTUR RAP</title></Helmet>
      <div className="absolute top-0 left-0 right-0 z-50 p-4 pointer-events-none flex items-center justify-between">
        <Link to="/" className="text-white pointer-events-auto"><ChevronLeft className="w-8 h-8" /></Link>
        <span className="text-white font-black uppercase text-xs tracking-widest">KLTUR Shorts</span>
        <div className="w-8" />
      </div>
      <main ref={containerRef} onScroll={handleScroll} className="flex-grow overflow-y-auto snap-y snap-mandatory h-full scrollbar-hide">
        {loading ? (<div className="h-full w-full flex items-center justify-center text-[#D4AF37] font-black animate-pulse uppercase tracking-widest">Chargement...</div>) : 
        shorts.length === 0 ? (<div className="h-full w-full flex flex-col items-center justify-center text-center p-8"><Play className="w-20 h-20 text-white/10 mb-6" /><h2 className="text-2xl font-black text-white uppercase mb-2">Aucun Short</h2><Button asChild className="bg-[#D4AF37] text-black font-black uppercase rounded-full px-8 h-14 mt-4"><Link to="/upload">Publier un Short</Link></Button></div>) : 
        (shorts.map((video, index) => <ShortVideo key={video.id} video={video} isActive={index === activeIndex} />))}
      </main>
    </div>
  );
};

export default ShortsPage;
