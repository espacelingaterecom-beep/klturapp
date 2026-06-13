import React, { useState, useEffect, useRef } from 'react';
import { Helmet } from 'react-helmet';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Users, MessageSquare, Send, Radio, Heart, ChevronLeft, Award, ShieldCheck, Trophy, Share2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { supabase, getPublicImageUrl } from '@/lib/supabaseClient.js';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { Peer } from 'peerjs';

const LiveViewerPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const [liveData, setLiveData] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [isLiked, setIsLiked] = useState(false);
  const [isConnecting, setIsConnecting] = useState(true);

  const videoRef = useRef(null);
  const peerRef = useRef(null);

  const connectToStream = (artistId) => {
    if (!peerRef.current) return;

    setIsConnecting(true);
    const broadcasterId = `live-${artistId.replace(/-/g, '')}`;
    console.log('Connecting to broadcaster:', broadcasterId);

    // Create a dummy canvas stream to wake up PeerJS
    const canvas = document.createElement('canvas');
    canvas.width = 1; canvas.height = 1;
    const dummyStream = canvas.captureStream();

    const call = peerRef.current.call(broadcasterId, dummyStream, {
      metadata: { type: 'viewer' }
    });

    console.log('Call initiated to:', broadcasterId);

    call.on('stream', (remoteStream) => {
      console.log('Received remote stream!');
      setIsConnecting(false);
      if (videoRef.current) {
        videoRef.current.srcObject = remoteStream;
      }
    });

    call.on('error', (err) => {
      console.error('Call error:', err);
      setIsConnecting(false);
      toast.error("Échec de la connexion vidéo.");
    });

    // Timeout if no stream received
    setTimeout(() => {
      if (isConnecting) {
        console.log("Connection timeout");
        setIsConnecting(false);
      }
    }, 10000);
  };

  useEffect(() => {
    const fetchLive = async () => {
      try {
        const { data, error } = await supabase
          .from('live_streams')
          .select('*, profiles:artist_id(*)')
          .eq('id', id)
          .single();

        if (error) throw error;
        if (data.status === 'ended') {
          toast.info("Ce direct est terminé.");
          navigate('/live');
          return;
        }

        setLiveData(data);

        // Connect to the broadcaster
        const peer = new Peer(null, {
          debug: 1,
          config: {
            iceServers: [
              { urls: 'stun:stun.l.google.com:19302' },
              { urls: 'stun:stun1.l.google.com:19302' },
              { urls: 'stun:stun2.l.google.com:19302' },
              { urls: 'stun:stun3.l.google.com:19302' },
              { urls: 'stun:stun4.l.google.com:19302' }
            ]
          }
        });
        peerRef.current = peer;

        peer.on('open', () => {
          console.log('Viewer Peer open');
          connectToStream(data.artist_id);
        });

        peer.on('error', (err) => {
           console.error('Peer error:', err);
           setIsConnecting(false);
        });

        // Fetch existing live comments
        const { data: commentsData } = await supabase
          .from('live_comments')
          .select('*, profiles:user_id(username, avatar)')
          .eq('live_id', id)
          .order('created_at', { ascending: true })
          .limit(50);

        setComments((commentsData || []).map(c => ({
          id: c.id,
          text: c.text,
          username: c.profiles?.username,
          avatar: c.profiles?.avatar
        })));

        // Increment viewer count
        await supabase.rpc('increment_live_viewers', { live_id: id });

      } catch (err) {
        console.error(err);
        toast.error("Impossible de rejoindre le direct.");
        navigate('/live');
      } finally {
        setLoading(false);
      }
    };

    fetchLive();

    // Listen for live status changes and new comments
    const channel = supabase
      .channel(`live-${id}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'live_streams', filter: `id=eq.${id}` }, (payload) => {
        if (payload.new.status === 'ended') {
          toast.info("L'artiste a terminé le direct.");
          navigate('/live');
        }
        setLiveData(prev => ({ ...prev, viewer_count: payload.new.viewer_count }));
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'live_comments', filter: `live_id=eq.${id}` }, async (payload) => {
          // Fetch the user profile for the new comment
          const { data: userProfile } = await supabase
            .from('profiles')
            .select('username, avatar')
            .eq('id', payload.new.user_id)
            .single();

          setComments(prev => [...prev, {
            id: payload.new.id,
            text: payload.new.text,
            username: userProfile?.username || 'Inconnu',
            avatar: userProfile?.avatar
          }]);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      if (peerRef.current) peerRef.current.destroy();
      // Decrement viewer count on leave
      supabase.rpc('decrement_live_viewers', { live_id: id });
    };
  }, [id, navigate]);

  const handleSendComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || !currentUser) return;

    try {
      const { error } = await supabase
        .from('live_comments')
        .insert([{
          live_id: id,
          user_id: currentUser.id,
          text: newComment.trim()
        }]);

      if (error) throw error;
      setNewComment('');
    } catch (err) {
      toast.error("Erreur d'envoi");
    }
  };

  const getBadge = (user) => {
    if (user?.subscription_type === 'artist_premium') return <Trophy className="w-4 h-4 text-[#D4AF37]" />;
    if (user?.subscription_type === 'artist' || user?.is_premium) return <Award className="w-4 h-4 text-[#D4AF37]" />;
    if (user?.subscription_type === 'auditor') return <ShieldCheck className="w-4 h-4 text-blue-400" />;
    return null;
  };

  if (loading) return <div className="h-screen bg-black flex items-center justify-center text-red-500 font-black animate-pulse uppercase tracking-[0.3em]">Connexion au Live...</div>;

  return (
    <>
      <Helmet><title>Regarder {liveData?.profiles?.username} en Direct - KLTUR RAP</title></Helmet>
      <div className="h-screen bg-black flex flex-col md:flex-row overflow-hidden">

        {/* Video Player Section */}
        <div className="flex-grow relative bg-black flex flex-col items-center justify-center">
           <video
             ref={videoRef}
             autoPlay
             playsInline
             className={`w-full h-full object-cover ${isConnecting ? 'opacity-0' : 'opacity-100'} transition-opacity`}
           />

           <AnimatePresence>
             {isConnecting && (
               <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 flex flex-col items-center justify-center bg-[#050505] z-20">
                  <div className="relative mb-12">
                    <div className="absolute inset-0 bg-red-500 rounded-full blur-[100px] opacity-20 animate-pulse" />
                    <Avatar className="h-48 w-40 border-4 border-red-500/20 shadow-2xl">
                       <AvatarImage src={getPublicImageUrl('avatars', liveData?.profiles?.avatar)} />
                       <AvatarFallback className="text-6xl">{liveData?.profiles?.username?.[0]}</AvatarFallback>
                    </Avatar>
                  </div>
                  <div className="text-center space-y-4 px-10">
                     <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Connexion au flux...</h2>
                     <p className="text-white/20 text-[10px] font-bold uppercase tracking-[0.3em] max-w-xs leading-relaxed">
                        L'application établit une liaison directe sécurisée avec l'artiste.
                     </p>
                     <Button
                       variant="outline"
                       onClick={() => connectToStream(liveData?.artist_id)}
                       className="mt-8 border-red-500/30 text-red-500 hover:bg-red-500 hover:text-white font-black uppercase text-[10px] h-10 px-8 rounded-full"
                     >
                       Réessayer la connexion
                     </Button>
                  </div>
               </motion.div>
             )}
           </AnimatePresence>

           {/* Top Info Overlay */}
           <div className="absolute top-6 left-6 right-6 flex justify-between items-start z-30">
              <Link to="/live" className="h-10 w-10 bg-black/40 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-white hover:text-black transition-all shadow-xl border border-white/10">
                 <ChevronLeft className="w-6 h-6" />
              </Link>

              <div className="flex items-center gap-3">
                 <div className="bg-red-600 text-white px-4 py-1.5 rounded-full font-black uppercase text-[10px] tracking-widest flex items-center gap-2 shadow-2xl">
                    <Radio className="w-3 h-3 animate-pulse" /> Live
                 </div>
                 <div className="bg-black/60 backdrop-blur-md text-white px-4 py-1.5 rounded-full font-bold text-[10px] uppercase flex items-center gap-2 border border-white/10">
                    <Users className="w-3 h-3 text-red-500" /> {liveData?.viewer_count || 0}
                 </div>
              </div>
           </div>

           {/* Artist Info Card */}
           <div className="absolute bottom-10 left-6 right-6 z-30 pointer-events-none">
              <div className="bg-black/40 backdrop-blur-xl border border-white/10 p-6 rounded-[32px] inline-flex items-center gap-4 pointer-events-auto shadow-2xl">
                 <Link to={`/profil/${liveData?.profiles?.id}`}>
                    <Avatar className="h-14 w-14 border-2 border-red-500/50">
                       <AvatarImage src={getPublicImageUrl('avatars', liveData?.profiles?.avatar)} />
                       <AvatarFallback className="bg-[#111] text-white font-black">{liveData?.profiles?.username?.[0]}</AvatarFallback>
                    </Avatar>
                 </Link>
                 <div className="min-w-0">
                    <h3 className="text-lg font-black text-white flex items-center gap-2">
                       {liveData?.profiles?.username}
                       {getBadge(liveData?.profiles)}
                    </h3>
                    <p className="text-white/60 text-[10px] font-bold uppercase tracking-widest">{liveData?.title}</p>
                 </div>
                 <Button className="ml-4 bg-red-600 text-white hover:bg-red-700 h-10 px-6 rounded-2xl font-black uppercase text-[10px] tracking-widest">
                    Suivre
                 </Button>
              </div>
           </div>

           {/* Quick Actions Side */}
           <div className="absolute bottom-32 right-6 z-30 flex flex-col gap-6 items-center">
              <button onClick={() => setIsLiked(!isLiked)} className={`p-4 rounded-full bg-black/40 backdrop-blur-md border border-white/10 transition-all ${isLiked ? 'text-red-500 scale-110' : 'text-white'}`}>
                 <Heart className={`w-6 h-6 ${isLiked ? 'fill-current' : ''}`} />
              </button>
              <button className="p-4 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-white">
                 <Share2 className="w-6 h-6" />
              </button>
           </div>
        </div>

        {/* Live Chat Section */}
        <div className="w-full md:w-[400px] h-[400px] md:h-full bg-[#0a0a0a] border-l border-[#222] flex flex-col shrink-0">
           <div className="p-6 border-b border-[#222] flex items-center justify-between bg-black/20">
              <h3 className="font-black uppercase tracking-widest text-sm flex items-center gap-2">
                 <MessageSquare className="w-4 h-4 text-red-500" /> Interaction
              </h3>
              <div className="text-[10px] font-black text-white/20 uppercase tracking-widest">Temps Réel</div>
           </div>

           <div className="flex-grow overflow-y-auto p-6 space-y-5 custom-scrollbar">
              <div className="bg-red-500/5 border border-red-500/10 p-4 rounded-2xl">
                 <p className="text-[10px] text-red-400 font-black uppercase tracking-widest mb-1">Système</p>
                 <p className="text-xs text-white/60">Bienvenue dans le direct de {liveData?.profiles?.username}. Restez respectueux dans vos messages !</p>
              </div>

              {comments.map(c => (
                <div key={c.id} className="flex gap-3 group">
                   <Avatar className="h-8 w-8 shrink-0">
                      <AvatarImage src={getPublicImageUrl('avatars', c.avatar)} />
                      <AvatarFallback>{c.username[0]}</AvatarFallback>
                   </Avatar>
                   <div className="min-w-0">
                      <p className="text-xs">
                         <span className="font-black text-[#D4AF37] mr-2">@{c.username}</span>
                         <span className="text-white/80">{c.text}</span>
                      </p>
                   </div>
                </div>
              ))}
           </div>

           <div className="p-6 bg-black/40 border-t border-white/5">
              <form onSubmit={handleSendComment} className="flex gap-3">
                 <Input
                   value={newComment}
                   onChange={e => setNewComment(e.target.value)}
                   placeholder="Dites quelque chose..."
                   className="bg-[#111] border-[#222] h-12 rounded-2xl focus:border-red-500 text-sm"
                 />
                 <Button type="submit" disabled={!newComment.trim()} className="h-12 w-12 rounded-2xl bg-red-600 hover:bg-red-700 p-0 shrink-0 shadow-lg shadow-red-600/20">
                    <Send className="w-5 h-5" />
                 </Button>
              </form>
           </div>
        </div>

      </div>
    </>
  );
};

export default LiveViewerPage;